import { createSignedPayload } from "../../utils/helpers";
import { vi, describe, it, expect } from "vitest";
import { Cacao } from "@didtools/cacao";

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn().mockImplementation((_) => {
      return {
        p: {
          iss: "did:ethr:0x123",
        },
      };
    }),
  },
}));

describe("createSignedPayload", () => {
  it("should sign", async () => {
    const mockDid = {
      createDagJWS: () => ({
        jws: {
          link: {
            bytes: [7, 8, 9],
          },
          payload: {
            hello: "world",
          },
          signatures: ["0x123"],
        },
        cacaoBlock: [0, 1, 2],
      }),
    };

    const signedPayload = await createSignedPayload(mockDid as any, { hello: "world" });

    expect(Cacao.fromBlockBytes).toHaveBeenCalledWith([0, 1, 2]);

    expect(signedPayload).toEqual({
      signatures: ["0x123"],
      payload: { hello: "world" },
      cid: [7, 8, 9],
      cacao: [0, 1, 2],
      issuer: "did:ethr:0x123",
    });
  });
});
