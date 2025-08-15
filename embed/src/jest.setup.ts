import DIDKit from "@spruceid/didkit-wasm-node";

process.env.IAM_JWK = DIDKit.generateEd25519Key();
process.env.IAM_JWK_EIP712 =
  '{"kty":"EC","crv":"secp256k1","x":"PdB2nS-knyAxc6KPuxBr65vRpW-duAXwpeXlwGJ03eU","y":"MwoGZ08hF5uv-_UEC9BKsYdJVSbJNHcFhR1BZWer5RQ","d":"z9VrSNNZXf9ywUx3v_8cLDhSw8-pvAT9qu_WZmqqfWM"}';
process.env.SCORER_ENDPOINT = "http://127.0.0.1:8002";
process.env.SCORER_API_KEY = "abcd";
process.env.SCROLL_BADGE_PROVIDER_INFO =
  '{"DeveloperList#PassportCommitterLevel1#6a51c84c":{"contractAddress":"0x71A848A38fFCcA5c7A431F2BB411Ab632Fa0c456","level":1}}';
process.env.SCROLL_BADGE_ATTESTATION_SCHEMA_UID = "0xa35b5470ebb301aa5d309a8ee6ea258cad680ea112c86e456d5f2254448afc74";
process.env.REDIS_URL = "redis://localhost:6379/0";
process.env.SIGN_PROTOCOL_API_KEY = "0xsign_api_key";
