import * as aws from "@pulumi/aws";
import { Input } from "@pulumi/pulumi";
import * as std from "@pulumi/std";
import * as github from "@pulumi/github";

export function createAmplifyStakingApp(
  githubUrl: string,
  githubAccessToken: string,
  domainName: string,
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
  const exampleDomainAssociation = new aws.amplify.DomainAssociation(name, {
    appId: amplifyApp.id,
    domainName: domainName,
    subDomains: [
      {
        branchName: branch.branchName,
        prefix: prefix,
      },
    ],
  });
  const webHook = new aws.amplify.Webhook(`${name}-${branchName}`, {
    appId: amplifyApp.id,
    branchName: branchName,
    description: `trigger build from branch ${branchName}`,
  });

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
