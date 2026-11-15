export { cn } from "cn";

/**
 * Format any ISO date/timestamp string or Date object into Pakistan Standard Time (UTC+5)
 * Handles backend strings without 'Z' by treating them as UTC.
 */
export function formatToUTC5(dateStrOrObj?: string | Date | null): string {
  if (!dateStrOrObj) return "";
  let date: Date;
  if (typeof dateStrOrObj === "string") {
    const isoStr =
      dateStrOrObj.endsWith("Z") || dateStrOrObj.includes("+")
        ? dateStrOrObj
        : `${dateStrOrObj}Z`;
    date = new Date(isoStr);
  } else {
    date = new Date(dateStrOrObj);
  }
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Karachi",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
