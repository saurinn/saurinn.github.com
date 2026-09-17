/**
 * Format an ISO timestamp the way post metadata is displayed, e.g. "Aug 23, 2025".
 */
export const processArticleDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
};
