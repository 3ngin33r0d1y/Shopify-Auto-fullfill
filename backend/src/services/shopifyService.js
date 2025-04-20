const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class ShopifyService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize the Shopify service
   */
  async initialize() {
    try {
      // Load Shopify configuration from config file
      const configPath = path.join(__dirname, '../../shopify_config.json');
      if (!fs.existsSync(configPath)) {
        logger.error('Shopify config file not found');
        throw new Error('Shopify config file not found');
      }

      const configContent = fs.readFileSync(configPath);
      this.config = JSON.parse(configContent);

      if (!this.config.shop_url || !this.config.api_key || !this.config.password) {
        logger.error('Invalid Shopify configuration');
        throw new Error('Invalid Shopify configuration');
      }

      this.initialized = true;
      logger.info(`Shopify service initialized for shop: ${this.config.shop_url}`);
      return true;
    } catch (error) {
      logger.error(`Error initializing Shopify service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error('Shopify service not initialized');
    }
  }

  /**
   * Get unfulfilled orders
   * @param {number} limit - Maximum number of orders to retrieve
   * @returns {Array} - List of unfulfilled orders
   */
  async getUnfulfilledOrders(limit = 50) {
    try {
      this.checkInitialized();

      // Build URL for unfulfilled orders
      const url = `${this.config.shop_url}/admin/api/2023-01/orders.json`;
      const params = {
        status: 'open',
        fulfillment_status: 'unfulfilled',
        limit: limit
      };

      // Set up authentication
      const auth = {
        username: this.config.api_key,
        password: this.config.password
      };

      // Make request
      const response = await axios.get(url, { params, auth });
      const orders = response.data.orders || [];

      logger.info(`Retrieved ${orders.length} unfulfilled orders from Shopify`);

      // Process orders into a simpler format
      const processedOrders = orders.map(order => {
        // Extract customer name
        let customerName = '';
        if (order.customer) {
          const firstName = order.customer.first_name || '';
          const lastName = order.customer.last_name || '';
          customerName = `${firstName} ${lastName}`.trim();
        }

        // If customer name is empty, try to get it from shipping address
        if (!customerName && order.shipping_address) {
          customerName = order.shipping_address.name || '';
        }

        return {
          id: order.id.toString(),
          name: order.name,
          customerName,
          email: order.email,
          createdAt: order.created_at,
          totalPrice: order.total_price,
          lineItems: order.line_items,
          shippingAddress: order.shipping_address
        };
      });

      return processedOrders;
    } catch (error) {
      logger.error(`Error retrieving unfulfilled orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for unfulfilled orders by customer name
   * @param {string} customerName - Customer name to search for
   * @returns {Array} - List of matching unfulfilled orders
   */
  async searchUnfulfilledOrdersByCustomerName(customerName) {
    try {
      this.checkInitialized();

      if (!customerName) {
        logger.error('No customer name provided for search');
        return [];
      }

      // Normalize customer name for comparison
      const normalizedSearchName = customerName.toLowerCase().trim();

      // Get all unfulfilled orders (we'll filter them locally)
      const allOrders = await this.getUnfulfilledOrders(250);

      // Filter orders by customer name
      const matchingOrders = allOrders.filter(order => {
        if (!order.customerName) return false;
        
        const orderCustomerName = order.customerName.toLowerCase().trim();
        
        // Check for exact match
        if (orderCustomerName === normalizedSearchName) {
          return true;
        }
        
        // Check for partial match (first name or last name)
        const searchNameParts = normalizedSearchName.split(' ');
        const orderNameParts = orderCustomerName.split(' ');
        
        for (const searchPart of searchNameParts) {
          if (searchPart.length < 3) continue; // Skip very short name parts
          
          for (const orderPart of orderNameParts) {
            if (orderPart.includes(searchPart) || searchPart.includes(orderPart)) {
              return true;
            }
          }
        }
        
        return false;
      });

      logger.info(`Found ${matchingOrders.length} unfulfilled orders matching customer name: ${customerName}`);
      return matchingOrders;
    } catch (error) {
      logger.error(`Error searching for unfulfilled orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fulfill an order with tracking information
   * @param {string} orderId - Shopify order ID
   * @param {Object} trackingInfo - Tracking information object
   * @param {boolean} notifyCustomer - Whether to notify the customer
   * @returns {Object} - Fulfillment result
   */
  async fulfillOrder(orderId, trackingInfo, notifyCustomer = false) {
    try {
      this.checkInitialized();

      if (!orderId) {
        logger.error('No order ID provided for fulfillment');
        throw new Error('No order ID provided for fulfillment');
      }

      if (!trackingInfo || !trackingInfo.trackingNumber) {
        logger.error('No tracking information provided for fulfillment');
        throw new Error('No tracking information provided for fulfillment');
      }

      // Get order line items to fulfill
      const orderUrl = `${this.config.shop_url}/admin/api/2023-01/orders/${orderId}.json`;
      const auth = {
        username: this.config.api_key,
        password: this.config.password
      };

      const orderResponse = await axios.get(orderUrl, { auth });
      const order = orderResponse.data.order;

      if (!order) {
        logger.error(`Order not found: ${orderId}`);
        throw new Error(`Order not found: ${orderId}`);
      }

      // Get line items that need fulfillment
      const lineItems = order.line_items
        .filter(item => item.fulfillment_status !== 'fulfilled')
        .map(item => ({
          id: item.id,
          quantity: item.quantity
        }));

      if (lineItems.length === 0) {
        logger.warn(`No unfulfilled line items found for order: ${orderId}`);
        return {
          success: false,
          message: 'No unfulfilled line items found'
        };
      }

      // Create fulfillment
      const fulfillmentUrl = `${this.config.shop_url}/admin/api/2023-01/orders/${orderId}/fulfillments.json`;
      const fulfillmentData = {
        fulfillment: {
          line_items: lineItems,
          tracking_number: trackingInfo.trackingNumber,
          tracking_company: trackingInfo.carrier || 'Other',
          notify_customer: notifyCustomer
        }
      };

      const fulfillmentResponse = await axios.post(fulfillmentUrl, fulfillmentData, { auth });
      const fulfillment = fulfillmentResponse.data.fulfillment;

      logger.info(`Order ${orderId} fulfilled successfully with tracking number ${trackingInfo.trackingNumber}`);
      return {
        success: true,
        fulfillmentId: fulfillment.id.toString(),
        trackingNumber: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier || 'Other'
      };
    } catch (error) {
      logger.error(`Error fulfilling order: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new ShopifyService();
