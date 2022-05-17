# Ceramic Mainnet Node

## AWS Configuration

**Important**: deploy Ceramic testnet node to **Production** AWS Account

```sh
# set aws profile credentials
aws configure --profile prodUser1
```

_Note_ you will also need to select this profile in your env:

```sh
export AWS_PROFILE=prodUser1
```

## Configure environment

Before we can run `pulumi up`, there are a few resources that need to be built/pushed to the aws environment, such as the Route53 Hosted Zone, and domain name. Once these are present on aws, we must reference them in our local environment in order for pulumi to be aware of them:

```sh
# set route53 zone
export ROUTE_53_ZONE=<zoneId>
# set domain name (`ceramic.` prefix added in index.ts)
export DOMAIN=<dpopp.gitcoin.co>
```

## Pulumi deploy

```sh
pulumi up
```
