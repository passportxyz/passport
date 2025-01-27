# Passport Embed

The Passport Embed service implements the backend part used by the passport embed UI component.

```
# Ensure you copy and update the required variables for the environment
$ cp ./.env-example.env ./.env

# Install and start the IAM server
$ yarn install
$ yarn start
```

Then send a ??? request to `http://localhost:81/???` with the following JSON body:

```
???
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
  deploy step. Pull the variable into the Pulumi files using `process.env.NEW_VAR`, and refer to
  that variable in the `secrets` array.
- (If the value can be public) Hardcode the value in plaintext into the Github Actions script and feed it into the
  Pulumi file as described above. Alternatively, hardcode the value into the Pulumi file directly. Also note that it can
  be added to `environment` array in the `iam` container definition instead of `secrets`, since the value can be public.

## Cache

Passport uses redis to handle caching. For local development you can spin up a redis instance using docker:
`docker run -d -p 6379:6379 redis` or using whatever other method you prefer. The redis instance should be available at `localhost:6379` by default.

## Example requests

```bash
curl -X POST http://localhost:80/embed/verify \
     -H "Content-Type: application/json" \
     -d '{"address":"0x85fF01cfF157199527528788ec4eA6336615C989", "scorerId":736}'
```
