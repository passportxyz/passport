export type ProviderError = {
  name?: string;
  message?: string;
  response?: {
    status?: number;
    statusText?: string;
    data: unknown;
  };
};

export function getErrorString(error: ProviderError): string {
  return `${error.name} - ${error.message}\n\t\
  response: Status ${error.response?.status} - ${error.response?.statusText}\n\t\
  response data: ${JSON.stringify(error?.response?.data)}`;
}
