import { CID } from "multiformats";
import * as codec from "@ipld/dag-cbor";
import { sha256 } from "multiformats/hashes/sha2";

export const buildCID = async (data: Record<string, string>) => {
  const bytes = codec.encode(data);
  const hash = await sha256.digest(bytes);
  const cid = CID.create(1, codec.code, hash);
  return cid.toString();
};
