import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// The following vars are not allowed to be undefined, hence the `${...}` magic

let route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
let domain = `${process.env["DOMAIN"]}`;
let IAM_SERVER_SSM_ARN = `${process.env["IAM_SERVER_SSM_ARN"]}`;

export const dockerGtcPassportIamImage = `${process.env["DOCKER_GTC_PASSPORT_IAM_IMAGE"]}`;

//////////////////////////////////////////////////////////////
// Set up VPC
//////////////////////////////////////////////////////////////

const vpc = new awsx.ec2.Vpc("gitcoin", {
  subnets: [{ type: "public" }, { type: "private", mapPublicIpOnLaunch: true }],
});

export const vpcID = vpc.id;
export const vpcPrivateSubnetIds = vpc.privateSubnetIds;
export const vpcPublicSubnetIds = vpc.publicSubnetIds;

export const vpcPublicSubnet1 = vpcPublicSubnetIds.then((subnets) => {
  return subnets[0];
});

//////////////////////////////////////////////////////////////
// Set up ALB and ECS cluster
//////////////////////////////////////////////////////////////

const cluster = new awsx.ecs.Cluster("gitcoin", { vpc });
// export const clusterInstance = cluster;
export const clusterId = cluster.id;

// Generate an SSL certificate
const certificate = new aws.acm.Certificate("cert", {
  domainName: domain,
  tags: {
    Environment: "production",
  },
  validationMethod: "DNS",
});

const certificateValidationDomain = new aws.route53.Record(`${domain}-validation`, {
  name: certificate.domainValidationOptions[0].resourceRecordName,
  zoneId: route53Zone,
  type: certificate.domainValidationOptions[0].resourceRecordType,
  records: [certificate.domainValidationOptions[0].resourceRecordValue],
  ttl: 600,
});

const certificateValidation = new aws.acm.CertificateValidation(
  "certificateValidation",
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: [certificateValidationDomain.fqdn],
  },
  { customTimeouts: { create: "30s", update: "30s" } }
);

// Creates an ALB associated with our custom VPC.
const alb = new awsx.lb.ApplicationLoadBalancer(`gitcoin-service`, { vpc });

// Listen to HTTP traffic on port 80 and redirect to 443
const httpListener = alb.createListener("web-listener", {
  port: 80,
  protocol: "HTTP",
  defaultAction: {
    type: "redirect",
    redirect: {
      protocol: "HTTPS",
      port: "443",
      statusCode: "HTTP_301",
    },
  },
});

// Target group with the port of the Docker image
const target = alb.createTargetGroup("web-target", {
  vpc,
  port: 80,
  healthCheck: { path: "/health", unhealthyThreshold: 5 },
  stickiness: {
    type: "app_cookie",
    cookieName: "gtc-passport",
  },
});

// Listen to traffic on port 443 & route it through the target group
const httpsListener = target.createListener("web-listener", {
  port: 443,
  certificateArn: certificateValidation.certificateArn,
});

// Create a DNS record for the load balancer
const www = new aws.route53.Record("www", {
  zoneId: route53Zone,
  name: domain,
  type: "A",
  aliases: [
    {
      name: httpsListener.endpoint.hostname,
      zoneId: httpsListener.loadBalancer.loadBalancer.zoneId,
      evaluateTargetHealth: true,
    },
  ],
});

const dpoppEcsRole = new aws.iam.Role("dpoppEcsRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Sid: "",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  }),
  inlinePolicies: [
    {
      name: "allow_iam_secrets_access",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["secretsmanager:GetSecretValue"],
            Effect: "Allow",
            Resource: IAM_SERVER_SSM_ARN,
          },
        ],
      }),
    },
  ],
  managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
  tags: {
    dpopp: "",
  },
});

const service = new awsx.ecs.FargateService("dpopp-iam", {
  cluster,
  desiredCount: 1,
  subnets: vpc.privateSubnetIds,
  taskDefinitionArgs: {
    executionRole: dpoppEcsRole,
    containers: {
      iam: {
        image: dockerGtcPassportIamImage,
        memory: 2048,
        cpu: 1000,
        portMappings: [httpsListener],
        links: [],
        environment: [
          {
            name: "CGRANTS_API_URL",
            value: "https://api.scorer.gitcoin.co/cgrants",
          },
        ],
        secrets: [
          {
            name: "IAM_JWK",
            valueFrom: `${IAM_SERVER_SSM_ARN}:IAM_JWK::`,
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
            name: "GTC_STAKING_ROUND",
            valueFrom: `${IAM_SERVER_SSM_ARN}:GTC_STAKING_ROUND::`,
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
        ],
      },
    },
  },
});

const ecsIamServiceAutoscalingTarget = new aws.appautoscaling.Target("autoscaling_target", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.cluster.name}/${service.service.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
});

const ecsScorerServiceAutoscaling = new aws.appautoscaling.Policy("scorer-autoscaling-policy", {
  policyType: "TargetTrackingScaling",
  resourceId: ecsIamServiceAutoscalingTarget.resourceId,
  scalableDimension: ecsIamServiceAutoscalingTarget.scalableDimension,
  serviceNamespace: ecsIamServiceAutoscalingTarget.serviceNamespace,
  targetTrackingScalingPolicyConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization",
    },
    targetValue: 30,
    scaleInCooldown: 300,
    scaleOutCooldown: 300,
  },
});
