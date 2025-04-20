// Update ApiService to use the config file for API URL
import axios from 'axios';
import config from '../config';

class ApiService {
  /**
   * Check Gmail authentication status
   * @returns {Promise<Object>} Authentication status
   */
  async checkGmailAuth() {
    try {
      // Try to get tracking emails as a way to check authentication
      const response = await axios.get(`${config.apiUrl}/emails/tracking`);
      return { authenticated: true, data: response.data };
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return { authenticated: false };
      }
      throw error;
    }
  }

  /**
   * Get Gmail authentication URL
   * @returns {Promise<Object>} Authentication URL
   */
  async getGmailAuthUrl() {
    const response = await axios.get(`${config.apiUrl}/auth/gmail/url`);
    return response.data;
  }

  /**
   * Save Gmail authentication token
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Authentication result
   */
  async saveGmailToken(code) {
    const response = await axios.post(`${config.apiUrl}/auth/gmail/token`, { code });
    return response.data;
  }

  /**
   * Get unread tracking emails
   * @returns {Promise<Object>} Tracking emails
   */
  async getTrackingEmails() {
    const response = await axios.get(`${config.apiUrl}/emails/tracking`);
    return response.data;
  }

  /**
   * Get confirmation emails for an order number
   * @param {string} orderNumber - Order number to search for
   * @returns {Promise<Object>} Confirmation emails
   */
  async getConfirmationEmails(orderNumber) {
    const response = await axios.get(`${config.apiUrl}/emails/confirmation/${orderNumber}`);
    return response.data;
  }

  /**
   * Mark an email as read
   * @param {string} messageId - ID of the message to mark as read
   * @returns {Promise<Object>} Result
   */
  async markEmailAsRead(messageId) {
    const response = await axios.post(`${config.apiUrl}/emails/mark-read`, { messageId });
    return response.data;
  }

  /**
   * Get unfulfilled Shopify orders
   * @returns {Promise<Object>} Unfulfilled orders
   */
  async getUnfulfilledOrders() {
    const response = await axios.get(`${config.apiUrl}/shopify/orders`);
    return response.data;
  }

  /**
   * Search for unfulfilled orders by customer name
   * @param {string} customerName - Customer name to search for
   * @returns {Promise<Object>} Matching unfulfilled orders
   */
  async searchOrdersByCustomerName(customerName) {
    const response = await axios.get(`${config.apiUrl}/shopify/orders/search/${encodeURIComponent(customerName)}`);
    return response.data;
  }

  /**
   * Fulfill an order with tracking information
   * @param {string} orderId - Shopify order ID
   * @param {Object} trackingInfo - Tracking information object
   * @param {boolean} notifyCustomer - Whether to notify the customer
   * @returns {Promise<Object>} Fulfillment result
   */
  async fulfillOrder(orderId, trackingInfo, notifyCustomer = false) {
    const response = await axios.post(`${config.apiUrl}/shopify/fulfill`, {
      orderId,
      trackingInfo,
      notifyCustomer
    });
    return response.data;
  }

  /**
   * Process a tracking email through the complete workflow
   * @param {string} emailId - ID of the tracking email
   * @returns {Promise<Object>} Processing result
   */
  async processTrackingEmail(emailId) {
    const response = await axios.post(`${config.apiUrl}/process/tracking-email`, { emailId });
    return response.data;
  }
}

export default new ApiService();
