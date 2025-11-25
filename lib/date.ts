import { format, parseISO, startOfWeek } from "date-fns";

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

export const startOfWeekInputValue = (value?: string | Date | null) => {
  const base =
    typeof value === "string" ? parseISO(value) : value instanceof Date ? value : new Date();
  try {
    const weekStart = startOfWeek(base, { weekStartsOn: 1 });
    return format(weekStart, "yyyy-MM-dd");
  } catch {
    return todayInputValue();
  }
};

export const formatTime = (value?: string | Date | null) => {
  if (!value) return "-";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return format(date, "HH:mm");
  } catch {
    return "-";
  }
};

export const formatTimeRange = (
  start?: string | Date | null,
  end?: string | Date | null
) => {
  if (!start || !end) return "-";
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (startLabel === "-" || endLabel === "-") return "-";
  return `${startLabel} - ${endLabel}`;
};

