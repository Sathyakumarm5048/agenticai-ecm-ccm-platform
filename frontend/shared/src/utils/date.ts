import { format, parseISO, formatDistanceToNow } from "date-fns";

export const formatDate = (date: string | Date, pattern = "yyyy-MM-dd") => {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern);
  } catch {
    return "";
  }
};

export const formatDateTime = (date: string | Date) => {
  return formatDate(date, "yyyy-MM-dd HH:mm");
};

export const timeAgo = (date: string | Date) => {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
};