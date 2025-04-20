require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class GmailService {
  constructor() {
    this.credentials = null;
    this.token = null;
    this.oAuth2Client = null;
    this.gmail = null;
    this.initialized = false;
  }

  /**
   * Initialize the Gmail service
   */
  async initialize() {
    try {
      // Load client secrets from credentials file
      const credentialsPath = path.join(__dirname, '../../credentials.json');
      if (!fs.existsSync(credentialsPath)) {
        logger.error('Credentials file not found');
        throw new Error('Credentials file not found');
      }

      const credentialsContent = fs.readFileSync(credentialsPath);
      this.credentials = JSON.parse(credentialsContent);

      // Create OAuth2 client
      const { client_secret, client_id, redirect_uris } = this.credentials.installed;
      this.oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

      // Check if token exists
      const tokenPath = path.join(__dirname, '../../token.json');
      if (fs.existsSync(tokenPath)) {
        const tokenContent = fs.readFileSync(tokenPath);
        this.token = JSON.parse(tokenContent);
        this.oAuth2Client.setCredentials(this.token);
      } else {
        // If token doesn't exist, we'll need to get a new one
        throw new Error('Token not found. Authentication required.');
      }

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });
      this.initialized = true;
      logger.info('Gmail service initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Gmail service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate authentication URL for OAuth2
   */
  getAuthUrl() {
    if (!this.oAuth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  /**
   * Save token after authentication
   * @param {string} code - Authorization code
   */
  async saveToken(code) {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      this.oAuth2Client.setCredentials(tokens);
      this.token = tokens;

      // Save token to file
      const tokenPath = path.join(__dirname, '../../token.json');
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
      logger.info('Token saved successfully');

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.oAuth2Client });
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error(`Error saving token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the service is initialized
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error('Gmail service not initialized');
    }
  }

  /**
   * Get unread tracking emails
   * @param {number} maxResults - Maximum number of emails to retrieve
   * @returns {Array} - List of tracking emails
   */
  async getUnreadTrackingEmails(maxResults = 50) {
    try {
      this.checkInitialized();

      // Search for unread emails with tracking information
      const query = 'is:unread subject:"Your Countryside Pet Supply Order Has Been Updated"';
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults,
      });

      const messages = response.data.messages || [];
      logger.info(`Found ${messages.length} unread tracking emails`);

      if (messages.length === 0) {
        return [];
      }

      // Get full message details for each email
      const emails = await Promise.all(
        messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          return email.data;
        })
      );

      return emails;
    } catch (error) {
      logger.error(`Error retrieving tracking emails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get email content
   * @param {Object} email - Email object
   * @returns {Object} - Email content with subject, body, and headers
   */
  getEmailContent(email) {
    try {
      if (!email) {
        return null;
      }

      // Extract headers
      const headers = {};
      email.payload.headers.forEach((header) => {
        headers[header.name.toLowerCase()] = header.value;
      });

      // Extract subject
      const subject = headers.subject || '';

      // Extract body
      let body = '';
      if (email.payload.body.data) {
        // If body is in the main payload
        body = Buffer.from(email.payload.body.data, 'base64').toString('utf8');
      } else if (email.payload.parts) {
        // If body is in parts
        const htmlPart = email.payload.parts.find(
          (part) => part.mimeType === 'text/html'
        );
        const textPart = email.payload.parts.find(
          (part) => part.mimeType === 'text/plain'
        );

        if (htmlPart && htmlPart.body.data) {
          body = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
        } else if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
        }
      }

      return {
        id: email.id,
        threadId: email.threadId,
        subject,
        body,
        headers,
        date: headers.date,
        from: headers.from,
      };
    } catch (error) {
      logger.error(`Error extracting email content: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for confirmation emails by order number
   * @param {string} orderNumber - Order number to search for
   * @returns {Array} - List of confirmation emails
   */
  async searchConfirmationEmailsByOrderNumber(orderNumber) {
    try {
      this.checkInitialized();

      // Search for confirmation emails with the given order number
      const query = `subject:"Your Countryside Pet Supply Order Confirmation (#${orderNumber})"`;
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10,
      });

      const messages = response.data.messages || [];
      logger.info(`Found ${messages.length} confirmation emails for order #${orderNumber}`);

      if (messages.length === 0) {
        return [];
      }

      // Get full message details for each email
      const emails = await Promise.all(
        messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          return email.data;
        })
      );

      return emails;
    } catch (error) {
      logger.error(`Error searching for confirmation emails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark an email as read
   * @param {string} messageId - ID of the message to mark as read
   */
  async markAsRead(messageId) {
    try {
      this.checkInitialized();

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      logger.info(`Marked email ${messageId} as read`);
      return true;
    } catch (error) {
      logger.error(`Error marking email as read: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new GmailService();
