import { useState, useEffect } from "react";
import Loader from "./components/Loader";

const VERIFICATION_URL = import.meta.env.VITE_VERIFY_URL as string;

const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2);
};

// this will be taken dynamically from the platform Provider.
// the provider name will be received as a query parameter

const getOAuthUrl = async (state: string): Promise<string> => {
  const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
  const clinetID = import.meta.env.VITE_APP_LINKEDIN_CLIENT_ID! as string;
  const redirectURI = import.meta.env.VITE_REDIRECT_URI! as string;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clinetID,
    redirect_uri: redirectURI,
    scope: "profile email openid",
    state: state,
  });

  const linkedinUrl = `${AUTH_URL}?${params.toString()}`;
  return await Promise.resolve(linkedinUrl);
};

function App() {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<string>("Initializing...");
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const [verificationResponse, setVerificationResponse] = useState<any | null>(undefined);

  // load query parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const address = urlParams.get("address");
  const platform = urlParams.get("platform");
  const signature = urlParams.get("signature");
  const credential = urlParams.get("credential");

  if (address && signature && credential && platform) {
    // preserve the values in local storage
    // when the OAuth flow is complete, the code will be present but the address, signature, platform and credential will be null
    // so we only store them in the localStorage if they are not null.
    localStorage.setItem("address", address);
    localStorage.setItem("platform", platform);
    localStorage.setItem("signature", signature);
    localStorage.setItem("credential", credential);
  }

  useEffect(() => {
    const handleOAuthFlow = async () => {
      const verifyEndpoint = VERIFICATION_URL;

      // Check if the required values are missing
      const isBadRequest = (!code || !state) && (!address || !signature || !credential || !platform);

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
        const linkedinAuthUrl = getOAuthUrl(state);
        window.location.href = await linkedinAuthUrl;
      } else {
        setStep("Making the verify call...");
        // the code is preset, make the verify call to chaim the stamp
        console.log("Authorization code found ...");
        // get address , challenge and signature from local storage
        const _address = localStorage.getItem("address");
        const _signature = localStorage.getItem("signature");
        const _credential = localStorage.getItem("credential");
        const _platform = localStorage.getItem("platform");

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
          };

          // Make the verify call
          const response = await fetchVerifiableCredential(verifyEndpoint, payload);

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
      }
    };

    handleOAuthFlow();
  }, []);

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
      challenge: string | null;
    }
  ): Promise<any> => {
    let parsedChallenge;
    try {
      parsedChallenge = data.challenge ? JSON.parse(data.challenge) : null;
    } catch (error) {
      setStep("Error parsing local storage values.");
      setErrorMessages(`Invalid JSON format in local storage. ${error}`);
      return;
    }

    const response = await fetch(verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: { ...data.payload },
        challenge: parsedChallenge,
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
