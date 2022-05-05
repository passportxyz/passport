# IAM / Passport Authority

From the root of dPoPP run:

```
$ lerna bootstrap
$ yarn start:iam
```

Then send a POST request to `http://localhost:65535/api/v0.0.0/challenge` with the following JSON body:

```
{
  "payload": {
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "type": "Simple"
  }
}
```
