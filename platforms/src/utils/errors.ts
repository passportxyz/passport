export function getErrorString(error: any): string {
  return `${error.name} - ${error.message}\n\t\
  response: Status ${error.response?.status} - ${error.response?.statusText}\n\t\
  response data: ${JSON.stringify(error?.response?.data)}`;
}
