import { format, formatDistanceToNow, isToday, isTomorrow, parseISO, differenceInHours } from "date-fns";

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "PPP 'at' p");
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "PPP");
};

export const formatTime = (time: string): string => {
  return time;
};

export const getRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return "Today";
  }
  
  if (isTomorrow(dateObj)) {
    return "Tomorrow";
  }
  
  return format(dateObj, "MMM d, yyyy");
};

export const getTimeUntilDeparture = (date: Date | string, time?: string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const hours = differenceInHours(dateObj, new Date());
  
  if (hours < 0) {
    return "Departed";
  }
  
  if (hours < 24) {
    return `Departs in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return `Departs in ${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? `, ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
};

export const formatTimestamp = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "PPP 'at' p");
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
