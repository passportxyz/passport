const DIDKit = require("@spruceid/didkit-wasm-node");

process.env.IAM_JWK = DIDKit.generateEd25519Key();
process.env.IAM_JWK_EIP712 =
  '{"kty":"EC","crv":"secp256k1","x":"PdB2nS-knyAxc6KPuxBr65vRpW-duAXwpeXlwGJ03eU","y":"MwoGZ08hF5uv-_UEC9BKsYdJVSbJNHcFhR1BZWer5RQ","d":"z9VrSNNZXf9ywUx3v_8cLDhSw8-pvAT9qu_WZmqqfWM"}';
process.env.ATTESTATION_SIGNER_PRIVATE_KEY =
  "0x04d16281ff3bf268b29cdd684183f72542757d24ae9fdfb863e7c755e599163a";
process.env.GITCOIN_VERIFIER_CHAIN_ID = "84531";
process.env.ALLO_SCORER_ID = "1";
process.env.SCORER_ENDPOINT = "http://127.0.0.1:8002";
process.env.SCORER_API_KEY = "abcd";
process.env.MORALIS_API_KEY = "abcd";
process.env.EAS_GITCOIN_STAMP_SCHEMA = "0x";
