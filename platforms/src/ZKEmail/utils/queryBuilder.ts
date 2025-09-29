/**
 * Builds a Gmail query string for subject keyword filtering
 * @param keywords - Array of keywords to search for in email subjects
 * @returns Gmail query string in format: (subject:keyword1 OR subject:keyword2 ...)
 */
export function buildSubjectQuery(keywords: string[]): string {
  if (!keywords || keywords.length === 0) {
    return "";
  }

  // Escape special characters that might interfere with Gmail query syntax
  const escapeKeyword = (keyword: string): string => {
    // Gmail query uses quotes for exact phrases with spaces or special chars
    // We'll quote keywords that contain spaces or special characters
    if (/[\s(){}[\]"']/.test(keyword)) {
      // Escape quotes within the keyword and wrap in quotes
      return `"${keyword.replace(/"/g, '\\"')}"`;
    }
    return keyword;
  };

  // Build the OR query for subjects
  const subjectQueries = keywords.map((keyword) => `subject:${escapeKeyword(keyword)}`);

  // Join with OR and wrap in parentheses for proper grouping
  return `(${subjectQueries.join(" OR ")})`;
}

/**
 * Builds a combined Gmail query with subject filtering
 * Useful for adding subject filters to existing queries
 * @param baseQuery - The base query (if any)
 * @param subjectKeywords - Keywords to filter subjects
 * @returns Combined Gmail query string
 */
export function buildCombinedQuery(baseQuery: string, subjectKeywords: string[]): string {
  const subjectQuery = buildSubjectQuery(subjectKeywords);

  if (!subjectQuery) {
    return baseQuery;
  }

  if (!baseQuery) {
    return subjectQuery;
  }

  // Combine with AND to ensure both conditions are met
  return `(${baseQuery}) AND ${subjectQuery}`;
}
