// ---- Types
import { STAMP_PAGES, displayNumber } from "./stamps.js";
import { platforms } from "@gitcoin/passport-platforms";
import { serverUtils } from "./utils/identityHelper.js";
import axios from "axios";

const { ApiError, createHandler } = serverUtils;

// No request body
type MetadataRequestBody = object;

type MetadataResponseBody = {
  header: string;
  platforms: {
    name: string;
    credentials: {
      id: string;
      weight: string;
    }[];
    displayWeight: string;
    requiresSignature?: boolean;
    requiresPopup?: boolean;
  }[];
}[];

export const metadataHandler = createHandler<
  MetadataRequestBody,
  MetadataResponseBody
>(async (req, res) => {
  const { scorerId } = req.query;
  if (!scorerId) {
    throw new ApiError(
      "Missing required query parameter: `scorerId`",
      "BAD_REQUEST",
    );
  }
  // TODO: in the future return specific stamp metadata based on the scorerId
  // TODO: clarify the returned response
  // get weight for scorerId
  const embedWeightsUrl = `${process.env.SCORER_ENDPOINT}/internal/embed/weights?community_id=${scorerId as string}`;
  const weightsResponse = await axios.get(embedWeightsUrl);
  const weightsResponseData: { [key: string]: number } =
    weightsResponse.data as { [key: string]: number };

  // get providers / credential ids from passport-platforms
  // for each provider, get the weight from the weights response
  const updatedStampPages = STAMP_PAGES.map((stampPage) => ({
    ...stampPage,
    platforms: stampPage.platforms.map((platform) => {
      const platformName = platform.name;
      const platformData = platforms[platformName];

      if (!platformData || !platformData.providers) {
        return {
          ...platform,
          credentials: [],
          displayWeight: displayNumber(0),
        };
      }
      // Extract provider types
      const providers = platformData.providers;
      const credentials = Object.values(providers).map(
        (provider: { type: string }) => ({
          id: provider.type,
          weight: weightsResponseData[provider.type]
            ? weightsResponseData[provider.type].toString()
            : "0",
        }),
      );
      return {
        ...platform,
        credentials,
        displayWeight: displayNumber(
          credentials.reduce(
            (acc, credential) => acc + parseFloat(credential.weight),
            0,
          ),
        ),
      };
    }),
  }));

  return void res.json(updatedStampPages);
});
