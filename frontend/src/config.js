// This file contains environment-specific configuration for the frontend
// It allows different settings for development and production environments

const config = {
  // API URL - uses relative path in production, full URL in development
  apiUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api',
  
  // Feature flags
  features: {
    // Enable debug logging in development only
    debugLogging: process.env.NODE_ENV !== 'production',
    
    // Enable mock data for testing without real APIs
    useMockData: false
  },
  
  // Pagination settings
  pagination: {
    emailsPerPage: 10,
    ordersPerPage: 5
  }
};

export default config;
