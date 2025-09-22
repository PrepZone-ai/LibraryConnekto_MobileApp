/**
 * Utility functions for date and time formatting
 */

/**
 * Format a date to Indian Standard Time (IST)
 * @param date Date to format
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string in IST
 */
export const formatToIST = (date: Date, includeTime: boolean = true): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = true;
  }

  return date.toLocaleString('en-US', options);
};

/**
 * Get current date and time in IST
 * @param includeTime Whether to include time in the returned string
 * @returns Current date and time string in IST
 */
export const getCurrentISTTime = (includeTime: boolean = true): string => {
  return formatToIST(new Date(), includeTime);
};

/**
 * Convert a date string to IST format
 * @param dateString Date string to convert
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string in IST
 */
export const convertToIST = (dateString: string, includeTime: boolean = true): string => {
  const date = new Date(dateString);
  return formatToIST(date, includeTime);
};
