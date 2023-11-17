import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Secret was created manually in Oregon `us-west-2`
const IAM_SERVER_SSM_ARN = `${process.env["IAM_SERVER_SSM_ARN"]}`;
const PASSPORT_VC_SECRETS_ARN = `${process.env["PASSPORT_VC_SECRETS_ARN"]}`;

const route53Domain = `${process.env["ROUTE_53_DOMAIN"]}`;
const route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
const dockerGtcPassportIamImage = `${process.env["DOCKER_GTC_PASSPORT_IAM_IMAGE"]}`;

const stack = pulumi.getStack();
const region = aws.getRegion({});
const regionId = region.then(r => r.id);
const coreInfraStack = new pulumi.StackReference(`gitcoin/core-infra/${stack}`);

const vpcId = coreInfraStack.getOutput("vpcId");
const vpcPrivateSubnets = coreInfraStack.getOutput("privateSubnetIds");
const redisConnectionUrl = coreInfraStack.getOutput("staticRedisConnectionUrl");
// ALB Data 
const albDnsName = coreInfraStack.getOutput("coreAlbDns");
const albZoneId = coreInfraStack.getOutput("coreAlbZoneId");
const albHttpsListenerArn = coreInfraStack.getOutput("coreAlbHttpsListenerArn");
// const albData = coreInfraStack.getOutput("coreAlbData");

const defaultTags = {
    ManagedBy: "pulumi",
    PulumiStack: stack,
    Project: "passport"
};

const containerInsightsStatus = stack == "production" ? "enabled" : "disabled"

//////////////////////////////////////////////////////////////
// Service IAM Role
// can be moved to core infrastructure if it is reused
//////////////////////////////////////////////////////////////

const serviceRole = new aws.iam.Role("passport-ecs-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Sid: "EcsAssume",
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    inlinePolicies: [{
        name: "allow_iam_secrets_access",
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: ["secretsmanager:GetSecretValue"],
                Effect: "Allow",
                Resource: [ IAM_SERVER_SSM_ARN,PASSPORT_VC_SECRETS_ARN ]
            }],
        }),
    }],
    managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
    tags: {
        ...defaultTags,
    },
});

//////////////////////////////////////////////////////////////
// Load Balancer listerner rule & target group
//////////////////////////////////////////////////////////////

const albTargetGroup = new aws.lb.TargetGroup(`passport-iam`, {
    name: `passport-iam`,
    vpcId: vpcId,
    healthCheck: {
        enabled: true,
        healthyThreshold: 3,
        interval: 30,
        matcher: "200",
        path: "/health",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 5
    },
    port: 80,
    protocol: "HTTP",
    // stickiness: { // is Stickiness required ?
    //     type: "app_cookie",
    //     cookieName: "gtc-passport",
    //     cookieDuration: 86400,
    //     enabled: true
    // },
    targetType: "ip",
    tags: {
        ...defaultTags,
        Name: `passport-iam`
    }
});

const albListenerRule = new aws.lb.ListenerRule(`passport-iam-https`, {
    listenerArn: albHttpsListenerArn,
    actions: [{
        type: "forward",
        targetGroupArn: albTargetGroup.arn
    }],
    conditions: [{
        hostHeader: {
            values: [route53Domain]
        },
        // pathPattern: {[]}
    }],
    tags: {
        ...defaultTags,
        Name: `passport-iam-https`
    }
});

//////////////////////////////////////////////////////////////
// Service SG
//////////////////////////////////////////////////////////////

const serviceSG = new aws.ec2.SecurityGroup(`passport-iam`, {
    name: `passport-iam`,
    vpcId: vpcId,
    description: `Security Group for passport-iam service.`,
    tags: {
        ...defaultTags,
        Name: `passport-iam`
    }
});
// do no group the security group definition & rules in the same resource =>
// it will cause the sg to be destroyed and recreated everytime the rules change
// By managing them separately is easier to update the security group rules even outside of this stack
const sgIngressRule80 = new aws.ec2.SecurityGroupRule(`passport-iam-80`, {
    securityGroupId: serviceSG.id,
    type: "ingress",
    fromPort: 80,
    toPort: 80,
    protocol: "tcp",
    cidrBlocks: ["0.0.0.0/0"]  // TODO: improvements: allow only from the ALB's security group id
}, {
    dependsOn: [serviceSG]
});

// Allow all outbound traffic
const sgEgressRule = new aws.ec2.SecurityGroupRule(`passport-iam-all`, {
    securityGroupId: serviceSG.id,
    type: "egress",
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"]
}, {
    dependsOn: [serviceSG]
});

//////////////////////////////////////////////////////////////
// ECS Cluster
// can be moved to core infrastructure if it is reused
//////////////////////////////////////////////////////////////

const cluster = new aws.ecs.Cluster(`gitcoin`,
    {
        name: `gitcoin`,
        // serviceConnectDefaults: {
        //     namespace : //aws.servicediscovery.HttpNamespace
        // }
        settings: [{
            name: "containerInsights",
            value: containerInsightsStatus,
        }],
        tags: {
            ...defaultTags,
            Name: `gitcoin`
        }
    }
);

const serviceLogGroup = new aws.cloudwatch.LogGroup("passport-iam", {
    name: "passport-iam",
    retentionInDays: 1, // TODO: make it as a paramater and change it for production & staging
    tags: {
      ...defaultTags
    }
});

// TaskDefinition
const taskDefinition = new aws.ecs.TaskDefinition(`passport-iam`, {
    family: `passport-iam`,
    containerDefinitions: JSON.stringify([{
        name: "iam",
        image: dockerGtcPassportIamImage,
        cpu: 2048,
        memory: 4096,
        links: [],
        essential: true,
        portMappings: [{
            containerPort: 80,
            hostPort: 80,
            protocol: "tcp"
        }],
        environment: [{
            name: "CGRANTS_API_URL",
            value: "https://api.scorer.gitcoin.co/cgrants"
        }],
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": "passport-iam", // "${serviceLogGroup.name}`,
                "awslogs-region": `${regionId}`,
                "awslogs-create-group": "true",
                "awslogs-stream-prefix": "iam"
            }
        },
        secrets: [
            {
              name: "IAM_JWK",
              valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK::`,
            },
            {
              name: "GOOGLE_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CLIENT_ID::`,
            },
            {
              name: "GOOGLE_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CLIENT_SECRET::`,
            },
            {
              name: "GOOGLE_CALLBACK",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CALLBACK::`,
            },
            {
              name: "TWITTER_CALLBACK",
              valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CALLBACK::`,
            },
            {
              name: "RPC_URL",
              valueFrom: `${IAM_SERVER_SSM_ARN}:MAINNET_RPC_URL::`,
            },
            {
              name: "ALCHEMY_API_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:ALCHEMY_API_KEY::`,
            },
            {
              name: "TWITTER_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CLIENT_ID::`,
            },
            {
              name: "TWITTER_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CLIENT_SECRET::`,
            },
            {
              name: "FACEBOOK_APP_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:FACEBOOK_APP_ID::`,
            },
            {
              name: "FACEBOOK_APP_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:FACEBOOK_APP_SECRET::`,
            },
            {
              name: "BRIGHTID_PRIVATE_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:BRIGHTID_PRIVATE_KEY::`,
            },
            {
              name: "GITHUB_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GITHUB_CLIENT_ID::`,
            },
            {
              name: "GITHUB_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GITHUB_CLIENT_SECRET::`,
            },
            {
              name: "GRANT_HUB_GITHUB_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GRANT_HUB_GITHUB_CLIENT_ID::`,
            },
            {
              name: "GRANT_HUB_GITHUB_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GRANT_HUB_GITHUB_CLIENT_SECRET::`,
            },
            {
              name: "LINKEDIN_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CLIENT_ID::`,
            },
            {
              name: "LINKEDIN_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CLIENT_SECRET::`,
            },
            {
              name: "LINKEDIN_CALLBACK",
              valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CALLBACK::`,
            },
            {
              name: "DISCORD_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CLIENT_ID::`,
            },
            {
              name: "DISCORD_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CLIENT_SECRET::`,
            },
            {
              name: "DISCORD_CALLBACK",
              valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CALLBACK::`,
            },
            {
              name: "ETHERSCAN_API_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:ETHERSCAN_API_KEY::`,
            },
            {
              name: "POLYGON_RPC_URL",
              valueFrom: `${IAM_SERVER_SSM_ARN}:POLYGON_RPC_URL::`,
            },
            {
              name: "CGRANTS_API_TOKEN",
              valueFrom: `${IAM_SERVER_SSM_ARN}:CGRANTS_API_TOKEN::`,
            },
            {
              name: "GTC_STAKING_GRAPH_API_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GTC_STAKING_GRAPH_API_KEY::`,
            },
            {
              name: "GTC_STAKING_ROUNDS",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GTC_STAKING_ROUNDS::`,
            },
            {
              name: "COINBASE_CLIENT_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CLIENT_ID::`,
            },
            {
              name: "COINBASE_CLIENT_SECRET",
              valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CLIENT_SECRET::`,
            },
            {
              name: "COINBASE_CALLBACK",
              valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CALLBACK::`,
            },
            {
              name: "ATTESTATION_SIGNER_PRIVATE_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:ATTESTATION_SIGNER_PRIVATE_KEY::`,
            },
            {
              name: "GITCOIN_VERIFIER_CHAIN_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:GITCOIN_VERIFIER_CHAIN_ID::`,
            },
            {
              name: "ALLO_SCORER_ID",
              valueFrom: `${IAM_SERVER_SSM_ARN}:ALLO_SCORER_ID::`,
            },
            {
              name: "SCORER_ENDPOINT",
              valueFrom: `${IAM_SERVER_SSM_ARN}:SCORER_ENDPOINT::`,
            },
            {
              name: "SCORER_API_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:SCORER_API_KEY::`,
            },
            {
              name: "EAS_GITCOIN_STAMP_SCHEMA",
              valueFrom: `${IAM_SERVER_SSM_ARN}:EAS_GITCOIN_STAMP_SCHEMA::`,
            },
            {
              name: "FF_NEW_GITHUB_STAMPS",
              valueFrom: `${IAM_SERVER_SSM_ARN}:FF_NEW_GITHUB_STAMPS::`,
            },
            {
              name: "INCLUDE_TESTNETS",
              valueFrom: `${IAM_SERVER_SSM_ARN}:INCLUDE_TESTNETS::`,
            },
            {
              name: "ZKSYNC_ERA_MAINNET_ENDPOINT",
              valueFrom: `${IAM_SERVER_SSM_ARN}:ZKSYNC_ERA_MAINNET_ENDPOINT::`,
            },
            {
              name: "PASSPORT_SCORER_BACKEND",
              valueFrom: `${IAM_SERVER_SSM_ARN}:PASSPORT_SCORER_BACKEND::`,
            },
            {
              name: "TRUSTA_LABS_ACCESS_TOKEN",
              valueFrom: `${IAM_SERVER_SSM_ARN}:TRUSTA_LABS_ACCESS_TOKEN::`,
            },
            {
              name: "MORALIS_API_KEY",
              valueFrom: `${IAM_SERVER_SSM_ARN}:MORALIS_API_KEY::`,
            },
            {
              name: "IAM_JWK_EIP712",
              valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK_EIP712::`,
            },
          ],
        mountPoints: [],
        volumesFrom: []
    }]),
    executionRoleArn: serviceRole.arn,
    cpu: "2048",
    memory: "4096",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    tags: {
      ...defaultTags,
      EcsService: `passport-iam`
    }
});

const service = new aws.ecs.Service(`passport-iam`, {
  cluster: cluster.arn,
  desiredCount: 1,
  enableEcsManagedTags: true,
  enableExecuteCommand: false,
  launchType: "FARGATE",
  loadBalancers: [{
      containerName: "iam",
      containerPort: 80,
      targetGroupArn: albTargetGroup.arn
  }],
  name: `passport-iam`,
  networkConfiguration: {
      subnets: vpcPrivateSubnets,
      securityGroups: [serviceSG.id]
  },
  propagateTags: "TASK_DEFINITION",
  taskDefinition: taskDefinition.arn,
  tags: {
      ...defaultTags,
      Name: `passport-iam`
  }
}, {
  dependsOn: [albTargetGroup, taskDefinition]
});

const ecsTarget = new aws.appautoscaling.Target("autoscaling_target", {
    maxCapacity: 10,
    minCapacity: 1,
    resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs",
});

const serviceRecord = new aws.route53.Record("passport-record", {
    name: route53Domain,
    zoneId: route53Zone,
    type: "A",
    aliases: [{
      name: albDnsName,
      zoneId: albZoneId,
      evaluateTargetHealth: true
    }]
});

