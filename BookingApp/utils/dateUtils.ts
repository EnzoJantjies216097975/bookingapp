import { format, parse, isValid, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, differenceInHours, isAfter, isBefore, isEqual, isSameDay } from 'date-fns';

// Format a date to a string with specified format
export const formatDate = (date: Date | null, formatString: string = 'MMM d, yyyy'): string => {
  if (!date || !isValid(date)) return 'Invalid date';
  return format(date, formatString);
};

// Format time only (hour:minute)
export const formatTime = (date: Date | null, formatString: string = 'h:mm a'): string => {
  if (!date || !isValid(date)) return 'Invalid time';
  return format(date, formatString);
};

// Format date and time together
export const formatDateTime = (date: Date | null, formatString: string = 'MMM d, yyyy h:mm a'): string => {
  if (!date || !isValid(date)) return 'Invalid date/time';
  return format(date, formatString);
};

// Parse a string to a date with specified format
export const parseDate = (dateString: string, formatString: string = 'yyyy-MM-dd'): Date | null => {
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

// Get start and end of a week containing the given date
export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  return { start, end };
};

// Get start and end of a month containing the given date
export const getMonthRange = (date: Date): { start: Date; end: Date } => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return { start, end };
};

// Calculate duration between two dates in minutes
export const getDurationMinutes = (startDate: Date, endDate: Date): number => {
  return differenceInMinutes(endDate, startDate);
};

// Calculate duration between two dates in hours (with decimal)
export const getDurationHours = (startDate: Date, endDate: Date): number => {
  return differenceInHours(endDate, startDate) + 
         (differenceInMinutes(endDate, startDate) % 60) / 60;
};

// Format duration as hours:minutes
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Check if a date is in the past
export const isPastDate = (date: Date): boolean => {
  return isBefore(date, new Date());
};

// Check if a date is today
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

// Check if one date is after another
export const isDateAfter = (date: Date, dateToCompare: Date): boolean => {
  return isAfter(date, dateToCompare);
};

// Check if one date is before another
export const isDateBefore = (date: Date, dateToCompare: Date): boolean => {
  return isBefore(date, dateToCompare);
};

// Check if two dates are the same (ignoring time)
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

// Add days to a date
export const addDaysToDate = (date: Date, days: number): Date => {
  return addDays(date, days);
};

// Subtract days from a date
export const subtractDaysFromDate = (date: Date, days: number): Date => {
  return subDays(date, days);
};

// Get an array of date strings between two dates
export const getDatesBetween = (startDate: Date, endDate: Date, formatString: string = 'yyyy-MM-dd'): string[] => {
  const dates: string[] = [];
  let currentDate = startDate;
  
  while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
    dates.push(format(currentDate, formatString));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
};