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
  albHttpsListenerArn,
  coreAlbArn,
  passportDataScienceEndpoint,
  snsAlertsTopicArn,
  passportXyzDomainName,
  passportXyzHostedZoneId,
} from "./stacks";

const current = aws.getCallerIdentity({});
const regionData = aws.getRegion({});
const DOCKER_IMAGE_TAG = `${process.env.DOCKER_IMAGE_TAG || ""}`;
export const dockerGtcPassportEmbedImage = pulumi
  .all([current, regionData])
  .apply(([acc, region]) => `${acc.accountId}.dkr.ecr.${region.id}.amazonaws.com/passport-embed:${DOCKER_IMAGE_TAG}`);

const PROVISION_STAGING_FOR_LOADTEST =
  op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PROVISION_STAGING_FOR_LOADTEST`).toLowerCase() === "true";

const PASSPORT_VC_SECRETS_ARN = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_VC_SECRETS_ARN`);

const cloudflareZoneId = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/CLOUDFLARE_ZONE_ID`);

// Manage secrets & envs for Passport XYZ
const passportEmbedSecretObject = new aws.secretsmanager.Secret("passport-embed", {
  description: "Secrets for Passport Embed on Passport XYZ",
  tags: {
    ...defaultTags,
    Name: "passport-embed",
  },
});

const passportEmbedSecrets = secretsManager
  .syncSecretsAndGetRefs({
    vault: "DevOps",
    repo: "passport-embed",
    env: stack,
    section: "embed",
    targetSecret: passportEmbedSecretObject,
    secretVersionName: "passport-embed-secret-version",
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

const passportEmbedEnvironment = pulumi
  .all([
    secretsManager.getEnvironmentVars({
      vault: "DevOps",
      repo: "passport-embed",
      env: stack,
      section: "embed",
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

// const passportEmbedAppEnvironment = secretsManager
//   .getEnvironmentVars({
//     vault: "DevOps",
//     repo: "passport-embed",
//     env: stack,
//     section: "app",
//   })
//   .reduce((acc, { name, value }) => {
//     acc[name] = value;
//     return acc;
//   }, {} as Record<string, string | pulumi.Output<any>>);

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

const serviceRole = new aws.iam.Role("passport-embed-ecs-role", {
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
      name: "allow_passport_embed_secrets_access",
      policy: passportEmbedSecretObject.arn.apply((iamSecretArn) =>
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
    Name: "passport-embed-ecs-role",
  },
});

//////////////////////////////////////////////////////////////
// Load Balancer listerner rule & target group
//////////////////////////////////////////////////////////////

const albPassportEmbedTargetGroup = new aws.lb.TargetGroup(`passport-embed`, {
  name: `passport-embed`,
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
    Name: `passport-embed`,
  },
});

/*
 * Alarm for monitoring target 5XX errors
 */
const coreAlbArnSuffix = coreAlbArn.apply((arn) => arn.split(":").pop());
const http5xxTargetAlarm = new aws.cloudwatch.MetricAlarm(`passport-embed-HTTP-Target-5XX`, {
  tags: { ...defaultTags, Name: `passport-embed-HTTP-Target-5XX` },
  name: `passport-embed-HTTP-Target-5XX`,
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
    TargetGroup: albPassportEmbedTargetGroup.arnSuffix,
  },

  comparisonOperator: "GreaterThanThreshold",
  threshold: 0,
  treatMissingData: "notBreaching",
});

const albPassportEmbedListenerRule = new aws.lb.ListenerRule(`passport-embed-https`, {
  listenerArn: albHttpsListenerArn,
  priority: 200, // This needs to be grater than the priority number for passport-scroll-badge-service
  actions: [
    {
      type: "forward",
      targetGroupArn: albPassportEmbedTargetGroup.arn,
    },
  ],
  conditions: [
    {
      hostHeader: {
        values:
          stack === "production"
            ? [passportXyzDomainName.apply((domain) => `embed.${domain}`), `embed.passport.xyz`]
            : [passportXyzDomainName.apply((domain) => `embed.${domain}`)], // if it is on production, it should be also embed.passport.xyz
      },
      // pathPattern: {[]}
    },
  ],
  tags: {
    ...defaultTags,
    Name: `passport-embed-https`,
  },
});

//////////////////////////////////////////////////////////////
// Service SG
//////////////////////////////////////////////////////////////

const serviceSG = new aws.ec2.SecurityGroup(`passport-embed`, {
  name: `passport-embed`,
  vpcId: vpcId,
  description: `Security Group for passport-embed service.`,
  tags: {
    ...defaultTags,
    Name: `passport-embed`,
  },
});
// do no group the security group definition & rules in the same resource =>
// it will cause the sg to be destroyed and recreated everytime the rules change
// By managing them separately is easier to update the security group rules even outside of this stack
const sgIngressRule80 = new aws.ec2.SecurityGroupRule(
  `passport-embed-80`,
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
  `passport-embed-all`,
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

const serviceLogGroup = new aws.cloudwatch.LogGroup("passport-embed", {
  name: "passport-embed",
  retentionInDays: logsRetention[stack],
  tags: {
    ...defaultTags,
    Name: "passport-embed",
  },
});

//////////////////////////////////////////////////////////////
// CloudWatch Alerts
//////////////////////////////////////////////////////////////

const unhandledErrorsMetric = new aws.cloudwatch.LogMetricFilter("passport-embed-unhandledErrorsMetric", {
  logGroupName: serviceLogGroup.name,
  metricTransformation: {
    defaultValue: "0",
    name: "providerError",
    namespace: "/embed/errors/unhandled",
    unit: "Count",
    value: "1",
  },
  name: "Passport Embed Unhandled Provider Errors",
  pattern: '"UNHANDLED ERROR:" type address',
});

const unhandledErrorsAlarm = new aws.cloudwatch.MetricAlarm("passport-embed-unhandledErrorsAlarm", {
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  datapointsToAlarm: 1,
  evaluationPeriods: 1,
  insufficientDataActions: [],
  metricName: "providerError",
  name: "Unhandled Provider Errors",
  namespace: "/embed/errors/unhandled",
  period: 21600,
  statistic: "Sum",
  threshold: 1,
  treatMissingData: "notBreaching",
  tags: {
    ...defaultTags,
    Name: "passport-embed-unhandledErrorsAlarm",
  },
});

const redisFilter = new aws.cloudwatch.LogMetricFilter("passport-embed-redisConnectionErrors", {
  logGroupName: serviceLogGroup.name,
  metricTransformation: {
    defaultValue: "0",
    name: "redisConnectionError",
    namespace: "/embed/errors/redis",
    unit: "Count",
    value: "1",
  },
  name: "Passport Embed Redis Connection Error",
  pattern: '"REDIS CONNECTION ERROR:"',
});

const redisErrorAlarm = new aws.cloudwatch.MetricAlarm("passport-embed-redisConnectionErrorsAlarm", {
  alarmActions: [snsAlertsTopicArn],
  okActions: [snsAlertsTopicArn],
  comparisonOperator: "GreaterThanOrEqualToThreshold",
  datapointsToAlarm: 1,
  evaluationPeriods: 1,
  insufficientDataActions: [],
  metricName: "redisConnectionError",
  name: "Redis Connection Error",
  namespace: "/embed/errors/redis",
  period: alarmConfigurations.redisErrorPeriod,
  statistic: "Sum",
  threshold: alarmConfigurations.redisErrorThreshold,
  treatMissingData: "notBreaching",
  tags: {
    ...defaultTags,
    Name: "passport-embed-redisConnectionErrorsAlarm",
  },
});

//////////////////////////////////////////////////////////////
// ECS Task & Service
//////////////////////////////////////////////////////////////
// Passport XYZ
const passportEmbedContainerDefinitions = pulumi
  .all([dockerGtcPassportEmbedImage, passportEmbedSecrets, passportEmbedEnvironment])
  .apply(([_dockerGtcPassportEmbedImage, secrets, environment]) => {
    return JSON.stringify([
      {
        name: "embed",
        image: _dockerGtcPassportEmbedImage,
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
            "awslogs-group": "passport-embed", // "${serviceLogGroup.name}`,
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

const passportEmbedTaskDefinition = new aws.ecs.TaskDefinition(`passport-embed`, {
  family: `passport-embed`,
  containerDefinitions: passportEmbedContainerDefinitions,
  executionRoleArn: serviceRole.arn,
  cpu: serviceResources[stack]["cpu"],
  memory: serviceResources[stack]["memory"],
  networkMode: "awsvpc",
  requiresCompatibilities: ["FARGATE"],
  tags: {
    ...defaultTags,
    EcsService: `passport-embed`,
    Name: `passport-embed`,
  },
});

export const passportEmbedService = new aws.ecs.Service(
  `passport-embed`,
  {
    cluster: cluster.arn,
    desiredCount: stack === "production" ? 2 : 1,
    enableEcsManagedTags: true,
    enableExecuteCommand: false,
    launchType: "FARGATE",
    loadBalancers: [
      {
        containerName: "embed",
        containerPort: 80,
        targetGroupArn: albPassportEmbedTargetGroup.arn,
      },
    ],
    name: `passport-embed`,
    networkConfiguration: {
      subnets: vpcPrivateSubnets,
      securityGroups: [serviceSG.id],
    },
    propagateTags: "TASK_DEFINITION",
    taskDefinition: passportEmbedTaskDefinition.arn,
    tags: {
      ...defaultTags,
      Name: `passport-embed`,
    },
  },
  {
    dependsOn: [albPassportEmbedTargetGroup, passportEmbedTaskDefinition],
  }
);

const ecsAutoScalingTargetXyz = new aws.appautoscaling.Target("passport-embed-autoscaling-target", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${passportEmbedService.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
  tags: {
    ...defaultTags,
    Name: "passport-embed-autoscaling-target",
  },
});

const ecsAutoScalingPolicyXyz = new aws.appautoscaling.Policy("passport-embed-autoscaling-policy", {
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

const serviceRecordXyz = new aws.route53.Record("passport-embed-record", {
  name: "embed",
  zoneId: passportXyzHostedZoneId,
  type: "CNAME",
  ttl: 300,
  records: [albDnsName],
});

// CloudFlare Record

const cloudflareIamRecord =
  stack === "production"
    ? new cloudflare.Record(`passport-embed-record`, {
        name: `embed`,
        zoneId: cloudflareZoneId,
        type: "CNAME",
        value: albDnsName,
        allowOverwrite: true,
        comment: `Points to Embed service running on AWS ECS task`,
      })
    : "";
