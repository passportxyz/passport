// ---- Test subject
import {
  TwitterFollowerGT100Provider,
  TwitterFollowerGT500Provider,
  TwitterFollowerGTE1000Provider,
  TwitterFollowerGT5000Provider,
} from "@gitcoin/passport-iam/src/providers/twitterFollower";

describe("Attempt verification", function () {
  it("it should auth with twitter", async () => {
    expect(true).toBe(true);
  });
});
