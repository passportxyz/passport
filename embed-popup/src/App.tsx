import { useState, useEffect } from "react";
import Loader from "./components/Loader";

console.log("geri --- import.meta.env", import.meta.env);
console.log("geri --- process.env", process.env);
process.env = import.meta.env;
console.log("geri --- process.env", process.env);

import { defaultPlatformMap } from "./platformMap";
import { PLATFORM_ID, CredentialResponseBody } from "@gitcoin/passport-types";

const VERIFICATION_URL = import.meta.env.VITE_VERIFY_URL as string;

const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2);
};

// this will be taken dynamically from the platform Provider.
// the provider name will be received as a query parameter

const getOAuthUrl = async (state: string, platformName: PLATFORM_ID): Promise<string> => {
  console.log("geri getOAuthUrl", platformName);
  console.log("geri state", state);

  const platform = defaultPlatformMap.get(platformName)?.platform;
  if (platform) {
    return platform.getOAuthUrl(state);
  }
  throw new Error(`Platform ${platformName} not found`);

  // const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
  // const clinetID = import.meta.env.VITE_APP_LINKEDIN_CLIENT_ID! as string;
  // const redirectURI = import.meta.env.VITE_REDIRECT_URI! as string;
  // const params = new URLSearchParams({
  //   response_type: "code",
  //   client_id: clinetID,
  //   redirect_uri: redirectURI,
  //   scope: "profile email openid",
  //   state: state,
  // });

  // const linkedinUrl = `${AUTH_URL}?${params.toString()}`;
  // return await Promise.resolve(linkedinUrl);
};

export type VerificationResponseType = {
  credentials: CredentialResponseBody[];
};

function App() {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<string>("Initializing...");
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const [verificationResponse, setVerificationResponse] = useState<VerificationResponseType | null>(null);
  const [isVerificationPending, setIsVerificationPending] = useState<boolean>(false);

  // load query parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const address = urlParams.get("address");
  const platform = urlParams.get("platform");
  const signature = urlParams.get("signature");
  const credential = urlParams.get("credential");
  const scorerId = urlParams.get("scorerId");

  if (address && signature && credential && platform && scorerId) {
    // preserve the values in local storage
    // when the OAuth flow is complete, the code will be present but the address, signature, platform and credential will be null
    // so we only store them in the localStorage if they are not null.
    localStorage.setItem("address", address);
    localStorage.setItem("platform", platform);
    localStorage.setItem("signature", signature);
    localStorage.setItem("credential", credential);
    localStorage.setItem("scorerId", scorerId);
  }

  console.log("geri --- urlParams", urlParams);
  console.log("geri --- code", code);
  console.log("geri --- state", state);
  console.log("geri --- address", address);
  console.log("geri --- platform", platform);
  console.log("geri --- signature", signature);
  console.log("geri --- credential", credential);
  console.log("geri --- scorerId", scorerId);
  useEffect(() => {
    const handleOAuthFlow = async () => {
      const verifyEndpoint = VERIFICATION_URL;

      // Check if the required values are missing
      const isBadRequest = (!code || !state) && (!address || !signature || !credential || !platform);
      console.log("geri --- isBadRequest", isBadRequest);

      if (isBadRequest) {
        setLoading(false);
        setStep("Bad Request: Missing required parameters.");
        return (
          <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
            <h1>Bad Request</h1>
            <p>Missing required parameters for OAuth verification.</p>
          </div>
        );
      }

      if (!code) {
        setStep("Making the OAuth call...");
        // if there is no code present we are in the first step of the OAuth flow
        console.log("No authorization code found. Redirecting to LinkedIn...");
        const state = generateRandomState();
        const oauthUrl = getOAuthUrl(state, platform as PLATFORM_ID);
        window.location.href = await oauthUrl;
      } else {
        if(!isVerificationPending) {
          setIsVerificationPending(true);
          setStep("Making the verify call...");
          // the code is preset, make the verify call to chaim the stamp
          console.log("Authorization code found ...");
          // get address , challenge and signature from local storage
          const _address = localStorage.getItem("address");
          const _signature = localStorage.getItem("signature");
          const _credential = localStorage.getItem("credential");
          const _platform = localStorage.getItem("platform");
          const _scorerId = localStorage.getItem("scorerId");

          console.log("geri --- _address", _address);
          console.log("geri --- _signature", _signature);
          console.log("geri --- _scorerId", _scorerId);

          console.log("geri --- code", code);
          console.log("geri --- making verify call");
          try {
            const payload = {
              payload: {
                type: _platform || "unknown", // Ensure type is a string
                types: [_platform || "unknown"], // Ensure types contains strings
                version: "0.0.0",
                address: _address || "unknown",
                proofs: {
                  code,
                  sessionKey: state || "default_state",
                  signature: _signature,
                },
                signatureType: "EIP712",
              },
              challenge: _credential,
              scorerId: _scorerId,
            };

            // Make the verify call
            const response = await fetchVerifiableCredential(verifyEndpoint, payload);

            console.log("geri Verification response:", response);
            console.log("Verification response:", response);
            setStep("Verification successful!");
            setVerificationResponse(response);

            // window.close(); // Close the pop-up after sending the message
          } catch (error) {
            console.error("Error during verification:", error);
            setStep(`Verification failed to ${verifyEndpoint}`);
            setErrorMessages(`Error during verification: ${error}`);
          } finally {
            setLoading(false);
          }
          setIsVerificationPending(false);
        }
      }
    };

    handleOAuthFlow();
  }, [address, code, credential, platform, signature, state, scorerId]);

  const fetchVerifiableCredential = async (
    verifyEndpoint: string,
    data: {
      payload: {
        type: string;
        types: string[];
        version: string;
        address: string;
        proofs: { code: string; sessionKey: string };
      };
      challenge: string;
      scorerId: string;
    }
  ): Promise<VerificationResponseType | null> => {
    let parsedChallenge;
    try {
      parsedChallenge = data.challenge ? JSON.parse(data.challenge) : null;
    } catch (error) {
      setStep("Error parsing local storage values.");
      setErrorMessages(`Invalid JSON format in local storage. ${error}`);
      return null;
    }

    const response = await fetch(verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: { ...data.payload },
        challenge: parsedChallenge,
        scorerId: data.scorerId,
      }),
    });
    if (!response.ok) {
      throw new Error(`Verification failed with status ${response.status}`);
    }

    return await response.json();
  };

  // return <>{loading ? <Loader /> : <h1>Done</h1>}</>;
  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          {errorMessages ? (
            <div style={{ color: "red", marginBottom: "20px" }}>
              <h2>Error</h2>
              <p>{errorMessages}</p>
            </div>
          ) : verificationResponse ? (
            <div>
              <h1>Verification Successful!</h1>
              <pre>{JSON.stringify(verificationResponse, null, 2)}</pre>
            </div>
          ) : (
            <h1>{step}</h1>
          )}
        </div>
      )}
    </>
  );
}

export default App;
