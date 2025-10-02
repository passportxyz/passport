export const AMAZON_CASUAL_PURCHASER_THRESHOLD = 1;
export const AMAZON_REGULAR_CUSTOMER_THRESHOLD = 10;
export const AMAZON_HEAVY_USER_THRESHOLD = 50;
export const UBER_OCCASIONAL_RIDER_THRESHOLD = 3;
export const UBER_REGULAR_RIDER_THRESHOLD = 25;
export const UBER_POWER_USER_THRESHOLD = 75;

export type ProviderGroup = "amazon" | "uber";

// Stop-fetch limits control email pagination: once we reach these proof counts,
// we stop fetching and processing additional emails for the given provider.
// Amazon: stop at 2 × the Heavy User threshold (i.e., proofs beyond this add no value).
export const AMAZON_STOP_FETCH_LIMIT = 2 * AMAZON_HEAVY_USER_THRESHOLD;
// Uber: stop at 2 × the Power User threshold.
export const UBER_STOP_FETCH_LIMIT = 2 * UBER_POWER_USER_THRESHOLD;

export const UBER_GROUP = "86de72c1-bd22-4f56-b120-eaf18e33eeeb";
export const AMAZON_GROUP = "02e02508-5675-48d1-b06c-007ac2295df9";
