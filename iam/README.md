# IAM / Passport Authority

From the root of dPoPP run:

```
$ lerna bootstrap
$ yarn start:iam
```

Then send a POST request to `http://localhost:65535/api/v0.0.0/verify` with the following JSON body:

```
{
  "payload": {
    "address": "0x010",
    "type": "Simple",
    "proofs": {
      "valid": "true",
      "username": "test"
    }
  }
}
```
