// ===== CERAMIC TESTNET STACK =====
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// The following vars are not allowed to be undefined, hence the `${...}` magic

let route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
let domain = `ceramic.staging.${process.env["DOMAIN"]}`;

//////////////////////////////////////////////////////////////
// Create permissions:
//  - user for bucket access
//////////////////////////////////////////////////////////////

const usrS3 = new aws.iam.User(`gitcoin-dpopp-usr-s3`, {
  path: "/dpopp/",
});

const usrS3AccessKey = new aws.iam.AccessKey(`gitcoin-dpopp-usr-key`, { user: usrS3.name });

export const usrS3Key = usrS3AccessKey.id;
export const usrS3Secret = usrS3AccessKey.secret;

//////////////////////////////////////////////////////////////
// Create HTTPS certificate
//////////////////////////////////////////////////////////////

// Generate an SSL certificate
const certificate = new aws.acm.Certificate("gitcoin-dpopp-ceramic-cert", {
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
  "gitcoin-dpopp-ceramic-cert-validation",
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: [certificateValidationDomain.fqdn],
  },
  { customTimeouts: { create: "30s", update: "30s" } }
);

//////////////////////////////////////////////////////////////
// Create bucket for ipfs deamon
// https://developers.ceramic.network/run/nodes/nodes/#example-aws-s3-policies
//////////////////////////////////////////////////////////////

const ipfsBucket = new aws.s3.Bucket(`gitcoin-dpopp-ipfs`, {
  acl: "private",
  forceDestroy: true,
});

const ipfsBucketPolicyDocument = aws.iam.getPolicyDocumentOutput({
  statements: [
    {
      principals: [
        {
          type: "AWS",
          identifiers: [pulumi.interpolate`${usrS3.arn}`],
        },
      ],
      actions: ["s3:GetObject", "s3:ListBucket", "s3:PutObject", "s3:DeleteObject"],
      resources: [ipfsBucket.arn, pulumi.interpolate`${ipfsBucket.arn}/*`],
    },
  ],
});

const ipfsBucketPolicy = new aws.s3.BucketPolicy(`gitcoin-dpopp-ipfs-policy}`, {
  bucket: ipfsBucket.id,
  policy: ipfsBucketPolicyDocument.apply((ipfsBucketPolicyDocument) => ipfsBucketPolicyDocument.json),
});

export const ipfsBucketName = ipfsBucket.id;
export const ipfsBucketArn = ipfsBucket.arn;
// export const ipfsBucketWebURL = pulumi.interpolate`http://${ipfsBucket.websiteEndpoint}/`;

//////////////////////////////////////////////////////////////
// Create bucket for ceramic state
// https://developers.ceramic.network/run/nodes/nodes/#example-aws-s3-policies
//////////////////////////////////////////////////////////////

const ceramicStateBucket = new aws.s3.Bucket(`gitcoin-dpopp-ceramicState`, {
  acl: "private",
  forceDestroy: true,
});

const ceramicStateBucketPolicyDocument = aws.iam.getPolicyDocumentOutput({
  statements: [
    {
      principals: [
        {
          type: "AWS",
          identifiers: [pulumi.interpolate`${usrS3.arn}`],
        },
      ],
      actions: ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [ceramicStateBucket.arn, pulumi.interpolate`${ceramicStateBucket.arn}/*`],
    },
  ],
});

const ceramicStateBucketPolicy = new aws.s3.BucketPolicy(`gitcoin-dpopp-ceramicState-policy}`, {
  bucket: ceramicStateBucket.id,
  policy: ceramicStateBucketPolicyDocument.apply(
    (ceramicStateBucketPolicyDocument) => ceramicStateBucketPolicyDocument.json
  ),
});

export const ceramicStateBucketName = ceramicStateBucket.id;
export const ceramicStateBucketArn = ceramicStateBucket.arn;

//////////////////////////////////////////////////////////////
// Set up VPC
//////////////////////////////////////////////////////////////

const vpc = new awsx.ec2.Vpc("gitcoin-dpopp-ceramic", {
  subnets: [{ type: "public" }, { type: "private", mapPublicIpOnLaunch: true }],
});

export const vpcID = vpc.id;
export const vpcPrivateSubnetIds = vpc.privateSubnetIds;
export const vpcPublicSubnetIds = vpc.publicSubnetIds;

export const vpcPrivateSubnetId1 = vpcPrivateSubnetIds.then((values) => values[0]);
export const vpcPublicSubnetId1 = vpcPublicSubnetIds.then((values) => values[0]);

export const vpcPublicSubnet1 = vpcPublicSubnetIds.then((subnets) => {
  return subnets[0];
});

//////////////////////////////////////////////////////////////
// Set up ALB and ECS cluster
//////////////////////////////////////////////////////////////

const cluster = new awsx.ecs.Cluster("gitcoin-dpopp-ceramic", { vpc });
export const clusterId = cluster.id;

const alb = new awsx.lb.ApplicationLoadBalancer(`gitcoin-dpopp-ceramic`, { vpc });

// Listen to HTTP traffic on port 80 and redirect to 443
const httpListener = alb.createListener("gitcoin-dpopp-ceramic-http", {
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
export const frontendUrlEcs = pulumi.interpolate`http://${httpListener.endpoint.hostname}/`;

// Target group with the port of the Docker image
const target = alb.createTargetGroup("gitcoin-dpopp-ceramic", {
  vpc,
  port: 80,
});

// Listen to traffic on port 443 & route it through the target group
const httpsListener = target.createListener("gitcoin-dpopp-ceramic-https", {
  port: 443,
  certificateArn: certificateValidation.certificateArn,
});

const ceramicTarget = alb.createTargetGroup("gitcoin-dpopp-swarm", {
  vpc,
  port: 4011,
  protocol: "HTTP",
});

const ceramicListener = ceramicTarget.createListener("gitcoin-dpopp-swarm", {
  protocol: "HTTP",
  port: 4011,
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

function makeCmd(input: pulumi.Input<string>): pulumi.Output<string[]> {
  let bucketName = pulumi.output(input);
  return bucketName.apply((bucketName) => {
    return [
      "--port",
      "80",
      "--hostname",
      "0.0.0.0",
      "--network",
      "testnet-clay",
      "--ipfs-api",
      "http://localhost:5001",
      // "--anchor-service-api", "${anchor_service_api_url}",
      // "--debug", "${debug}",
      "--log-to-files",
      "false",
      // "--log-directory", "/usr/local/var/log/${directory_namespace}",
      "--cors-allowed-origins",
      ".*",
      // "--ethereum-rpc", "${eth_rpc_url}",
      "--state-store-s3-bucket",
      bucketName, // ceramicStateBucket.id
      // "--verbose", "${verbose}"
    ];
  });
}

let ceramicCommand = makeCmd(ceramicStateBucketName);

const service = new awsx.ecs.FargateService("dpopp-ceramic", {
  cluster,
  desiredCount: 1,
  subnets: vpc.privateSubnetIds,
  taskDefinitionArgs: {
    containers: {
      ipfs: {
        image: "ceramicnetwork/go-ipfs-daemon:latest",
        memory: 4096,
        cpu: 2048,
        portMappings: [
          {
            containerPort: 5001,
            hostPort: 5001,
          },
          {
            containerPort: 8011,
            hostPort: 8011,
          },
          ceramicListener
        ],
        links: [],
        environment: [
          { name: "IPFS_ENABLE_S3", value: "true" },
          { name: "IPFS_S3_REGION", value: "us-east-1" },
          { name: "IPFS_S3_BUCKET_NAME", value: ipfsBucketName },
          { name: "IPFS_S3_ROOT_DIRECTORY", value: "root" },
          { name: "IPFS_S3_ACCESS_KEY_ID", value: usrS3Key },
          { name: "IPFS_S3_SECRET_ACCESS_KEY", value: usrS3Secret },
          { name: "IPFS_S3_KEY_TRANSFORM", value: "next-to-last/2" },
        ],
        healthCheck: {
          // NB: this is the same as the go-ipfs-daemon Dockerfile HEALTHCHECK
          command: ["CMD-SHELL", "ipfs dag stat /ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn || exit 1"],
          timeout: 3,
          startPeriod: 5,
        },
      },
      ceramic: {
        dependsOn: [
          {
            containerName: "ipfs",
            condition: "HEALTHY",
          },
        ],
        image: "ceramicnetwork/js-ceramic:latest",
        memory: 4096,
        cpu: 2048,
        portMappings: [httpsListener],
        links: [],
        command: ceramicCommand,
        environment: [
          { name: "NODE_ENV", value: "production" },
          { name: "AWS_ACCESS_KEY_ID", value: usrS3Key },
          { name: "AWS_SECRET_ACCESS_KEY", value: usrS3Secret },
        ],
      },
    },
  },
});

// const ecsTarget = new aws.appautoscaling.Target("autoscaling_target", {
//   maxCapacity: 10,
//   minCapacity: 1,
//   resourceId: pulumi.interpolate`service/${cluster.cluster.name}/${service.service.name}`,
//   scalableDimension: "ecs:service:DesiredCount",
//   serviceNamespace: "ecs",
// });

export const ceramicUrl = pulumi.interpolate`https://${domain}`;
