// Validate email format
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate phone number (basic check)
  export const isValidPhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters for checking
    const digits = phone.replace(/\D/g, '');
    // Checking for a minimum of 10 digits (most countries)
    return digits.length >= 10;
  };
  
  // Validate password strength
  export interface PasswordStrengthResult {
    isValid: boolean;
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    score: number; // 0-4 score, 0 = very weak, 4 = very strong
  }
  
  export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
    const minLength = 8;
    const hasMinLength = password.length >= minLength;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    
    // Calculate score based on criteria
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;
    
    return {
      isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      score
    };
  };
  
  // Validate a URL
  export const isValidURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // Validate if a string is a valid date
  export const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  
  // Check if a date is in the future
  export const isFutureDate = (date: Date): boolean => {
    const now = new Date();
    return date > now;
  };
  
  // Check if a date is in the past
  export const isPastDate = (date: Date): boolean => {
    const now = new Date();
    return date < now;
  };
  
  // Validate if a string contains only letters
  export const isAlphabetic = (text: string): boolean => {
    return /^[A-Za-z]+$/.test(text);
  };
  
  // Validate if a string contains only numbers
  export const isNumeric = (text: string): boolean => {
    return /^[0-9]+$/.test(text);
  };
  
  // Validate if a string contains only letters and numbers
  export const isAlphanumeric = (text: string): boolean => {
    return /^[A-Za-z0-9]+$/.test(text);
  };
  
  // Validate time format (HH:MM)
  export const isValidTimeFormat = (time: string): boolean => {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };
  
  // Check if string is empty or only whitespace
  export const isEmptyString = (text: string): boolean => {
    return text.trim() === '';
  };
  
  // Validate an array has at least N items
  export const hasMinItems = (array: any[], minItems: number): boolean => {
    return array.length >= minItems;
  };
  
  // Validate a number is within range
  export const isInRange = (num: number, min: number, max: number): boolean => {
    return num >= min && num <= max;
  };
  
  // Validate form input (generic)
  export const validateFormField = (
    value: string,
    rules: { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp }
  ): { valid: boolean; message?: string } => {
    // Check required
    if (rules.required && isEmptyString(value)) {
      return { valid: false, message: 'This field is required' };
    }
    
    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
      return { valid: false, message: `Minimum length is ${rules.minLength} characters` };
    }
    
    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return { valid: false, message: `Maximum length is ${rules.maxLength} characters` };
    }
    
    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, message: 'Invalid format' };
    }
    
    return { valid: true };
  };