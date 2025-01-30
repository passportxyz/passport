export const displayNumber = (num?: number): string => String(parseInt(num?.toString() || "0"));

type StampPage = {
  header: string;
  platforms: Platform[];
};
type Platform = {
  name: string;
  description: string;
  documentationLink?: string;
  requireSignature?: boolean;
  requiresPopup?: boolean;
  popUpUrl?: string;
  credentials?: Credential[];
  displayWeight: string;
};

type Credential = {
  id: string;
  weight: string;
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
        credentials: [
          {
            id: "BinanceBABT2",
            weight: "10",
          },
        ],
      },
      {
        name: "Holonym",
        description: "Proven uniqueness using Holonym KYC with government ID or ePassport",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-holonym-stamp",
        credentials: [
          {
            id: "HolonymGovIdProvider",
            weight: "16",
          },
        ],
      },
    ],
  },
  {
    header: "Biometrics verification",
    // description: "Choose from below to verify",
    platforms: [
      {
        name: "Civic",
        description: "<div>Connect to Civic to verify your identity.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-civic-stamp",
        credentials: [
          {
            id: "CivicCaptchaPass",
            weight: "0.8",
          },
          {
            id: "CivicUniquenessPass",
            weight: "3",
          },
          {
            id: "CivicLivenessPass",
            weight: "5",
          },
        ],
      },
    ],
  },
  {
    header: "Social & Professional Platforms",
    // description: "Choose from below to verify",
    platforms: [
      {
        name: "LinkedIn",
        description:
          "<div>This stamp confirms that your LinkedIn account is verified and includes a valid, verified email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-linkedin-stamp",
        requireSignature: true,
        requiresPopup: true,
        popUpUrl: oAuthPopupUrl,
        credentials: [
          {
            id: "LinkedIn",
            weight: "1.5",
          },
        ],
      },
      {
        name: "Discord",
        description:
          "<div>Connect your Discord account to Passport to identity and reputation in Web3 communities.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-discord-account-to-passport",
        requireSignature: true,
        requiresPopup: true,
        popUpUrl: oAuthPopupUrl,
        credentials: [
          {
            id: "Discord",
            weight: "0.5",
          },
        ],
      },
      {
        name: "Github",
        description: "<div>Connect to GitHub to verify your activity based on days with active commits.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-github-account-to-passport",
        requireSignature: true,
        requiresPopup: true,
        popUpUrl: oAuthPopupUrl,
        credentials: [
          {
            id: "githubContributionActivityGte#30",
            weight: "1.9",
          },
          {
            id: "githubContributionActivityGte#60",
            weight: "1.9",
          },
          {
            id: "githubContributionActivityGte#120",
            weight: "2.3",
          },
        ],
      },
      {
        name: "Google",
        description: "<div>Connect to Google to verify your email address.</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-google-account-to-passport",
        requireSignature: true,
        requiresPopup: true,
        popUpUrl: oAuthPopupUrl,
        credentials: [
          {
            id: "Google",
            weight: "0.5",
          },
        ],
      },
      {
        name: "Coinbase",
        description: "<div>Confirm Your Coinbase Verified ID</div>",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-coinbase-stamp",
        requireSignature: true,
        requiresPopup: true,
        popUpUrl: oAuthPopupUrl,
        credentials: [
          {
            id: "CoinbaseDualVerification2",
            weight: "10",
          },
        ],
      },
    ],
  },
].map((page) => ({
  ...page,
  platforms: page.platforms.map((platform) => ({
    ...platform,
    displayWeight: displayNumber(
      platform.credentials.reduce((acc, credential) => acc + parseFloat(credential.weight), 0)
    ),
  })),
}));
