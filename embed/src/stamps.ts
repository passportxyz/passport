export const displayNumber = (num?: number): string => (num ?? 0).toFixed(1);

type StampPage = {
  header: string;
  platforms: Platform[];
};
type Platform = {
  platformId: string;
  name: string;
  description: string;
  documentationLink?: string;
  requiresSignature?: boolean;
  requiresPopup?: boolean;
  popupUrl?: string;
};

const oAuthPopupUrl = process.env.EMBED_POPUP_OAUTH_URL;

export const STAMP_PAGES: StampPage[] = [
  {
    header: "Physical Verification",
    platforms: [
      {
        platformId: "Binance",
        name: "Binance",
        description: `<div>
            If you do not have the Binance Account Bound Token (BABT), obtain it
            <a
              href="https://www.binance.com/en/babt"
              style="color: inherit; font-weight: 700; text-decoration: none;"
              rel="noopener noreferrer"
              target="_blank"
            >
              here
            </a>
            by verifying your identity and logging into your Binance account.
            Then return here and click Verify to claim this Stamp.
          </div>
          `,
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-binance-stamp",
      },
      {
        platformId: "Biometrics",
        name: "Biometrics",
        description:
          "<div>Verify your uniqueness using facial biometrics, powered by human.tech. This enables secure facial verification including 3D liveness and duplicate checks.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-biometrics-stamp",
      },
      {
        platformId: "Coinbase",
        name: "Coinbase",
        description: "<div>Confirm Your Coinbase Verified ID (Coming Soon)</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-coinbase-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "HumanIdKyc",
        name: "Government ID",
        description: "<div>Verify your government-issued identification document for identity verification.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-holonym-stamp",
      },
      {
        platformId: "HumanIdPhone",
        name: "Phone Verification",
        description: "<div>Verify your phone number for additional identity verification.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-holonym-stamp",
      },
      {
        platformId: "CleanHands",
        name: "Proof of Clean Hands",
        description: "<div>Verify your identity through proof of clean hands verification.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-holonym-stamp",
      },
    ],
  },
  {
    header: "Web2 Platforms",
    platforms: [
      {
        platformId: "Discord",
        name: "Discord",
        description:
          "<div>Connect your Discord account to Passport to identity and reputation in Web3 communities.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-discord-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Github",
        name: "GitHub",
        description: "<div>Connect to GitHub to verify your activity based on days with active commits.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-github-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Google",
        name: "Google",
        description: "<div>Connect to Google to verify your email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-google-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Linkedin",
        name: "LinkedIn",
        description:
          "<div>This stamp confirms that your LinkedIn account is verified and includes a valid, verified email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-linkedin-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
    ],
  },
];
