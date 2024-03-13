import * as aws from "@pulumi/aws";
import { Input } from "@pulumi/pulumi";
import * as std from "@pulumi/std";

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
): aws.amplify.App {
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

  return amplifyApp;
}
