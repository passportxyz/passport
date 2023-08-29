import axios from "axios";

// Based on https://axios-http.com/docs/handling_errors
export const handleAxiosError = <T extends Error>(
  error: any,
  label: string,
  // Accept any child class of Error
  ErrorClass: new (...args: any[]) => T,
  secretsToHide?: string[]
) => {
  if (axios.isAxiosError(error)) {
    let message = `Error making ${label} request, `;
    if (error.response) {
      // Received a non 2xx response
      const { data, status, headers } = error.response;
      message += `received error response with code ${status}: ${JSON.stringify(data)}, headers: ${JSON.stringify(
        headers
      )}`;
    } else if (error.request) {
      // No response received
      message += "no response received, " + error.message;
    } else {
      // Something happened in setting up the request that triggered an Error
      message += error.message;
    }
    secretsToHide?.forEach((secret) => {
      message = message.replace(secret, "[SECRET]");
    });
    throw new ErrorClass(message);
  }
  throw error;
};
