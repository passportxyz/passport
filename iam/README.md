# IAM / Passport Authority

The IAM / Passport Authority is responsible for issuing verifiableCredentials based on verified Provider authentications.

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
