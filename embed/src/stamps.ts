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
  requiresSDKFlow?: boolean;
};

const oAuthPopupUrl = process.env.EMBED_POPUP_OAUTH_URL;

export const STAMP_PAGES: StampPage[] = [
  {
    header: "Physical Verification",
    platforms: [
      {
        platformId: "Binance",
        name: "Binance",
        description: "Claim your Binance Account Bound Token (BABT) using your Passport wallet.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-binance-stamp",
      },
      {
        platformId: "Biometrics",
        name: "Biometrics",
        description:
          "<div>Complete biometric verification <a href='https://id.human.tech/biometrics' target='_blank' rel='noopener noreferrer' style='text-decoration: underline; font-weight: bold; color: currentColor'>here</a> using your phone or computer camera for 3D facial liveness detection.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-biometrics-stamp",
        // requiresSDKFlow: true,
      },
      {
        platformId: "Coinbase",
        name: "Coinbase",
        description: "Create your Coinbase onchain and ID verification using your Passport wallet. (Coming Soon)",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-coinbase-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "HumanIdKyc",
        name: "Government ID",
        description: "Verify your government-issued identification document.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-government-id-stamp",
        requiresSDKFlow: true,
      },
      {
        platformId: "CleanHands",
        name: "Proof of Clean Hands",
        description:
          "Verify government ID, liveness check, and that you aren't on a sanctions list or politically exposed persons list.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-proof-of-clean-hands-stamp",
        requiresSDKFlow: true,
      },
      {
        platformId: "HumanIdPhone",
        name: "Phone Verification",
        description: "Complete phone verification.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-phone-verification-stamp",
        requiresSDKFlow: true,
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
          "Verify Discord account age (365+ days), server membership (10+), and verified external connections (2+).",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-discord-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Github",
        name: "GitHub",
        description: "Verify your GitHub commit activity.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-github-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Google",
        name: "Google",
        description: "Verify that you own a Google account.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-google-account-to-passport",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Linkedin",
        name: "LinkedIn",
        description: "Verify that you own a LinkedIn account.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-linkedin-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "Steam",
        name: "Steam",
        description:
          "Requires 100+ hours playtime, 10+ achievements, 3+ games with >1hr played, and diverse play history.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-steam-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
      {
        platformId: "X",
        name: "X",
        description: "Requires verified status (Premium or Legacy), 100+ followers, and account age over 365 days.",
        documentationLink:
          "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-x-stamp",
        requiresSignature: true,
        requiresPopup: true,
        popupUrl: oAuthPopupUrl,
      },
    ],
  },
];
