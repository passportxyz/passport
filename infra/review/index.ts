import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// The following vars are not allowed to be undefined, hence the `${...}` magic

let route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
let domain = `${process.env["DOMAIN"]}`;
let baseUrl = `http://${domain}/`;
let IAM_SERVER_SSM_ARN = `${process.env["IAM_SERVER_SSM_ARN"]}`;

export const dockerGtcDpoppImage = `${process.env["DOCKER_GTC_DPOPP_IMAGE"]}`;

//////////////////////////////////////////////////////////////
// Create permissions:
//  - user for logging
//////////////////////////////////////////////////////////////

const usrLogger = new aws.iam.User("usrLogger", {
  path: "/review/",
});

const usrLoggerAccessKey = new aws.iam.AccessKey("usrLoggerAccessKey", { user: usrLogger.name });

export const usrLoggerKey = usrLoggerAccessKey.id;
export const usrLoggerSecret = usrLoggerAccessKey.secret;

// See https://pypi.org/project/watchtower/ for the polciy required
const test_attach = new aws.iam.PolicyAttachment("CloudWatchPolicyAttach", {
  users: [usrLogger.name],
  roles: [],
  groups: [],
  policyArn: "arn:aws:iam::aws:policy/AWSOpsWorksCloudWatchLogs",
});

//////////////////////////////////////////////////////////////
// Create bucket for static hosting
// Check policy recomendation here: https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html#iam-policy
//////////////////////////////////////////////////////////////

const staticAssetsBucket = new aws.s3.Bucket("static-assets", {
  acl: "public-read",
  website: {
    indexDocument: "index.html",
  },
  forceDestroy: true,
});

const staticAssetsBucketPolicyDocument = aws.iam.getPolicyDocumentOutput({
  statements: [
    {
      principals: [
        {
          type: "AWS",
          identifiers: [pulumi.interpolate`${usrLogger.arn}`],
        },
      ],
      actions: [
        "s3:PutObject",
        "s3:GetObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:PutObjectAcl",
      ],
      resources: [staticAssetsBucket.arn, pulumi.interpolate`${staticAssetsBucket.arn}/*`],
    },
  ],
});

const staticAssetsBucketPolicy = new aws.s3.BucketPolicy("staticAssetsBucketPolicy", {
  bucket: staticAssetsBucket.id,
  policy: staticAssetsBucketPolicyDocument.apply(
    (staticAssetsBucketPolicyDocument) => staticAssetsBucketPolicyDocument.json
  ),
});

const s3OriginId = "myS3Origin";
const s3Distribution = new aws.cloudfront.Distribution("s3Distribution", {
  origins: [
    {
      domainName: staticAssetsBucket.bucketRegionalDomainName,
      originId: s3OriginId,
    },
  ],
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  defaultCacheBehavior: {
    allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: s3OriginId,
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
    viewerProtocolPolicy: "allow-all",
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
  },
  orderedCacheBehaviors: [
    {
      pathPattern: "/static/*",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      targetOriginId: s3OriginId,
      forwardedValues: {
        queryString: false,
        headers: ["Origin"],
        cookies: {
          forward: "none",
        },
      },
      minTtl: 0,
      defaultTtl: 86400,
      maxTtl: 31536000,
      compress: true,
      viewerProtocolPolicy: "redirect-to-https",
    },
  ],
  priceClass: "PriceClass_200",
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
  tags: {
    Environment: "review",
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});

export const bucketName = staticAssetsBucket.id;
export const bucketArn = staticAssetsBucket.arn;
export const bucketWebURL = pulumi.interpolate`http://${staticAssetsBucket.websiteEndpoint}/`;

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
    Environment: "review",
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

// Create the listener for the application
const listener = new awsx.lb.ApplicationListener("app", {
  port: 443,
  protocol: "HTTPS",
  vpc: cluster.vpc,
  certificateArn: certificateValidation.certificateArn,
});

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
const target = alb.createTargetGroup("web-target", { vpc, port: 80 });

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

let environment = [
  {
    name: "ENV",
    value: "test",
  },
  // read me to understand this file:
  // https://github.com/gitcoinco/web/blob/master/docs/ENVIRONMENT_VARIABLES.md

  ///////////////////////////////////////////////////////////////////////////////
  // BASIC PARAMS
  ///////////////////////////////////////////////////////////////////////////////
  // {
  //   name: "CACHE_URL",
  //   value: "dbcache://my_cache_table",
  // },
  {
    name: "DEBUG",
    value: "on",
  },
  {
    name: "BASE_URL",
    value: baseUrl,
  },
  // {
  //   name: "SENTRY_DSN",
  //   value: sentryDSN,
  // },

  ///////////////////////////////////////////////////////////////////////////////
  // DOCKER PROVISIONING PARAMS
  ///////////////////////////////////////////////////////////////////////////////
  // {
  // name: "FORCE_PROVISION",
  // value: "on"
  // },
  {
    name: "DISABLE_PROVISION",
    value: "on",
  },
  {
    name: "DISABLE_INITIAL_CACHETABLE",
    value: "on",
  },
  {
    name: "DISABLE_INITIAL_COLLECTSTATIC",
    value: "on",
  },
  {
    name: "DISABLE_INITIAL_LOADDATA",
    value: "off",
  },
  {
    name: "DISABLE_INITIAL_MIGRATE",
    value: "off",
  },

  ///////////////////////////////////////////////////////////////////////////////
  // ADVANCED NOTIFICATION PARAMS
  ///////////////////////////////////////////////////////////////////////////////
  // Be VERY CAREFUL when changing this setting.  You don't want to accidentally
  // spam a bunch of github notifications :)
  {
    name: "ENABLE_NOTIFICATIONS_ON_NETWORK",
    value: "rinkeby",
  },

  // For Facebook integration (in profile's trust tab)
  {
    name: "FACEBOOK_CLIENT_ID",
    value: "",
  },
  {
    name: "FACEBOOK_CLIENT_SECRET",
    value: "",
  },

  ///////////////////////////////////////////////////////////////////////////////
  // Specific for review env test
  ///////////////////////////////////////////////////////////////////////////////
  {
    name: "AWS_ACCESS_KEY_ID",
    value: usrLoggerKey,
  },
  {
    name: "AWS_SECRET_ACCESS_KEY",
    value: usrLoggerSecret,
  },
  {
    name: "AWS_DEFAULT_REGION",
    value: "us-east-1", // TODO: configure this
  },

  {
    name: "AWS_STORAGE_BUCKET_NAME",
    value: bucketWebURL,
  },
];

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
      name: "my_inline_policy",
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
  taskDefinitionArgs: {
    executionRole: dpoppEcsRole,
    containers: {
      iam: {
        image: dockerGtcDpoppImage,
        memory: 512,
        portMappings: [httpsListener],
        environment: environment,
        links: [],
        secrets: [
          {
            name: "GOOGLE_CLIENT_ID",
            valueFrom: IAM_SERVER_SSM_ARN,
          },
          {
            name: "IAM_JWK",
            valueFrom: IAM_SERVER_SSM_ARN,
          },
          {
            name: "GOOGLE_CLIENT_SECRET",
            valueFrom: IAM_SERVER_SSM_ARN,
          },
        ],
      },
      ceramic: {
        image: "ceramicnetwork/go-ipfs-daemon:latest",
        memory: 512,
        portMappings: [],
        environment: environment,
        links: [],
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
