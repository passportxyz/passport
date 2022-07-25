# IAM / Passport Authority

The IAM / Passport Authority is responsible for issuing verifiableCredentials based on verified Provider
authentications.

```
# Ensure you copy and update the required variables for the environment
$ cp ./.env-example.env ./.env

# Install and start the IAM server
$ yarn install
$ yarn start
```

Then send a POST request to `http://localhost:80/api/v0.0.0/challenge` with the following JSON body:

```
{
  "payload": {
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "type": "Simple"
  }
}
```

## Adding new environment variables to IAM

1. Add the new variable and real value to your own `.env` file.
2. Add the new variable to `.env-example.env` with a placeholder value for documentation.
3. Add the new variable into the build process, making sure the new variable value is injected into the Pulumi scripts
   for all environments (`review`, `staging`, and `production`).

There are a few options for adding the variable into the build process:

- Add the value to AWS Secrets Manager, and add a new item to the `secrets` array in the `iam` container definition.
  **Note that you will have to add it to all AWS Secrets Manager resources in all AWS accounts used.**
- Add the value to Github Actions Secrets and inject it into the process environment IAM-related workflows on the Pulumi
  deploy step. Pull the variable into the Pulumi files using `proccess.env.NEW_VAR`, and refer to
  that variable in the `secrets` array.
- (If the value can be public) Hardcode the value in plaintext into the Github Actions script and feed it into the
  Pulumi file as described above. Alternatively, hardcode the value into the Pulumi file directly. Also note that it can
  be added to `environment` array in the `iam` container definition instead of `secrets`, since the value can be public.
