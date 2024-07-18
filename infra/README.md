## New Stack
```sh
pulumi stack init gitcoin/dpopp/stackName
```

## AWS Configuration
```sh
# set aws profile credentials
aws configure --profile user1
```
*Note* you will also need to select this profile in your env:
```sh
export AWS_PROFILE=user1
```

## Configure environment

Install the One Password CLI and follow the isntructions to download the CLI and desktop application. https://developer.1password.com/docs/cli/get-started/#install

This will include authenticating the CLI with your 1Password account.

Once the 1password cli is installed you can run `pulumi up`. All necessary env variables will be fetched from 1password and set in the environment.

There is on exception to this. You should manually update the sha for `DOCKER_GTC_PASSPORT_IAM_IMAGE=op://DevOps/$APP_SECRETS/iam/ECR_BASE_URL/{update_me}` to pint to the image you would like to deploy.



## Pulumi deploy
```sh
pulumi up
```
