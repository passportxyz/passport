import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as op from "@1password/op-js";
import * as cloudflare from "@pulumi/cloudflare";
import { createAmplifyApp } from "../lib/amplify/app";
import { secretsManager } from "infra-libs";

const stack = pulumi.getStack();

const current = aws.getCallerIdentity({});
const regionData = aws.getRegion({});
const DOCKER_IMAGE_TAG = `${process.env.DOCKER_IMAGE_TAG || ""}`;
export const dockerGtcPassportIamImage = pulumi
  .all([current, regionData])
  .apply(([acc, region]) => `${acc.accountId}.dkr.ecr.${region.id}.amazonaws.com/passport:${DOCKER_IMAGE_TAG}`);

const PROVISION_STAGING_FOR_LOADTEST =
  op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PROVISION_STAGING_FOR_LOADTEST`).toLowerCase() === "true";

const PASSPORT_VC_SECRETS_ARN = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_VC_SECRETS_ARN`);

const route53Domain = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/ROUTE_53_DOMAIN`);
const route53Zone = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/ROUTE_53_ZONE`);
const cloudflareZoneId = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/CLOUDFLARE_ZONE_ID`);

const coreInfraStack = new pulumi.StackReference(`passportxyz/core-infra/${stack}`);

const vpcId = coreInfraStack.getOutput("vpcId");
const vpcPrivateSubnets = coreInfraStack.getOutput("privateSubnetIds");
const redisConnectionUrl = pulumi.interpolate`${coreInfraStack.getOutput("staticRedisConnectionUrl")}`;

// ALB Data
const albDnsName = coreInfraStack.getOutput("coreAlbDns");
const albZoneId = coreInfraStack.getOutput("coreAlbZoneId");
const albHttpsListenerArn = coreInfraStack.getOutput("coreAlbHttpsListenerArn");

const passportDataScienceStack = new pulumi.StackReference(`passportxyz/passport-data/${stack}`);
const passportDataScienceEndpoint = passportDataScienceStack.getOutput("internalAlbBaseUrl");

const snsAlertsTopicArn = coreInfraStack.getOutput("snsAlertsTopicArn");

const passportXyzDomainName = coreInfraStack.getOutput("passportXyzDomainName");
const passportXyzHostedZoneId = coreInfraStack.getOutput("passportXyzHostedZoneId");

const defaultTags = {
  ManagedBy: "pulumi",
  PulumiStack: stack,
  Project: "passport",
};

const containerInsightsStatus = stack == "production" ? "enabled" : "disabled";

// Manage secrets & envs for Passport XYZ 
const passportXyzIamSecretObject = new aws.secretsmanager.Secret("iam-secret-passport-xyz", {
  name: "iam-secret-passport-xyz",
  description: "Secrets for Passport IAM on Passport XYZ",
  tags: {
    ...defaultTags,
  },
});

const passportXyzIamSecrets = secretsManager
  .syncSecretsAndGetRefs({
    vault: "DevOps",
    repo: "passport-xyz",
    env: stack,
    section: "iam",
    targetSecret: passportXyzIamSecretObject,
    secretVersionName: "passport-xyz-secret-version",
  })
  .apply((secretRefs) =>
    [
      ...secretRefs,
      {
        name: "IAM_JWK",
        valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK::`,
      },
      {
        name: "IAM_JWK_EIP712",
        valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK_EIP712::`,
      },
    ].sort(secretsManager.sortByName)
  );

const passportXyzIamEnvironment = pulumi
  .all([
    secretsManager.getEnvironmentVars({
      vault: "DevOps",
      repo: "passport-xyz",
      env: stack,
      section: "iam",
    }),
    redisConnectionUrl,
    passportDataScienceEndpoint,
  ])
  .apply(([managedEnvVars, _redisConnectionUrl, passportDataScienceEndpoint]) =>
    [
      ...managedEnvVars,
      {
        name: "REDIS_URL",
        value: _redisConnectionUrl,
      },
      {
        name: "DATA_SCIENCE_API_URL",
        value: passportDataScienceEndpoint,
      },
    ].sort(secretsManager.sortByName)
  );


const passportXyzAppEnvironment = secretsManager
  .getEnvironmentVars({
    vault: "DevOps",
    repo: "passport-xyz",
    env: stack,
    section: "app",
  })
  .reduce((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }, {} as Record<string, string | pulumi.Output<any>>);

// Manage secrets & envs for Gitcoin

const gitcoinIamSecretObject = new aws.secretsmanager.Secret("iam-secret", {
  name: "iam-secret",
  description: "Secrets for Passport IAM",
  tags: {
    ...defaultTags,
  },
});

const gitcoinIamSecrets = secretsManager
  .syncSecretsAndGetRefs({
    vault: "DevOps",
    repo: "passport-gitcoin",
    env: stack,
    section: "iam",
    targetSecret: gitcoinIamSecretObject,
    secretVersionName: "passport-secret-version",
  })
  .apply((secretRefs) =>
    [
      ...secretRefs,
      {
        name: "IAM_JWK",
        valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK::`,
      },
      {
        name: "IAM_JWK_EIP712",
        valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK_EIP712::`,
      },
    ].sort(secretsManager.sortByName)
  );

const gitcoinIamEnvironment = pulumi
  .all([
    secretsManager.getEnvironmentVars({
      vault: "DevOps",
      repo: "passport-gitcoin",
      env: stack,
      section: "iam",
    }),
    redisConnectionUrl,
    passportDataScienceEndpoint,
  ])
  .apply(([managedEnvVars, _redisConnectionUrl, passportDataScienceEndpoint]) =>
    [
      ...managedEnvVars,
      {
        name: "REDIS_URL",
        value: _redisConnectionUrl,
      },
      {
        name: "DATA_SCIENCE_API_URL",
        value: passportDataScienceEndpoint,
      },
    ].sort(secretsManager.sortByName)
  );


const gitcoinAppEnvironment = secretsManager
  .getEnvironmentVars({
    vault: "DevOps",
    repo: "passport-gitcoin",
    env: stack,
    section: "app",
  })
  .reduce((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }, {} as Record<string, string | pulumi.Output<any>>);



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
      name: "allow_iam_xyz_secrets_access",
      policy: passportXyzIamSecretObject.arn.apply((iamSecretArn) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: ["secretsmanager:GetSecretValue"],
              Effect: "Allow",
              Resource: [iamSecretArn, PASSPORT_VC_SECRETS_ARN],
            },
          ],
        })
      ),
    },
    {
      name: "allow_iam_secrets_access",
      policy: gitcoinIamSecretObject.arn.apply((iamSecretArn) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: ["secretsmanager:GetSecretValue"],
              Effect: "Allow",
              Resource: [iamSecretArn, PASSPORT_VC_SECRETS_ARN],
            },
          ],
        })
      ),
    }
  ],
  managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
  tags: {
    ...defaultTags,
  },
});

//////////////////////////////////////////////////////////////
// Load Balancer listerner rule & target group
//////////////////////////////////////////////////////////////

const albPassportXyzTargetGroup = new aws.lb.TargetGroup(`passport-xyz-iam`, {
  name: `passport-xyz-iam`,
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
  targetType: "ip",
  tags: {
    ...defaultTags,
    Name: `passport-xyz-iam`,
  },
});

const albPassportXyzListenerRule = new aws.lb.ListenerRule(`passport-xyz-iam-https`, {
  listenerArn: albHttpsListenerArn,
  priority: 100, // This needs to be grater than the priority number for passport-scroll-badge-service
  actions: [
    {
      type: "forward",
      targetGroupArn: albPassportXyzTargetGroup.arn,
    },
  ],
  conditions: [
    {
      hostHeader: {
        values: [passportXyzDomainName.apply((domain) => `iam.${domain}`)],
      },
      // pathPattern: {[]}
    },
  ],
  tags: {
    ...defaultTags,
    Name: `passport-xyz-iam-https`,
  },
});


const albGitcoinTargetGroup = new aws.lb.TargetGroup(`passport-iam`, {
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
  targetType: "ip",
  tags: {
    ...defaultTags,
    Name: `passport-iam`,
  },
});

const albGitcoinListenerRule = new aws.lb.ListenerRule(`passport-iam-https`, {
  listenerArn: albHttpsListenerArn,
  priority: 101, // This needs to be grater than the priority number for passport-scroll-badge-service
  actions: [
    {
      type: "forward",
      targetGroupArn: albGitcoinTargetGroup.arn,
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

export const passportClusterArn = cluster.arn;
export const passportClusterName = cluster.name;

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
// Passport XYZ 
const passportXyzContainerDefinitions = pulumi
  .all([dockerGtcPassportIamImage, passportXyzIamSecrets, passportXyzIamEnvironment])
  .apply(([_dockerGtcPassportIamImage, secrets, environment]) => {
    return JSON.stringify([
      {
        name: "iam",
        image: _dockerGtcPassportIamImage,
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
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "passport-iam", // "${serviceLogGroup.name}`,
            "awslogs-region": "us-west-2", // `${regionId}`,
            "awslogs-create-group": "true",
            "awslogs-stream-prefix": "iam",
          },
        },
        mountPoints: [],
        volumesFrom: [],
        environment,
        secrets,
      },
    ]);
  });

const passportXyzTaskDefinition = new aws.ecs.TaskDefinition(`passport-xyz-iam`, {
  family: `passport-xyz-iam`,
  containerDefinitions: passportXyzContainerDefinitions,
  executionRoleArn: serviceRole.arn,
  cpu: serviceResources[stack]["cpu"],
  memory: serviceResources[stack]["memory"],
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  tags: {
    ...defaultTags,
    EcsService: `passport-xyz-iam`,
  },
});

const passportXyzService = new aws.ecs.Service(
  `passport-xyz-iam`,
  {
    cluster: cluster.arn,
    desiredCount: stack === "production" ? 2 : 1,
    enableEcsManagedTags: true,
    enableExecuteCommand: false,
    launchType: "FARGATE",
    loadBalancers: [
      {
        containerName: "iam",
        containerPort: 80,
        targetGroupArn: albPassportXyzTargetGroup.arn,
      },
    ],
    name: `passport-xyz-iam`,
    networkConfiguration: {
      subnets: vpcPrivateSubnets,
      securityGroups: [serviceSG.id],
    },
    propagateTags: "TASK_DEFINITION",
    taskDefinition: passportXyzTaskDefinition.arn,
    tags: {
      ...defaultTags,
      Name: `passport-xyz-iam`,
    },
  },
  {
    dependsOn: [albPassportXyzTargetGroup, passportXyzTaskDefinition],
  }
);

const ecsAutoScalingTargetXyz = new aws.appautoscaling.Target("autoscaling_target_xyz", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${passportXyzService.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
});

const ecsAutoScalingPolicyXyz = new aws.appautoscaling.Policy("passport-autoscaling-policy-xyz", {
  policyType: "TargetTrackingScaling",
  resourceId: ecsAutoScalingTargetXyz.resourceId,
  scalableDimension: ecsAutoScalingTargetXyz.scalableDimension,
  serviceNamespace: ecsAutoScalingTargetXyz.serviceNamespace,
  targetTrackingScalingPolicyConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization",
    },
    targetValue: 50,
    scaleInCooldown: 300,
    scaleOutCooldown: 300,
  },
});

export const serviceRecordXyz = new aws.route53.Record("passport-xyz-record", {
  name: "iam",
  zoneId: passportXyzHostedZoneId,
  type: "CNAME",
  ttl: 300,
  records: [albDnsName],
});

// CloudFlare Record 

const cloudflareIamRecord = stack === "production" ? new cloudflare.Record(`iam-passport-xyz-record`, {
  name: `iam`,
  zoneId: cloudflareZoneId,
  type: "CNAME",
  value: albDnsName,
  allowOverwrite: true,
  comment: `Points to IAM service running on AWS ECS task`,
}) : "";

// Gitcoin domain

const gitcoinContainerDefinitions = pulumi
  .all([dockerGtcPassportIamImage, gitcoinIamSecrets, gitcoinIamEnvironment])
  .apply(([_dockerGtcPassportIamImage, secrets, environment]) => {
    return JSON.stringify([
      {
        name: "iam",
        image: _dockerGtcPassportIamImage,
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
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "passport-iam", // "${serviceLogGroup.name}`,
            "awslogs-region": "us-west-2", // `${regionId}`,
            "awslogs-create-group": "true",
            "awslogs-stream-prefix": "iam",
          },
        },
        mountPoints: [],
        volumesFrom: [],
        environment,
        secrets,
      },
    ]);
  });

const gitcoinTaskDefinition = new aws.ecs.TaskDefinition(`passport-iam`, {
  family: `passport-iam`,
  containerDefinitions: gitcoinContainerDefinitions,
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

const gitcoinService = new aws.ecs.Service(
  `passport-iam`,
  {
    cluster: cluster.arn,
    desiredCount: stack === "production" ? 2 : 1,
    enableEcsManagedTags: true,
    enableExecuteCommand: false,
    launchType: "FARGATE",
    loadBalancers: [
      {
        containerName: "iam",
        containerPort: 80,
        targetGroupArn: albGitcoinTargetGroup.arn,
      },
    ],
    name: `passport-iam`,
    networkConfiguration: {
      subnets: vpcPrivateSubnets,
      securityGroups: [serviceSG.id],
    },
    propagateTags: "TASK_DEFINITION",
    taskDefinition: gitcoinTaskDefinition.arn,
    tags: {
      ...defaultTags,
      Name: `passport-iam`,
    },
  },
  {
    dependsOn: [albGitcoinTargetGroup, gitcoinTaskDefinition],
  }
);

const gitcoinEcsAutoScalingTarget = new aws.appautoscaling.Target("autoscaling_target", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${gitcoinService.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
});

const gitcoinEcsAutoScalingPolicy = new aws.appautoscaling.Policy("passport-autoscaling-policy", {
  policyType: "TargetTrackingScaling",
  resourceId: gitcoinEcsAutoScalingTarget.resourceId,
  scalableDimension: gitcoinEcsAutoScalingTarget.scalableDimension,
  serviceNamespace: gitcoinEcsAutoScalingTarget.serviceNamespace,
  targetTrackingScalingPolicyConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization",
    },
    targetValue: 50,
    scaleInCooldown: 300,
    scaleOutCooldown: 300,
  },
});

export const gitcoinServiceRecord = new aws.route53.Record("passport-record", {
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

const PASSPORT_APP_GITHUB_URL = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_APP_GITHUB_URL`);
const PASSPORT_APP_GITHUB_ACCESS_TOKEN_FOR_AMPLIFY = op.read.parse(
  `op://DevOps/passport-xyz-${stack}-secrets/ci/PASSPORT_APP_GITHUB_ACCESS_TOKEN_FOR_AMPLIFY`
);

const CLOUDFLARE_DOMAIN = stack === "production" ? `passport.xyz` : "";
const CLOUDFLARE_ZONE_ID = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/CLOUDFLARE_ZONE_ID`);


// Passport XYZ
const passportBranches = Object({
  review: "main",
  staging: "staging-app",
  production: "production-app",
});

const amplifyAppInfo = coreInfraStack.getOutput("newPassportDomain").apply((domainName) => {
  const prefix = "app";
  const stakingAppInfo = createAmplifyApp(
    PASSPORT_APP_GITHUB_URL,
    PASSPORT_APP_GITHUB_ACCESS_TOKEN_FOR_AMPLIFY,
    domainName,
    CLOUDFLARE_DOMAIN, // cloudflareDomain
    CLOUDFLARE_ZONE_ID, // cloudFlareZoneId
    prefix,
    passportBranches[stack],
    passportXyzAppEnvironment,
    { ...defaultTags, Name: `${prefix}.${domainName}` },
    false,
    "",
    ""
  );
  return stakingAppInfo;
});

export const amplifyAppHookUrl = pulumi.secret(amplifyAppInfo.webHook.url);
