import * as aws from "@pulumi/aws";
import { Input } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";

export function createAmplifyStakingApp(
  githubUrl: string,
  githubAccessToken: string,
  domainName: string,
  cloudflareDomain: string,
  cloudflareZoneId: string,
  prefix: string,
  branchName: string,
  environmentVariables: Input<{
    [key: string]: Input<string>;
  }>,
  tags: { [key: string]: string },
  enableBasicAuth: boolean,
  username?: string,
  password?: string
): { app: aws.amplify.App; webHook: aws.amplify.Webhook } {
  const name = `${prefix}.${domainName}`;

  const amplifyApp = new aws.amplify.App(name, {
    name: name,
    repository: githubUrl,
    oauthToken: githubAccessToken,
    platform: "WEB_COMPUTE",
    buildSpec: `version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - yarn install
        build:
          commands:
            - yarn run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
    appRoot: app
`,
    customRules: [
      {
        source: "/<*>",
        status: "404",
        target: "/index.html",
      },
    ],
    environmentVariables: {
      AMPLIFY_DIFF_DEPLOY: "false",
      AMPLIFY_MONOREPO_APP_ROOT: "app",
      ...environmentVariables,
    },
    enableBasicAuth: enableBasicAuth,
    basicAuthCredentials: std
      .base64encode({
        input: `${username}:${password}`,
      })
      .then((invoke) => invoke.result),
    tags: tags,
  });

  const branch = new aws.amplify.Branch(`${name}-${branchName}`, {
    appId: amplifyApp.id,
    branchName: branchName,
  });

  const prodDomainAssociation = new aws.amplify.DomainAssociation(name, {
    appId: amplifyApp.id,
    domainName: domainName,
    subDomains: [
      {
        branchName: branch.branchName,
        prefix: prefix,
      },
    ],
  });

  if (cloudflareDomain != "") {
    // Handle custom / additional domain assotiation
    const cloudFlareDomainAssociation = new aws.amplify.DomainAssociation(`cloudflare-${name}`, {
      appId: amplifyApp.id,
      domainName: cloudflareDomain,
      waitForVerification: false,
      subDomains: [
        {
          branchName: branch.branchName,
          prefix: prefix,
        },
      ],
    });
    const domainCert = cloudFlareDomainAssociation.certificateVerificationDnsRecord;

    // Manage CloudFlare  Records

    const certRecord = domainCert.apply((_cert) => {
      const certDetails = _cert.split(" "); // Name Type Value
      const certRecord = new cloudflare.Record("cloudflare-certificate-record", {
        name: certDetails[0].replace(cloudflareDomain, ''), // remove the autocomplete domain
        zoneId: cloudflareZoneId,
        type: certDetails[1],
        value: certDetails[2],
        allowOverwrite: true,
        comment: `Certificate for *.${cloudflareDomain}`

        // ttl: 3600
      });
      return certRecord;
    });

    cloudFlareDomainAssociation.subDomains.apply((_subDomains) => {
      _subDomains.map((_subD) => {
        const domainDetails = _subD.dnsRecord.split(" "); // Name Type Value
        const record = new cloudflare.Record(`${domainDetails[0]}-record`, {
          name: domainDetails[0],
          zoneId: cloudflareZoneId,
          type: domainDetails[1],
          value: domainDetails[2],
          allowOverwrite: true,
          comment: `Points to AWS Amplify for stake V2 app`
        });
        return record;
      });
    });
  }

  const webHook = new aws.amplify.Webhook(`${name}-${branchName}`, {
    appId: amplifyApp.id,
    branchName: branchName,
    description: `trigger build from branch ${branchName}`,
  });

  // Note!!!: at the moment this step is done manually & it is required to be configured only once / repository / environment
  //   - To be improved: investigate & automate github webhook creation
  // // Define a GitHub repository webhook for the repository to trigger Amplify builds.
  // const repoWebhook = new github.RepositoryWebhook("repoWebhook", {
  //   // Use the repository name and owner from above
  //   repository: "id-staking-v2-app",
  //   // Set the configuration for the webhook.
  //   configuration: {
  //     url: webHook.url, // Use the webhook URL from the Amplify app
  //     contentType: "json", // Webhook payload format
  //     insecureSsl: false, // Use SSL for communication
  //     secret: "<YOUR_WEBHOOK_SECRET>", // Use a secret token for securing webhook payloads
  //   },
  //   // Trigger the webhook on push events to any branch.
  //   events: ["push"],
  //   active: true, // The webhook is active
  // });

  return { app: amplifyApp, webHook: webHook };
}
