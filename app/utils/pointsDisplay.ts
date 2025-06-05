/**
 * Formats point values for display with deduplication awareness
 *
 * @param points - The numerical point value to format
 * @param isDeduplicated - Whether the stamp is deduplicated (defaults to false)
 * @param decimals - Number of decimal places to show (defaults to 1)
 * @returns Formatted string - "0" for deduplicated zero points, normal toFixed() formatting otherwise
 */
export const formatPointsDisplay = (points: number, isDeduplicated: boolean = false, decimals: number = 1): string => {
  const formatted = points.toFixed(decimals);

  // Special case: deduplicated stamps that round to 0 show as "0" not "0.0"
  if (isDeduplicated && parseFloat(formatted) === 0) {
    return "0";
  }

  // Normal formatting with specified decimal places
  return formatted;
};
