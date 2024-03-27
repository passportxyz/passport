import React from "react";
import { CustomizationTheme } from "../utils/theme/types";
import { CUSTOMIZATION_ENDPOINT } from "../config/customization_config";
import axios from "axios";

export type BasicCustomization = {
  key: string;
  customizationTheme?: CustomizationTheme;
  useCustomDashboardPanel: boolean;
};

export type CustomizationLogoBackground = "dots" | "none";

export type DynamicCustomization = BasicCustomization & {
  dashboardPanel: {
    logo: {
      image: React.ReactNode;
      caption?: React.ReactNode;
      background?: CustomizationLogoBackground;
    };
    body: {
      mainText: React.ReactNode;
      subText: React.ReactNode;
      action: {
        text: string;
        url: string;
      };
    };
  };
};

export type Customization = BasicCustomization | DynamicCustomization;

export const requestDynamicCustomizationConfig = async (
  customizationKey: string
): Promise<DynamicCustomization | undefined> => {
  // TODO Replace this with a call to the API

  // TODO to enable us to render HTML from the API (i.e. for the SVGs or body.subText),
  // we need to use something like this to sanitize the HTML:
  // https://www.npmjs.com/package/dompurify
  // and then something like this to render it:
  // https://github.com/peternewnham/react-html-parser

  // For now, we'll just return the hardcoded values for Avalanche.
  // These values should eventually be returned by the API.

  if (customizationKey === "avalanche") {
    return {
      key: "avalanche",
      useCustomDashboardPanel: true,
      dashboardPanel: {
        logo: {
          image: (
            <svg viewBox="0 0 70 87" fill="none" xmlns="http://www.w3.org/2000/svg" width="80px" height="90px">
              <path
                d="M2.82863 80.0977H3.82968L6.63074 86.4684H5.30828L4.70213 85.0106H1.88269L1.29493 86.4684H0L2.82863 80.0977ZM4.29804 84.0391L3.29701 81.4473L2.2776 84.0391H4.29804Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M7.87201 80.0977H9.20365L10.9762 84.9119L12.8037 80.0977H14.0528L11.4262 86.4684H10.4251L7.87201 80.0977Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M18.1883 80.0977H19.1893L21.9904 86.4684H20.6679L20.0618 85.0106H17.2423L16.6546 86.4684H15.3596L18.1883 80.0977ZM19.6577 84.0391L18.6566 81.4473L17.6372 84.0391H19.6577Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M24.5498 80.0977H25.707V85.4426H28.4713V86.4684H24.5498V80.0977Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M33.252 80.0977H34.2531L37.0541 86.4684H35.7316L35.1255 85.0106H32.3061L31.7183 86.4684H30.4234L33.252 80.0977ZM34.7214 84.0391L33.7204 81.4473L32.701 84.0391H34.7214Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M39.6135 80.0977H41.1472L44.2973 84.8306H44.3155V80.0977H45.4729V86.4684H44.0032L40.789 81.5825H40.7706V86.4684H39.6135V80.0977Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M53.2228 81.5916C52.9842 81.3395 52.7514 81.1716 52.525 81.0874C52.3046 81.0037 52.0811 80.9614 51.8547 80.9614C51.5179 80.9614 51.2119 81.0215 50.936 81.1413C50.6669 81.2553 50.4341 81.4175 50.2382 81.6273C50.0423 81.8313 49.8891 82.0713 49.7791 82.3475C49.675 82.6232 49.6229 82.9201 49.6229 83.2381C49.6229 83.5801 49.675 83.8948 49.7791 84.183C49.8891 84.4707 50.0423 84.7199 50.2382 84.9297C50.4341 85.1399 50.6669 85.3045 50.936 85.4248C51.2119 85.5446 51.5179 85.6047 51.8547 85.6047C52.1179 85.6047 52.3718 85.5446 52.6169 85.4248C52.8678 85.2987 53.1006 85.101 53.3147 84.8306L54.2698 85.4965C53.9761 85.8925 53.6181 86.1806 53.1953 86.3606C52.773 86.5405 52.3232 86.6305 51.8454 86.6305C51.3435 86.6305 50.881 86.5526 50.4587 86.3967C50.0423 86.2345 49.6809 86.0094 49.3749 85.7217C49.0749 85.4277 48.8392 85.0769 48.6678 84.6689C48.4964 84.2609 48.4105 83.8082 48.4105 83.3102C48.4105 82.8002 48.4964 82.3383 48.6678 81.9245C48.8392 81.5045 49.0749 81.1475 49.3749 80.8536C49.6809 80.5596 50.0423 80.3345 50.4587 80.1786C50.881 80.0169 51.3435 79.9356 51.8454 79.9356C52.2864 79.9356 52.6935 80.0136 53.0667 80.1699C53.4463 80.3195 53.7984 80.5774 54.1229 80.9436L53.2228 81.5916Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M56.8833 80.0977H58.0407V82.6352H61.0803V80.0977H62.2377V86.4684H61.0803V83.661H58.0407V86.4684H56.8833V80.0977Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M65.5275 80.0977H69.8345V81.1235H66.6844V82.6891H69.6695V83.7149H66.6844V85.4426H70V86.4684H65.5275V80.0977Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                d="M54.9213 10.8621H15.0787C14.083 10.8621 13.2759 11.7078 13.2759 12.7511V52.4213C13.2759 53.4646 14.083 54.3103 15.0787 54.3103H54.9213C55.917 54.3103 56.7242 53.4646 56.7242 52.4213V12.7511C56.7242 11.7078 55.917 10.8621 54.9213 10.8621Z"
                fill="rgb(var(--color-customization-foreground-1))"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M70 35C70 54.3302 54.3302 70 35 70C15.67 70 0 54.3302 0 35C0 15.67 15.67 0 35 0C54.3302 0 70 15.67 70 35ZM25.082 48.9282H18.2895C16.8622 48.9282 16.1571 48.9282 15.7273 48.6533C15.2629 48.3522 14.9792 47.8535 14.9448 47.3031C14.919 46.7961 15.2716 46.1768 15.9766 44.9387L32.7482 15.3765C33.4618 14.1211 33.8229 13.4935 34.2786 13.2613C34.7687 13.012 35.3534 13.012 35.8435 13.2613C36.2992 13.4935 36.6603 14.1211 37.3739 15.3765L40.8218 21.3952L40.8394 21.4259C41.6102 22.7726 42.0011 23.4555 42.1717 24.1723C42.3609 24.9548 42.3609 25.7802 42.1717 26.5626C41.9998 27.2849 41.6129 27.9727 40.8304 29.3398L32.0207 44.9129L31.9979 44.9528C31.2221 46.3106 30.8289 46.9988 30.2839 47.518C29.6906 48.0856 28.977 48.4981 28.1945 48.7306C27.4809 48.9282 26.6813 48.9282 25.082 48.9282ZM42.2354 48.9282H51.9682C53.4041 48.9282 54.1265 48.9282 54.5567 48.6449C55.0208 48.3438 55.3131 47.8363 55.3392 47.2864C55.3639 46.7956 55.019 46.2005 54.3432 45.0343C54.3199 44.9946 54.2966 44.9542 54.2728 44.9131L49.3975 36.5729L49.3421 36.479C48.657 35.3205 48.3112 34.7355 47.867 34.5093C47.3772 34.26 46.8007 34.26 46.3109 34.5093C45.864 34.7415 45.5028 35.352 44.7888 36.5815L39.931 44.9217L39.9144 44.9504C39.2033 46.178 38.8479 46.7914 38.8735 47.2947C38.9079 47.8451 39.1916 48.3522 39.6559 48.6533C40.0772 48.9282 40.7995 48.9282 42.2354 48.9282Z"
                fill="rgb(var(--color-customization-background-1))"
              />
            </svg>
          ),
          background: "dots",
        },
        body: {
          mainText: `The Avalanche Community Grant Rounds require you to achieve a score greater than 25 to qualify
            for voting. The only way to reach this score is to complete identification via Civic or Holonym.`,
          subText: (
            <div>
              You can{" "}
              <a
                href="https://t.me/avalanchegrants"
                style={{ color: "rgb(var(--color-text-2))", textDecoration: "underline" }}
                target="_blank"
              >
                join Avalanche on telegram
              </a>{" "}
              if you have any questions or need support.
            </div>
          ),
          action: {
            text: "Avalanche Grants",
            url: "https://grants.avax.network/",
          },
        },
      },
      customizationTheme: {
        colors: {
          customizationBackground1: "232 65 66",
          customizationBackground2: "0 0 0",
          customizationForeground1: "255 255 255",
        },
      },
    };
  } else {
    const customizationResponse = await axios.get(`${CUSTOMIZATION_ENDPOINT}/${customizationKey}`);
    console.log("customizationResponse", customizationResponse);
    return customizationResponse.data;
  }
};

export const isDynamicCustomization = (config: Customization): config is DynamicCustomization => {
  return (config as DynamicCustomization).dashboardPanel !== undefined;
};
