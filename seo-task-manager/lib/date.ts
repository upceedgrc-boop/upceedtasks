import { format, parseISO } from "date-fns";

export const formatDate = (value?: string | Date | null, pattern = "yyyy/MM/dd") => {
  if (!value) return "-";
  const date = typeof value === "string" ? parseISO(value) : value;
  try {
    return format(date, pattern);
  } catch {
    return "-";
  }
};

export const toDateInputValue = (value?: string | Date | null) => {
  if (!value) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

export const todayInputValue = () => format(new Date(), "yyyy-MM-dd");

