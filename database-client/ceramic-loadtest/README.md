## Ceramic Loadtesting

This is a custom Ceramic engine that is super cool but annoying to run! To run this load test:

1. Clone artillery elsewhere on your machine 
```
git clone git@github.com:artilleryio/artillery.git
```

2. In the same directory that this README is in, run 
```
npm link
```

3. Navigate to the cloned artillery repository, and run 
```
npm link artillery-engine-ceramic
```

4. In the root of the cloned artillery repository, run the following command to execute our load test. You 
    may have to change the "~/workspace/gitcoin/" portion of the command to point to your `passport` installation 
    directory.
```
DEBUG=engine:ceramic* node bin/run run ~/workspace/gitcoin/passport/database-client/ceramic-loadtest/basic-staging-test.yml
```
