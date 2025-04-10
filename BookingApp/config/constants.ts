// App constants
export const CONSTANTS = {
    APP_VERSION: '1.0.0',
    APP_NAME: 'TV Production Booking App',
    APP_SETTINGS_KEY: 'tv_production_app_settings',
    
    // API endpoints
    API_BASE_URL: 'https://bookingapp-429d2.firebaseapp.com',
    API_TIMEOUT: 30000, // 30 seconds
    
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    
    // Date formats
    DATE_FORMAT: 'MMM d, yyyy',
    TIME_FORMAT: 'h:mm a',
    DATETIME_FORMAT: 'MMM d, yyyy h:mm a',
    
    // Storage keys
    AUTH_USER_KEY: 'auth_user',
    AUTH_TOKEN_KEY: 'auth_token',
    THEME_PREFERENCE_KEY: 'theme_preference',
    
    // Notification channels
    NOTIFICATION_CHANNELS: {
      PRODUCTION_UPDATES: 'production_updates',
      ASSIGNMENTS: 'assignments',
      REMINDERS: 'reminders',
      ISSUES: 'issues',
    },
    
    // User roles (for readability)
    ROLES: {
      PRODUCER: 'producer',
      BOOKING_OFFICER: 'booking_officer',
      CAMERA_OPERATOR: 'camera_operator',
      SOUND_OPERATOR: 'sound_operator',
      LIGHTING_OPERATOR: 'lighting_operator',
      EVS_OPERATOR: 'evs_operator',
      DIRECTOR: 'director',
      STREAM_OPERATOR: 'stream_operator',
      TECHNICIAN: 'technician',
      ELECTRICIAN: 'electrician',
    },
    
    // Production statuses
    PRODUCTION_STATUS: {
      REQUESTED: 'requested',
      CONFIRMED: 'confirmed',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      OVERTIME: 'overtime',
    },
    
    // Issue priorities
    ISSUE_PRIORITY: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
    },
    
    // Issue statuses
    ISSUE_STATUS: {
      PENDING: 'pending',
      IN_PROGRESS: 'in-progress',
      RESOLVED: 'resolved',
    },
    
    // Venues
    VENUES: [
      'Studio 1',
      'Studio 2',
      'Studio 3',
      'Studio 4',
      'Location',
    ],
    
    // Error messages
    ERRORS: {
      NETWORK_ERROR: 'Network error. Please check your connection and try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      AUTHENTICATION_ERROR: 'Authentication error. Please login again.',
      PERMISSION_ERROR: 'You do not have permission to perform this action.',
      VALIDATION_ERROR: 'Please check the form for errors.',
      UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
    },
    
    // Animation durations
    ANIMATION: {
      FAST: 200,
      NORMAL: 300,
      SLOW: 500,
    },
    
    // Breakpoints (for responsive design)
    BREAKPOINTS: {
      SMALL: 576,
      MEDIUM: 768,
      LARGE: 992,
      EXTRA_LARGE: 1200,
    },
    
    // Colors
    COLORS: {
      PRIMARY: '#007bff',
      SECONDARY: '#6c757d',
      SUCCESS: '#28a745',
      DANGER: '#dc3545',
      WARNING: '#ffc107',
      INFO: '#17a2b8',
      LIGHT: '#f8f9fa',
      DARK: '#343a40',
    },
  };
  
  // Export individual constants for ease of use
  export const { COLORS, ROLES, PRODUCTION_STATUS, ISSUE_PRIORITY, ISSUE_STATUS, VENUES } = CONSTANTS;