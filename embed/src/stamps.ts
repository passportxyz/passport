export const displayNumber = (num?: number): string => (num ?? 0).toFixed(1);

type StampPage = {
  header: string;
  platforms: Platform[];
};
type Platform = {
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
    header: "KYC verification",
    // description: "Choose from below to verify",
    platforms: [
      {
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
        name: "Holonym",
        description: "Proven uniqueness using Holonym KYC with government ID or ePassport",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-holonym-stamp",
      },
    ],
  },
  {
    header: "Biometrics verification",
    platforms: [
      {
        name: "Civic",
        description: "<div>Connect to Civic to verify your identity.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-civic-stamp",
      },
    ],
  },
  {
    header: "Social & Professional Platforms",
    // description: "Choose from below to verify",
    platforms: [
      {
        name: "Linkedin",
        description:
          "<div>This stamp confirms that your LinkedIn account is verified and includes a valid, verified email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-linkedin-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
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
        name: "Github",
        description: "<div>Connect to GitHub to verify your activity based on days with active commits.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-github-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        name: "Google",
        description: "<div>Connect to Google to verify your email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-google-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        name: "Coinbase",
        description: "<div>Confirm Your Coinbase Verified ID</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-coinbase-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
    ],
  },
];
