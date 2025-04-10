// Format a phone number to standard format
export const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if the input is valid
    if (cleaned.length < 10) return phoneNumber;
    
    // US format: (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phoneNumber;
  };
  
  // Format currency values
  export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };
  
  // Format a number with thousand separators
  export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Format a percentage value
  export const formatPercentage = (value: number, decimalPlaces: number = 2): string => {
    return `${value.toFixed(decimalPlaces)}%`;
  };
  
  // Truncate text to a specific length and add ellipsis if needed
  export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  // Convert seconds to a formatted time string (HH:MM:SS)
  export const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Format a file size in bytes to a human-readable format
  export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // Convert camelCase to Title Case
  export const camelCaseToTitleCase = (text: string): string => {
    const result = text.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  };
  
  // Convert snake_case to Title Case
  export const snakeCaseToTitleCase = (text: string): string => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format role names for display (e.g., "camera_operator" to "Camera Operator")
  export const formatRoleName = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format email address to hide part of it for privacy
  export const obscureEmail = (email: string): string => {
    const [name, domain] = email.split('@');
    
    const obscuredName = name.charAt(0) + 
                        '*'.repeat(Math.max(1, name.length - 2)) + 
                        name.charAt(name.length - 1);
                        
    return `${obscuredName}@${domain}`;
  };
  
  // Format a JSON object as a formatted string (for debugging)
  export const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };