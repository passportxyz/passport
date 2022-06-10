// ===== CERAMIC MAINNET STACK =====
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Note - this stack is not deployed yet, pending answers to questions:
// 1) which AWS account does this live in?
// 2) we need to have a public, static egress IP address for the ceramic node -
//    how do we configure this?

// The following vars are not allowed to be undefined, hence the `${...}` magic

let route53Zone = `${process.env["ROUTE_53_ZONE"]}`;
let domain = `ceramic.${process.env["DOMAIN"]}`;

//////////////////////////////////////////////////////////////
// Create permissions:
//  - user for bucket access
//////////////////////////////////////////////////////////////

const usrS3 = new aws.iam.User(`gitcoin-ceramic-usr-s3`, {
  path: "/dpopp/",
});

const usrS3AccessKey = new aws.iam.AccessKey(`gitcoin-ceramic-usr-key`, { user: usrS3.name });

export const usrS3Key = usrS3AccessKey.id;
export const usrS3Secret = usrS3AccessKey.secret;

//////////////////////////////////////////////////////////////
// Create HTTPS certificate
//////////////////////////////////////////////////////////////

// Generate an SSL certificate
const certificate = new aws.acm.Certificate("gitcoin-ceramic-cert", {
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
  "gitcoin-ceramic-cert-validation",
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

const ipfsBucket = new aws.s3.Bucket(`gitcoin-ceramic-ipfs`, {
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

const ipfsBucketPolicy = new aws.s3.BucketPolicy(`gitcoin-ceramic-ipfs-policy`, {
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

const ceramicStateBucket = new aws.s3.Bucket(`gitcoin-ceramicState`, {
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

const ceramicStateBucketPolicy = new aws.s3.BucketPolicy(`gitcoin-ceramicState-policy}`, {
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

const vpc = new awsx.ec2.Vpc("gitcoin-ceramic", {
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

const cluster = new awsx.ecs.Cluster("gitcoin-ceramic", { vpc });
export const clusterId = cluster.id;

const alb = new awsx.lb.ApplicationLoadBalancer(`gitcoin-ceramic`, { vpc });

// Listen to HTTP traffic on port 80 and redirect to 443
const httpListener = alb.createListener("gitcoin-ceramic-http", {
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

const target = alb.createTargetGroup("gitcoin-dpopp-ceramic", {
  vpc,
  port: 80,
  healthCheck: { path: "/api/v0/node/healthcheck" },
});

// Listen to traffic on port 443 & route it through the Ceramic target group
const httpsListener = target.createListener("gitcoin-ceramic-https", {
  port: 443,
  certificateArn: certificateValidation.certificateArn,
});

// Target group for the IPFS container
const ceramicTarget = alb.createTargetGroup("gitcoin-dpopp-swarm", {
  vpc,
  port: 4001,
  protocol: "HTTP",
  healthCheck: { path: "/", unhealthyThreshold: 5, port: "8011", interval: 60, timeout: 30 },
});

const ceramicListener = ceramicTarget.createListener("gitcoin-dpopp-swarm", {
  protocol: "HTTP",
  port: 4001,
});

const ipfsTarget = alb.createTargetGroup("gitcoin-dpopp-ipfs", {
  vpc,
  port: 5001,
  protocol: "HTTP",
  healthCheck: { path: "/", unhealthyThreshold: 5, port: "8011", interval: 60, timeout: 30 },
});

const ipfsListener = ipfsTarget.createListener("gitcoin-dpopp-ipfs", {
  protocol: "HTTP",
  port: 5001,
});

const ipfsHealthcheckTarget = alb.createTargetGroup("dpopp-ipfs-healthcheck", {
  vpc,
  port: 8011,
  protocol: "HTTP",
  healthCheck: { path: "/", unhealthyThreshold: 5, port: "8011", interval: 60, timeout: 30 },
});

const ipfsHealthcheckListener = ipfsHealthcheckTarget.createListener("ipfs-healthcheck", {
  protocol: "HTTP",
  port: 8011,
});

const ipfsWS = alb.createTargetGroup("dpopp-ipfs-ws", {
  vpc,
  port: 8081,
  protocol: "HTTP",
  healthCheck: { path: "/", unhealthyThreshold: 5, port: "8011", interval: 60, timeout: 30 },
});

const ifpsWSListener = ipfsWS.createListener("ipfs-ws", {
  protocol: "HTTP",
  port: 8081,
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
      "elp",
      "--ipfs-api",
      "http://gitcoin-ceramic-c696c33-2109689178.us-east-1.elb.amazonaws.com:5001",
      // "--anchor-service-api", "${anchor_service_api_url}",
      // "--debug", "${debug}",
      "--log-to-files",
      "false",
      // "--log-directory", "/usr/local/var/log/ceramic",
      "--cors-allowed-origins",
      "--max-old-space-size=3072",
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
  enableExecuteCommand: true,
  taskDefinitionArgs: {
    containers: {
      ceramic: {
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

const serviceIPFS = new awsx.ecs.FargateService("dpopp-ipfs", {
  cluster,
  desiredCount: 1,
  subnets: vpc.privateSubnetIds,
  enableExecuteCommand: true,
  taskDefinitionArgs: {
    containers: {
      ipfs: {
        image: "ceramicnetwork/go-ipfs-daemon:latest",
        memory: 4096,
        cpu: 2048,
        portMappings: [
          ceramicListener,
          ipfsListener,
          ipfsHealthcheckListener,
          ifpsWSListener,
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
        // healthCheck: {
        //   // NB: this is the same as the go-ipfs-daemon Dockerfile HEALTHCHECK
        //   command: ["CMD-SHELL", "ipfs dag stat /ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn || exit 1"],
        //   timeout: 3,
        //   startPeriod: 5,
        // },
      },
    },
  },
});

export const ceramicUrl = pulumi.interpolate`https://${domain}`;