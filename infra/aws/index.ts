import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getIamSecrets } from "./iam_secrets";
import { createAmplifyStakingApp } from "../lib/staking/app";

// Secret was created manually in Oregon `us-west-2`
const IAM_SERVER_SSM_ARN = `${process.env["IAM_SERVER_SSM_ARN"]}`;
const PASSPORT_VC_SECRETS_ARN = `${process.env["PASSPORT_VC_SECRETS_ARN"]}`;

const route53Domain = `${process.env["ROUTE_53_DOMAIN"]}`;
const route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
const dockerGtcPassportIamImage = `${process.env["DOCKER_GTC_PASSPORT_IAM_IMAGE"]}`;

const opSepoliaRpcUrl = `${process.env["STAKING_OP_SEPOLIA_RPC_URL"]}`;
const opRpcUrl = `${process.env["STAKING_OP_RPC_URL"]}`;
const mainnetRpcUrl = `${process.env["STAKING_MAINNET_RPC_URL"]}`;
const arbitrumRpcUrl = `${process.env["STAKING_ARBITRUM_RPC_URL"]}`;
const dataDogClientTokenReview = `${process.env["STAKING_DATADOG_CLIENT_TOKEN_REVIEW"]}`;
const dataDogClientTokenStaging = `${process.env["STAKING_DATADOG_CLIENT_TOKEN_STAGING"]}`;
const dataDogClientTokenProduction = `${process.env["STAKING_DATADOG_CLIENT_TOKEN_PRODUCTION"]}`;
const cloudflareZoneId = `${process.env["CLOUDFLARE_ZONE_ID"]}`;

const PROVISION_STAGING_FOR_LOADTEST = `${process.env["PROVISION_STAGING_FOR_LOADTEST"]}`.toLowerCase() === "true";
const walletConnectProjectId = `${process.env["STAKING_WALLET_CONNECT_PROJECT_ID"]}`;
const stakingIntercomAppId = `${process.env["STAKING_INTERCOM_APP_ID"]}`;

const stack = pulumi.getStack();
const region = aws.getRegion({});
const regionId = region.then((r) => r.id);
const coreInfraStack = new pulumi.StackReference(`gitcoin/core-infra/${stack}`);

const vpcId = coreInfraStack.getOutput("vpcId");
const vpcPrivateSubnets = coreInfraStack.getOutput("privateSubnetIds");
const redisConnectionUrl = pulumi.interpolate`${coreInfraStack.getOutput("staticRedisConnectionUrl")}`;

// ALB Data
const albDnsName = coreInfraStack.getOutput("coreAlbDns");
const albZoneId = coreInfraStack.getOutput("coreAlbZoneId");
const albHttpsListenerArn = coreInfraStack.getOutput("coreAlbHttpsListenerArn");
// const albData = coreInfraStack.getOutput("coreAlbData");

const passportDataScienceStack = new pulumi.StackReference(`gitcoin/passport-data/${stack}`);
const passportDataScienceEndpoint = passportDataScienceStack.getOutput("internalAlbBaseUrl");

const snsAlertsTopicArn = coreInfraStack.getOutput("snsAlertsTopicArn");

const defaultTags = {
  ManagedBy: "pulumi",
  PulumiStack: stack,
  Project: "passport",
};

const containerInsightsStatus = stack == "production" ? "enabled" : "disabled";
const logsRetention = Object({
  review: 1,
  staging: 7,
  production: 30,
});

const productionService = {
  memory: 2048, // 2GB
  cpu: 1024, // 1vCPU
};

const serviceResources = Object({
  review: {
    memory: 512, // 512 MiB
    cpu: 256, // 0.25 vCPU
  },
  staging: PROVISION_STAGING_FOR_LOADTEST
    ? productionService
    : {
        memory: 512, // 512 MiB
        cpu: 256, // 0.25 vCPU
      },
  production: productionService,
});

export type AlarmConfigurations = {
  moralisErrorThreshold: number; // threshold for moralis logged errors
  moralisErrorPeriod: number; // period for reporting moralis logged errors
  redisErrorThreshold: number; // threshold for redis logged errors
  redisErrorPeriod: number; // period for reporting redis logged errors
};

const alarmConfigurations: AlarmConfigurations = {
  moralisErrorThreshold: 1, // threshold for moralis logged errors
  moralisErrorPeriod: 1800, // period for moralis logged errors, set to 30 min for now
  redisErrorThreshold: 1, // threshold for redis logged errors
  redisErrorPeriod: 1800, // period for redis logged errors, set to 30 min for now
};

const stakingEnvVars = Object({
  review: {
    NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT: "https://api.review.scorer.gitcoin.co/ceramic-cache",
    NEXT_PUBLIC_SCORER_ENDPOINT: "https://api.review.scorer.gitcoin.co",
    NEXT_PUBLIC_OP_SEPOLIA_RPC_URL: opSepoliaRpcUrl,
    NEXT_PUBLIC_MAINNET_RPC_URL: mainnetRpcUrl,
    NEXT_PUBLIC_OP_RPC_URL: opRpcUrl,
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: dataDogClientTokenReview,
    NEXT_PUBLIC_DATADOG_SERVICE: "staking-app-review",
    NEXT_PUBLIC_DATADOG_ENV: "review",
    NEXT_PUBLIC_ENABLE_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_SEPOLIA: "on",
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: walletConnectProjectId,
    NEXT_PUBLIC_INTERCOM_APP_ID: stakingIntercomAppId,
    NEXT_PUBLIC_ENABLE_ARBITRUM_MAINNET: "on",
    NEXT_PUBLIC_ARBITRUM_RPC_URL: arbitrumRpcUrl,
    NEXT_PUBLIC_GET_GTC_STAKE_API: "https://api.scorer.gitcoin.co/registry/gtc-stake/"
  },
  staging: {
    NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT: "https://api.staging.scorer.gitcoin.co/ceramic-cache",
    NEXT_PUBLIC_SCORER_ENDPOINT: "https://api.staging.scorer.gitcoin.co",
    NEXT_PUBLIC_OP_SEPOLIA_RPC_URL: opSepoliaRpcUrl,
    NEXT_PUBLIC_MAINNET_RPC_URL: mainnetRpcUrl,
    NEXT_PUBLIC_OP_RPC_URL: opRpcUrl,
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: dataDogClientTokenStaging,
    NEXT_PUBLIC_DATADOG_SERVICE: "staking-app-staging",
    NEXT_PUBLIC_DATADOG_ENV: "staging",
    NEXT_PUBLIC_ENABLE_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_SEPOLIA: "on",
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: walletConnectProjectId,
    NEXT_PUBLIC_INTERCOM_APP_ID: stakingIntercomAppId,
    NEXT_PUBLIC_ENABLE_ARBITRUM_MAINNET: "on",
    NEXT_PUBLIC_ARBITRUM_RPC_URL:arbitrumRpcUrl, 
    NEXT_PUBLIC_GET_GTC_STAKE_API: "https://api.scorer.gitcoin.co/registry/gtc-stake/"
  },
  production: {
    NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT: "https://api.scorer.gitcoin.co/ceramic-cache",
    NEXT_PUBLIC_SCORER_ENDPOINT: "https://api.scorer.gitcoin.co",
    NEXT_PUBLIC_OP_SEPOLIA_RPC_URL: opSepoliaRpcUrl,
    NEXT_PUBLIC_MAINNET_RPC_URL: mainnetRpcUrl,
    NEXT_PUBLIC_OP_RPC_URL: opRpcUrl,
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: dataDogClientTokenProduction,
    NEXT_PUBLIC_DATADOG_SERVICE: "staking-app-prod",
    NEXT_PUBLIC_DATADOG_ENV: "prod",
    NEXT_PUBLIC_ENABLE_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_MAINNET: "on",
    NEXT_PUBLIC_ENABLE_OP_SEPOLIA: "off",
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: walletConnectProjectId,
    NEXT_PUBLIC_INTERCOM_APP_ID: stakingIntercomAppId,
    NEXT_PUBLIC_ENABLE_ARBITRUM_MAINNET: "on",
    NEXT_PUBLIC_ARBITRUM_RPC_URL: arbitrumRpcUrl,
    NEXT_PUBLIC_GET_GTC_STAKE_API: "https://api.scorer.gitcoin.co/registry/gtc-stake/"
  },
});

const stakingBranches = Object({
  review: "main",
  staging: "staging-app",
  production: "production-app",
});

//////////////////////////////////////////////////////////////
// Service IAM Role
// can be moved to core infrastructure if it is reused
//////////////////////////////////////////////////////////////

const serviceRole = new aws.iam.Role("passport-ecs-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "EcsAssume",
        Action: "sts:AssumeRole",
        Effect: "Allow",
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
            Resource: [IAM_SERVER_SSM_ARN, PASSPORT_VC_SECRETS_ARN],
          },
        ],
      }),
    },
  ],
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
    unhealthyThreshold: 5,
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
    Name: `passport-iam`,
  },
});

const albListenerRule = new aws.lb.ListenerRule(`passport-iam-https`, {
  listenerArn: albHttpsListenerArn,
  actions: [
    {
      type: "forward",
      targetGroupArn: albTargetGroup.arn,
    },
  ],
  conditions: [
    {
      hostHeader: {
        values: [route53Domain],
      },
      // pathPattern: {[]}
    },
  ],
  tags: {
    ...defaultTags,
    Name: `passport-iam-https`,
  },
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
    Name: `passport-iam`,
  },
});
// do no group the security group definition & rules in the same resource =>
// it will cause the sg to be destroyed and recreated everytime the rules change
// By managing them separately is easier to update the security group rules even outside of this stack
const sgIngressRule80 = new aws.ec2.SecurityGroupRule(
  `passport-iam-80`,
  {
    securityGroupId: serviceSG.id,
    type: "ingress",
    fromPort: 80,
    toPort: 80,
    protocol: "tcp",
    cidrBlocks: ["0.0.0.0/0"], // TODO: improvements: allow only from the ALB's security group id
  },
  {
    dependsOn: [serviceSG],
  }
);

// Allow all outbound traffic
const sgEgressRule = new aws.ec2.SecurityGroupRule(
  `passport-iam-all`,
  {
    securityGroupId: serviceSG.id,
    type: "egress",
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  },
  {
    dependsOn: [serviceSG],
  }
);

//////////////////////////////////////////////////////////////
// ECS Cluster
// can be moved to core infrastructure if it is reused
//////////////////////////////////////////////////////////////

const cluster = new aws.ecs.Cluster(`gitcoin`, {
  name: `gitcoin`,
  // serviceConnectDefaults: {
  //     namespace : //aws.servicediscovery.HttpNamespace
  // }
  settings: [
    {
      name: "containerInsights",
      value: containerInsightsStatus,
    },
  ],
  tags: {
    ...defaultTags,
    Name: `gitcoin`,
  },
});

const serviceLogGroup = new aws.cloudwatch.LogGroup("passport-iam", {
  name: "passport-iam",
  retentionInDays: logsRetention[stack],
  tags: {
    ...defaultTags,
  },
});

//////////////////////////////////////////////////////////////
// CloudWatch Alerts
//////////////////////////////////////////////////////////////

const unhandledErrorsMetric = new aws.cloudwatch.LogMetricFilter("unhandledErrorsMetric", {
  logGroupName: serviceLogGroup.name,
  metricTransformation: {
    defaultValue: "0",
    name: "providerError",
    namespace: "/iam/errors/unhandled",
    unit: "Count",
    value: "1",
  },
  name: "Unhandled Provider Errors",
  pattern: '"UNHANDLED ERROR:" type address',
});

const unhandledErrorsAlarm = new aws.cloudwatch.MetricAlarm("unhandledErrorsAlarm", {
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  datapointsToAlarm: 1,
  evaluationPeriods: 1,
  insufficientDataActions: [],
  metricName: "providerError",
  name: "Unhandled Provider Errors",
  namespace: "/iam/errors/unhandled",
  period: 21600,
  statistic: "Sum",
  threshold: 1,
  treatMissingData: "notBreaching",
});

const redisFilter = new aws.cloudwatch.LogMetricFilter("redisConnectionErrors", {
  logGroupName: serviceLogGroup.name,
  metricTransformation: {
    defaultValue: "0",
    name: "redisConnectionError",
    namespace: "/iam/errors/redis",
    unit: "Count",
    value: "1",
  },
  name: "Redis Connection Error",
  pattern: '"REDIS CONNECTION ERROR:"',
});

const redisErrorAlarm = new aws.cloudwatch.MetricAlarm("redisConnectionErrorsAlarm", {
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  datapointsToAlarm: 1,
  evaluationPeriods: 1,
  insufficientDataActions: [],
  metricName: "redisConnectionError",
  name: "Redis Connection Error",
  namespace: "/iam/errors/redis",
  period: alarmConfigurations.redisErrorPeriod,
  statistic: "Sum",
  threshold: alarmConfigurations.redisErrorThreshold,
  treatMissingData: "notBreaching",
});

const moralisFilter = new aws.cloudwatch.LogMetricFilter("moralisErrors", {
  logGroupName: serviceLogGroup.name,
  metricTransformation: {
    defaultValue: "0",
    name: "moralisError",
    namespace: "/iam/errors/moralis",
    unit: "Count",
    value: "1",
  },
  name: "Redis Connection Error",
  pattern: '"MORALIS ERROR:"',
});

const moralisErrorAlarm = new aws.cloudwatch.MetricAlarm("moralisErrorsAlarm", {
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  datapointsToAlarm: 1,
  evaluationPeriods: 1,
  insufficientDataActions: [],
  metricName: "moralisError",
  name: "Moralis Error",
  namespace: "/iam/errors/moralis",
  period: alarmConfigurations.moralisErrorPeriod,
  statistic: "Sum",
  threshold: alarmConfigurations.moralisErrorThreshold,
  treatMissingData: "notBreaching",
});

//////////////////////////////////////////////////////////////
// ECS Task & Service
//////////////////////////////////////////////////////////////
const containerDefinitions = pulumi
  .all([redisConnectionUrl, passportDataScienceEndpoint])
  .apply(([_redisConnectionUrl, passportDataScienceEndpoint]) =>
    JSON.stringify([
      {
        name: "iam",
        image: dockerGtcPassportIamImage,
        cpu: serviceResources[stack]["cpu"],
        memory: serviceResources[stack]["memory"],
        links: [],
        essential: true,
        portMappings: [
          {
            containerPort: 80,
            hostPort: 80,
            protocol: "tcp",
          },
        ],
        environment: [
          {
            name: "REDIS_URL",
            value: _redisConnectionUrl,
          },
          {
            name: "DATA_SCIENCE_API_URL",
            value: passportDataScienceEndpoint,
          },
        ],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "passport-iam", // "${serviceLogGroup.name}`,
            "awslogs-region": "us-west-2", // `${regionId}`,
            "awslogs-create-group": "true",
            "awslogs-stream-prefix": "iam",
          },
        },
        secrets: getIamSecrets(PASSPORT_VC_SECRETS_ARN, IAM_SERVER_SSM_ARN),
        mountPoints: [],
        volumesFrom: [],
      },
    ])
  );

const taskDefinition = new aws.ecs.TaskDefinition(`passport-iam`, {
  family: `passport-iam`,
  containerDefinitions,
  executionRoleArn: serviceRole.arn,
  cpu: serviceResources[stack]["cpu"],
  memory: serviceResources[stack]["memory"],
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  tags: {
    ...defaultTags,
    EcsService: `passport-iam`,
  },
});

const service = new aws.ecs.Service(
  `passport-iam`,
  {
    cluster: cluster.arn,
    desiredCount: 2,
    enableEcsManagedTags: true,
    enableExecuteCommand: false,
    launchType: "FARGATE",
    loadBalancers: [
      {
        containerName: "iam",
        containerPort: 80,
        targetGroupArn: albTargetGroup.arn,
      },
    ],
    name: `passport-iam`,
    networkConfiguration: {
      subnets: vpcPrivateSubnets,
      securityGroups: [serviceSG.id],
    },
    propagateTags: "TASK_DEFINITION",
    taskDefinition: taskDefinition.arn,
    tags: {
      ...defaultTags,
      Name: `passport-iam`,
    },
  },
  {
    dependsOn: [albTargetGroup, taskDefinition],
  }
);

const ecsAutoScalingTarget = new aws.appautoscaling.Target("autoscaling_target", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
});

const ecsAutoScalingPolicy = new aws.appautoscaling.Policy("passport-autoscaling-policy", {
  policyType: "TargetTrackingScaling",
  resourceId: ecsAutoScalingTarget.resourceId,
  scalableDimension: ecsAutoScalingTarget.scalableDimension,
  serviceNamespace: ecsAutoScalingTarget.serviceNamespace,
  targetTrackingScalingPolicyConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization",
    },
    targetValue: 50,
    scaleInCooldown: 300,
    scaleOutCooldown: 300,
  },
});

const serviceRecord = new aws.route53.Record("passport-record", {
  name: route53Domain,
  zoneId: route53Zone,
  type: "A",
  aliases: [
    {
      name: albDnsName,
      zoneId: albZoneId,
      evaluateTargetHealth: true,
    },
  ],
});

const amplifyAppInfo = coreInfraStack.getOutput("newPassportDomain").apply((domainName) => {
  const stakingAppInfo = createAmplifyStakingApp(
    `${process.env["STAKING_APP_GITHUB_URL"]}`,
    `${process.env["STAKING_APP_GITHUB_ACCESS_TOKEN_FOR_AMPLIFY"]}`,
    domainName,
    stack === "production" ? `passport.xyz` : "", // cloudflareDomain
    stack === "production" ? cloudflareZoneId : "", // cloudFlareZoneId
    "stake",
    stakingBranches[stack],
    stakingEnvVars[stack],
    { ...defaultTags, Name: "staking-app" },
    (process.env["STAKING_APP_ENABLE_AUTH"] || "false").toLowerCase() == "true",
    process.env["STAKING_APP_BASIC_AUTH_USERNAME"],
    process.env["STAKING_APP_BASIC_AUTH_PASSWORD"]
  );
  return stakingAppInfo;
});

export const amplifyAppHookUrl = pulumi.secret(amplifyAppInfo.webHook.url);
