# Idena Platform Stamp

Guide to working with the Idena stamps.

## Local Testing

You must run the idena server locally

```
git clone https://github.com/idena-network/idena-web
cd idena-web
npm i --force
npx next dev -p 3004
```

Add the following to your app/.env

```
NEXT_PUBLIC_FF_IDENA_STAMP=on
NEXT_PUBLIC_PASSPORT_IDENA_WEB_APP=http://localhost:3004/
NEXT_PUBLIC_PASSPORT_IDENA_CALLBACK=http://localhost:3000/
```

You must log in to Idena with a real account. Gitcoin has been provided a test
account, ask for details.

Note that even though the frontend makes the call to the local server, the IAM
will still call the real Idena API.
