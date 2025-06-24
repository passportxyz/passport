
# Test
With curl to node:
```bash
curl -X POST http://localhost:8001/verify \
   -H 'Content-Type: application/json' \
   -d @test.json
```

```bash
curl -X POST http://localhost:8000/ceramic-cache/authenticate \
   -H 'Content-Type: application/json' \
   -d @test.json
```


```bash
curl -X POST https://api.scorer.dpopp.gitcoin.co/ceramic-cache/authenticate \
   -H 'Content-Type: application/json' \
   -d @test.json
```bash
