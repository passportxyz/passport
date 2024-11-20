import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as op from "@1password/op-js";
import * as cloudflare from "@pulumi/cloudflare";
import { cluster } from "./cluster";
import { secretsManager, amplify } from "infra-libs";
import { stack, defaultTags } from "../lib/tags";
import {
  vpcId,
  vpcPrivateSubnets,
  redisConnectionUrl,
  albDnsName,
  albZoneId,
  albHttpsListenerArn,
  coreAlbArn,
  passportDataScienceEndpoint,
  snsAlertsTopicArn,
  passportXyzDomainName,
  passportXyzHostedZoneId,
  newPassportDomain
} from "./stacks";

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

// Manage secrets & envs for Passport XYZ
const passportXyzIamSecretObject = new aws.secretsmanager.Secret("iam-secret-passport-xyz", {
  // name: "iam-secret-passport-xyz",
  description: "Secrets for Passport IAM on Passport XYZ",
  tags: {
    ...defaultTags,
    Name: "iam-secret-passport-xyz",
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

type AlarmConfigurations = {
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
  ],
  managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
  tags: {
    ...defaultTags,
    Name: "passport-ecs-role",
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

/*
 * Alarm for monitoring target 5XX errors
 */
const coreAlbArnSuffix = coreAlbArn.apply((arn) => arn.split(":").pop());
const http5xxTargetAlarm = new aws.cloudwatch.MetricAlarm(`HTTP-Target-5XX-passport-xyz-iam`, {
  tags: { ...defaultTags, Name: `HTTP-Target-5XX-passport-xyz-iam` },
  name: `HTTP-Target-5XX-passport-xyz-iam`,
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],

  period: 60,
  statistic: "Sum",

  datapointsToAlarm: 3,
  evaluationPeriods: 5,

  metricName: "HTTPCode_Target_5XX_Count",
  namespace: "AWS/ApplicationELB",

  dimensions: {
    LoadBalancer: coreAlbArnSuffix,
    TargetGroup: albPassportXyzTargetGroup.arnSuffix,
  },

  comparisonOperator: "GreaterThanThreshold",
  threshold: 0,
  treatMissingData: "notBreaching",
});

const albPassportXyzListenerRule = new aws.lb.ListenerRule(`passport-xyz-iam-https`, {
  listenerArn: albHttpsListenerArn,
  priority: 102, // This needs to be grater than the priority number for passport-scroll-badge-service
  actions: [
    {
      type: "forward",
      targetGroupArn: albPassportXyzTargetGroup.arn,
    },
  ],
  conditions: [
    {
      hostHeader: {
        values:
          stack === "production"
            ? [passportXyzDomainName.apply((domain) => `iam.${domain}`), `iam.passport.xyz`]
            : [passportXyzDomainName.apply((domain) => `iam.${domain}`)], // if it is on production, it should be also iam.passport.xyz
      },
      // pathPattern: {[]}
    },
  ],
  tags: {
    ...defaultTags,
    Name: `passport-xyz-iam-https`,
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

const serviceLogGroup = new aws.cloudwatch.LogGroup("passport-iam", {
  name: "passport-iam",
  retentionInDays: logsRetention[stack],
  tags: {
    ...defaultTags,
    Name: "passport-iam",
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
  tags: {
    ...defaultTags,
    Name: "unhandledErrorsAlarm",
  },
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
  tags: {
    ...defaultTags,
    Name: "redisConnectionErrorsAlarm",
  },
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
  tags: {
    ...defaultTags,
    Name: "moralisErrorsAlarm",
  },
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
    Name: `passport-xyz-iam`,
  },
});

export const passportXyzService = new aws.ecs.Service(
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

const ecsAutoScalingTargetXyz = new aws.appautoscaling.Target("autoscaling-target-iam", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${passportXyzService.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
  tags: {
    ...defaultTags,
    Name: "autoscaling-target-iam",
  },
});

const ecsAutoScalingPolicyXyz = new aws.appautoscaling.Policy("passport-autoscaling-policy-iam", {
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

const serviceRecordXyz = new aws.route53.Record("passport-xyz-record", {
  name: "iam",
  zoneId: passportXyzHostedZoneId,
  type: "CNAME",
  ttl: 300,
  records: [albDnsName],
});

// CloudFlare Record

const cloudflareIamRecord =
  stack === "production"
    ? new cloudflare.Record(`iam-passport-xyz-record`, {
        name: `iam`,
        zoneId: cloudflareZoneId,
        type: "CNAME",
        value: albDnsName,
        allowOverwrite: true,
        comment: `Points to IAM service running on AWS ECS task`,
      })
    : "";

const gitcoinServiceRecord = new aws.route53.Record("passport-record", {
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
  review: "review-app",
  staging: "staging-app",
  production: "production-app",
});

export const amplifyAppInfo = newPassportDomain.apply((domainName) => {
  const prefix = "app";
  const amplifyAppConfig: amplify.AmplifyAppConfig = {
    name: `${prefix}.${domainName}`,
    githubUrl: PASSPORT_APP_GITHUB_URL,
    githubAccessToken: PASSPORT_APP_GITHUB_ACCESS_TOKEN_FOR_AMPLIFY,
    domainName: domainName,
    cloudflareDomain: CLOUDFLARE_DOMAIN,
    cloudflareZoneId: CLOUDFLARE_ZONE_ID,
    prefix: prefix,
    branchName: passportBranches[stack],
    environmentVariables: passportXyzAppEnvironment,
    tags: { ...defaultTags, Name: `${prefix}.${domainName}` },
    buildCommand:
      "npm install --g lerna@6.6.2 && lerna bootstrap && rm -rf ../node_modules/@tendermint && npm run build",
    preBuildCommand: "nvm use 20.9.0",
    artifactsBaseDirectory: "out",
    customRules: [
      {
        source: "/",
        status: "200",
        target: "/index.html",
      },
    ],
    platform: "WEB",
  };

  return amplify.createAmplifyApp(amplifyAppConfig);
});
