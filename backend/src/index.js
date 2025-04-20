// Add CORS handling for development environment
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');

// Import services
const gmailService = require('./services/gmailService');
const shopifyService = require('./services/shopifyService');
const parserService = require('./services/parserService');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS for development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(morgan('dev'));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
}

// API Routes
const apiRouter = express.Router();

// Auth routes
apiRouter.get('/auth/gmail/url', async (req, res) => {
  try {
    await gmailService.initialize();
    const authUrl = gmailService.getAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    logger.error(`Error getting Gmail auth URL: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/auth/gmail/token', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }

    await gmailService.initialize();
    await gmailService.saveToken(code);
    res.json({ success: true, message: 'Gmail authentication successful' });
  } catch (error) {
    logger.error(`Error saving Gmail token: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email routes
apiRouter.get('/emails/tracking', async (req, res) => {
  try {
    await gmailService.initialize();
    const emails = await gmailService.getUnreadTrackingEmails();
    
    // Process emails to extract content
    const processedEmails = emails.map(email => {
      const content = gmailService.getEmailContent(email);
      const orderNumber = parserService.extractOrderNumberFromTrackingEmail(content);
      const trackingInfo = parserService.extractTrackingNumberFromEmail(content);
      
      return {
        id: email.id,
        threadId: email.threadId,
        subject: content.subject,
        date: content.date,
        from: content.from,
        orderNumber,
        trackingInfo
      };
    });
    
    res.json({ success: true, emails: processedEmails });
  } catch (error) {
    logger.error(`Error retrieving tracking emails: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/emails/confirmation/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'Order number is required' });
    }

    await gmailService.initialize();
    const emails = await gmailService.searchConfirmationEmailsByOrderNumber(orderNumber);
    
    // Process emails to extract content and customer name
    const processedEmails = emails.map(email => {
      const content = gmailService.getEmailContent(email);
      const customerName = parserService.extractCustomerNameFromConfirmationEmail(content);
      
      return {
        id: email.id,
        threadId: email.threadId,
        subject: content.subject,
        date: content.date,
        from: content.from,
        orderNumber,
        customerName
      };
    });
    
    res.json({ success: true, emails: processedEmails });
  } catch (error) {
    logger.error(`Error retrieving confirmation emails: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/emails/mark-read', async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ success: false, error: 'Message ID is required' });
    }

    await gmailService.initialize();
    await gmailService.markAsRead(messageId);
    res.json({ success: true, message: 'Email marked as read' });
  } catch (error) {
    logger.error(`Error marking email as read: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shopify routes
apiRouter.get('/shopify/orders', async (req, res) => {
  try {
    await shopifyService.initialize();
    const orders = await shopifyService.getUnfulfilledOrders();
    res.json({ success: true, orders });
  } catch (error) {
    logger.error(`Error retrieving unfulfilled orders: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/shopify/orders/search/:customerName', async (req, res) => {
  try {
    const { customerName } = req.params;
    if (!customerName) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    await shopifyService.initialize();
    const orders = await shopifyService.searchUnfulfilledOrdersByCustomerName(customerName);
    res.json({ success: true, orders });
  } catch (error) {
    logger.error(`Error searching for unfulfilled orders: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/shopify/fulfill', async (req, res) => {
  try {
    const { orderId, trackingInfo, notifyCustomer } = req.body;
    if (!orderId || !trackingInfo) {
      return res.status(400).json({ success: false, error: 'Order ID and tracking info are required' });
    }

    await shopifyService.initialize();
    const result = await shopifyService.fulfillOrder(orderId, trackingInfo, notifyCustomer);
    
    if (result.success) {
      res.json({ success: true, fulfillment: result });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error) {
    logger.error(`Error fulfilling order: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process tracking email workflow
apiRouter.post('/process/tracking-email', async (req, res) => {
  try {
    const { emailId } = req.body;
    if (!emailId) {
      return res.status(400).json({ success: false, error: 'Email ID is required' });
    }

    // Initialize services
    await gmailService.initialize();
    await shopifyService.initialize();

    // Get the tracking email
    const email = await gmailService.gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full',
    });

    // Extract content and order number
    const emailContent = gmailService.getEmailContent(email.data);
    const orderNumber = parserService.extractOrderNumberFromTrackingEmail(emailContent);
    const trackingInfo = parserService.extractTrackingNumberFromEmail(emailContent);

    if (!orderNumber) {
      return res.status(400).json({ success: false, error: 'Could not extract order number from email' });
    }

    if (!trackingInfo || !trackingInfo.trackingNumber) {
      return res.status(400).json({ success: false, error: 'Could not extract tracking number from email' });
    }

    // Find confirmation email for this order number
    const confirmationEmails = await gmailService.searchConfirmationEmailsByOrderNumber(orderNumber);
    
    if (confirmationEmails.length === 0) {
      return res.status(400).json({ success: false, error: 'No confirmation email found for this order number' });
    }

    // Extract customer name from confirmation email
    const confirmationContent = gmailService.getEmailContent(confirmationEmails[0]);
    const customerName = parserService.extractCustomerNameFromConfirmationEmail(confirmationContent);

    if (!customerName) {
      return res.status(400).json({ success: false, error: 'Could not extract customer name from confirmation email' });
    }

    // Search for unfulfilled orders matching this customer name
    const matchingOrders = await shopifyService.searchUnfulfilledOrdersByCustomerName(customerName);

    // Return the complete workflow result
    res.json({
      success: true,
      orderNumber,
      trackingInfo,
      customerName,
      matchingOrders
    });
  } catch (error) {
    logger.error(`Error processing tracking email: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Mount API router
app.use('/api', apiRouter);

// Catch-all route to return the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Initialize services on startup
(async () => {
  try {
    logger.info('Initializing services...');
    
    try {
      await gmailService.initialize();
      logger.info('Gmail service initialized successfully');
    } catch (error) {
      logger.warn(`Gmail service initialization failed: ${error.message}`);
      logger.info('Gmail authentication will be required');
    }
    
    try {
      await shopifyService.initialize();
      logger.info('Shopify service initialized successfully');
    } catch (error) {
      logger.error(`Shopify service initialization failed: ${error.message}`);
    }
    
    logger.info('Server initialization complete');
  } catch (error) {
    logger.error(`Server initialization error: ${error.message}`);
  }
})();

module.exports = app;
