import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// The following vars are not allowed to be undefined, hence the `${...}` magic

let route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
let domain = `staging.${process.env["DOMAIN"]}`;
let IAM_SERVER_SSM_ARN = `${process.env["IAM_SERVER_SSM_ARN"]}`;

export const dockerGtcDpoppImage = `${process.env["DOCKER_GTC_DPOPP_IMAGE"]}`;

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
    Environment: "staging",
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

// TODO connect EFS with Fargate containers
// const ceramicStateStore = new aws.efs.FileSystem("ceramic-statestore");

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
        image: dockerGtcDpoppImage,
        memory: 1024,
        portMappings: [httpsListener],
        links: [],
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
            name: "RPC_URL",
            valueFrom: `${IAM_SERVER_SSM_ARN}:MAINNET_RPC_URL::`,
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
        ],
      },
    },
  },
});

const ecsTarget = new aws.appautoscaling.Target("autoscaling_target", {
  maxCapacity: 10,
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.cluster.name}/${service.service.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
});
