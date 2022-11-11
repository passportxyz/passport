/* eslint-disable */
import { AppContext, Platform, ProviderPayload, PlatformInfoModalTemplate } from "../types";

export class BrightidPlatform implements Platform {
  platformId = "Brightid";
  path = "brightid";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  const infoModalTemplate: PlatformInfoModalTemplate = {
    title: "Verify Bright ID Stamp Data",
    summary: "Bright ID is a social identity network that allows you to prove that you’re only using one account.",
    summaryLink: {
      linkTitle: "Learn More",
      link: "https://www.brightid.org/",
    },
    sections: [
      {
        title: "1) Download the Bright ID App on your mobile device",
        summary: "",
        link: [
          {
            link: "https://play.google.com/store/apps/details?id=org.brightid",
            img: "./assets/google-play-logo.svg",
            className: "mt-4 rounded-lg object-center p-2",
          },
          {
            link: "https://apps.apple.com/us/app/brightid/id1428946820",
            img: "./assets/apple-appstore-logo.svg",
            className: "rounded-lg object-center p-2",
          },
        ],
      },
      {
        title: "2) Link Bright ID to Gitcoin by scanning this QR code from the Bright ID app, or clicking",
        summary: "",
        link: [
          {
            linkTitle: "here from your mobile device.",
            link: `https://app.brightid.org/link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`,
            className: "text-purple-connectPurple underline",
          },
        ],
      },
      {
        title: "3) Click Connect Bright ID to get sponsored by Gitcoin.",
        summary: `Once you are linked, sponsored, and have attended a connection party to complete your verification* on
        BrightID's App - return to this Stamp to finish the verification.* Please note that it may take some time for Bright ID to complete this process`,
        link: [
          {
            linkTitle: "Connect Bright ID",
            link: "",
          },
        ],
      },
    ],
    successToast: {
      title:"Sponsored through Gitcoin for Bright ID",
      description:"For verification status updates, check BrightID's App.Once you are verified by BrightID - return here to complete this Stamp.",
      status:"success"
    },
    failureToast: {
      title: "Failure",
      description: "Failed to trigger BrightID Sponsorship",
      status: "error",
    }
  };

  async function handleSponsorship(): Promise<void> {
    const res = fetch(`${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contextIdData: userDid,
      }),
    });
    const data = await (await res).json();
    if (data?.response?.result?.status === "success") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: { onClose: React.MouseEventHandler<HTMLButtonElement> | undefined }) => (
          <div className="rounded-md bg-blue-darkblue p-2 text-white">
            <div className="flex p-4">
              <button className="inline-flex flex-shrink-0 cursor-not-allowed">
                <img
                  alt="information circle"
                  className="sticky top-0 mb-20 p-2"
                  src="./assets/information-circle-icon.svg"
                />
              </button>
              <div className="flex-grow pl-6">
                <h2 className="title-font mb-2 text-lg font-bold">Sponsored through Gitcoin for Bright ID</h2>
                <p className="text-base leading-relaxed">{`For verification status updates, check BrightID's App.`}</p>
                <p className="text-base leading-relaxed">
                  Once you are verified by BrightID - return here to complete this Stamp.
                </p>
              </div>
              <button className="inline-flex flex-shrink-0 rounded-lg" onClick={result.onClose}>
                <img alt="close button" className="rounded-lg p-2 hover:bg-gray-500" src="./assets/x-icon.svg" />
              </button>
            </div>
          </div>
        ),
      });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    onClose();
  }
}
