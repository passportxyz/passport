// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// --- Facebook OAuth toolkit
// import FacebookLogin from "react-facebook-login";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

// --- UserContext
import { UserContext } from "../../context/userContext";

// --- Style Components
import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";
import { ProviderSpec } from "../../config/providers";

export interface ReactFacebookLoginInfo {
  id: string;
  userID: string;
  accessToken: string;
  name?: string | undefined;
  email?: string | undefined;
  picture?:
    | {
        data: {
          height?: number | undefined;
          is_silhouette?: boolean | undefined;
          url?: string | undefined;
          width?: number | undefined;
        };
      }
    | undefined;
}

// import from .env
const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";
const FacbookAppId = process.env.NEXT_PUBLIC_DPOPP_FACEBOOK_APP_ID || "";

const providerId: PROVIDER_ID = "Facebook";

export default function FacebookCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);

  const onFacebookSignIn = (response: ReactFacebookLoginInfo): void => {
    // fetch the verifiable credential
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Facebook",
        version: "0.0.0",
        address: address || "",
        proofs: {
          accessToken: response.accessToken,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified): void => {
        handleAddStamp({
          provider: "Facebook",
          credential: verified.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  /*
  Sample Response Attributes Returned From FacebookLogin Component
  {
    accessToken,
    data_access_expiration_time,
    expiresIn,
    graphDomain,
    id,
    name,
    picture,
    signedRequest,
    userID,
  }
  */

  /* 
accessToken: "EAAQyt60slUEBAMNXarhBqPYP6FOE91ZBAwFRzXCeZCNPH8ZA2ZAIwNpYYij7uMaXzBHwbBddrHyIGYcK17T7VRJUj9DAVf59ZCyov1xEPfDH9SsgZB8YKghWh2k6g38J8SmbZBzBUmZBSZC9hp3fyW9UPad64lxN1gCiC1kEoHUo4yfaUyQqpZBWDNQ64VAyWzNxozemVEBLzO009nFR0r5S07PRyIULVxcdUZD"
data_access_expiration_time: 1660677180
expiresIn: 6420
graphDomain: "facebook"
id: "105091968877919"
name: "Dpopp Dev"
picture: {data: {…}}
signedRequest: "vAISNDhLhfVqshjkAfMpfW9SFxMZNxI_b-z5ZwDLz68.eyJ1c2VyX2lkIjoiMTA1MDkxOTY4ODc3OTE5IiwiY29kZSI6IkFRQ29FSU93S2h2NWxRc0d1emFxa2V5dnBaY1hPS2NNVF9zR0ZNcGdDclRrNGlTZDhGUjFHQkVNZ1IwdURkU3NQZU43U2Y0bzAtSk5HeTVpZnBpQ3RtTlMtZnVLQm52Z19keTh2c1NBNlp6ZjhRUnpBLWlfYTA5bEZLN1hsUmRnd3ZEb2xXb2tlNjdoY1NieUlLeXVkQjdETmtJck0wZ01OR0d4bmlxMXZfd2xIMDRMN2NTSDRzRm80TGpJa0ZLSHlOeFV3OFdtWGJaeG1CRjkzLWhFR29ubFNxVzJTS3FaaHpWb1UxQXY4REpuYUdvelNlWkNEX003RlZXcks5cTZpcWxBeklYTHhmVzdMOGVtQ2J3ZzRqT0dTbU1Ld3dBS1RKQ3BWcU55VExtRF9XTXJ6Y1k4X1BQREJxYVJZTzlNS05kUWNHY0RLN1NNZ0RjeVNfNWJURk1iQl9QV2prd2FuSmV1UzJWV1hMN1lxNTM2aS1TVk5nOEVLb0tYUGdjMjFNUSIsImFsZ29yaXRobSI6IkhNQUMtU0hBMjU2IiwiaXNzdWVkX2F0IjoxNjUyOTAxMTgwfQ"
userID: "105091968877919"
  */

  return (
    <Card
      providerSpec={allProvidersState[providerId].providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId].stamp?.credential}
      issueCredentialWidget={
        <FacebookLogin
          appId={FacbookAppId}
          autoLoad={true}
          fields="name,email,picture"
          scope="public_profile"
          callback={(response: ReactFacebookLoginInfo) => {
            console.log("facebook response ", response);
            if (response) {
              onFacebookSignIn(response as ReactFacebookLoginInfo);
            }
          }}
          onFailure={(response: ReactFacebookLoginInfo): void => {
            console.log("ERROR: ", response);
          }}
          render={(renderProps: { onClick: React.MouseEventHandler<HTMLButtonElement> | undefined }): JSX.Element => (
            <button className="verify-btn" onClick={renderProps.onClick}>
              Verify
            </button>
          )}
        />
      }
    />
  );
}

// curl -i -X GET "https://graph.facebook.com/debug_token?input_token=EAAQyt60slUEBAMNXarhBqPYP6FOE91ZBAwFRzXCeZCNPH8ZA2ZAIwNpYYij7uMaXzBHwbBddrHyIGYcK17T7VRJUj9DAVf59ZCyov1xEPfDH9SsgZB8YKghWh2k6g38J8SmbZBzBUmZBSZC9hp3fyW9UPad64lxN1gCiC1kEoHUo4yfaUyQqpZBWDNQ64VAyWzNxozemVEBLzO009nFR0r5S07PRyIULVxcdUZD&access_token=EAAQyt60slUEBAMNXarhBqPYP6FOE91ZBAwFRzXCeZCNPH8ZA2ZAIwNpYYij7uMaXzBHwbBddrHyIGYcK17T7VRJUj9DAVf59ZCyov1xEPfDH9SsgZB8YKghWh2k6g38J8SmbZBzBUmZBSZC9hp3fyW9UPad64lxN1gCiC1kEoHUo4yfaUyQqpZBWDNQ64VAyWzNxozemVEBLzO009nFR0r5S07PRyIULVxcdUZD"
