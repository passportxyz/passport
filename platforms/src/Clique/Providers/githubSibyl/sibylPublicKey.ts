/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { CliqueClient, Environment } from "@cliqueofficial/clique-sdk";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const forge = require("node-forge");

export const getPublicKey = async (): Promise<string> => {
  const apiKey = process.env.CLIQUE_CLIENT_ID;
  const apiSecret = process.env.CLIQUE_CLIENT_SECRET;
  const isProduction = Boolean(process.env.CLIQUE_CLIENT_PRODUCTION);

  if (!apiKey || !apiSecret) {
    return null;
  }

  const client = new CliqueClient({
    apiKey,
    apiSecret,
    env: isProduction ? Environment.Production : Environment.Test,
  });
  const rsaPubKey: string = await client.attestor.getSibylPublicKey();
  return rsaPubKey;
};

const extractPubKey = (rsaPubKey: string): Record<string, string> => {
  const rsa_n = rsaPubKey.substring(rsaPubKey.indexOf("data:") + 7, rsaPubKey.indexOf("},") - 2);
  const rsa_e = rsaPubKey.substring(rsaPubKey.lastIndexOf("data:") + 7, rsaPubKey.lastIndexOf("]"));

  const resultKey = {
    rsa_n: rsa_n,
    rsa_e: rsa_e,
  };

  return resultKey;
};

export const rsaEncrypt = async (param: string, rsaPubKey: string) : Promise<string> => {
  const resultKey = extractPubKey(rsaPubKey);
  const rsa_n = resultKey["rsa_n"];
  const rsa_e = resultKey["rsa_e"];
  const kk = rsa_n
    .split(", ")
    .map((x, i) => BigInt(2) ** BigInt(i * 64) * BigInt(x))
    .reduce((acc, x) => acc + x)
    .toString();
  const k = forge.pki.setRsaPublicKey(
    new forge.jsbn.BigInteger(kk),
    new forge.jsbn.BigInteger(rsa_e),
  );
  const m = forge.pki.rsa.encrypt(param, k, 0x02);
  const y = [];
  for (let i = 0; i < m.length; i++) {
    y.push(m[i].charCodeAt(0));
  }
  const res = Buffer.from(y).toString("base64");
  return res;
};