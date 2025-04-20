const cheerio = require('cheerio');
const logger = require('../utils/logger');

class ParserService {
  /**
   * Extract order number from tracking email
   * @param {Object} emailContent - Email content object from GmailService
   * @returns {string|null} - Order number or null if not found
   */
  extractOrderNumberFromTrackingEmail(emailContent) {
    try {
      if (!emailContent || !emailContent.subject) {
        logger.error('Invalid email content provided');
        return null;
      }

      // Try to extract from subject first (most reliable)
      const subjectMatch = emailContent.subject.match(/\(#(\d+)\)/);
      if (subjectMatch && subjectMatch[1]) {
        logger.info(`Extracted order number ${subjectMatch[1]} from subject`);
        return subjectMatch[1];
      }

      // If not found in subject, try to extract from body
      if (emailContent.body) {
        // Load HTML content
        const $ = cheerio.load(emailContent.body);
        
        // Look for text containing "Order #"
        const orderText = $('body').text().match(/Order\s+#(\d+)/i);
        if (orderText && orderText[1]) {
          logger.info(`Extracted order number ${orderText[1]} from body text`);
          return orderText[1];
        }
        
        // Look for order number in any element with class containing "order"
        const orderElement = $('[class*="order"]').text().match(/(\d{5,})/);
        if (orderElement && orderElement[1]) {
          logger.info(`Extracted order number ${orderElement[1]} from order element`);
          return orderElement[1];
        }
      }

      logger.warn('Could not extract order number from email');
      return null;
    } catch (error) {
      logger.error(`Error extracting order number: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract tracking number from tracking email
   * @param {Object} emailContent - Email content object from GmailService
   * @returns {Object|null} - Tracking info object or null if not found
   */
  extractTrackingNumberFromEmail(emailContent) {
    try {
      if (!emailContent || !emailContent.body) {
        logger.error('Invalid email content provided');
        return null;
      }

      // Load HTML content
      const $ = cheerio.load(emailContent.body);
      
      // Extract order number from subject
      let orderNumber = null;
      const subjectMatch = emailContent.subject.match(/\(#(\d+)\)/);
      if (subjectMatch && subjectMatch[1]) {
        orderNumber = subjectMatch[1];
      }

      // Look for USPS tracking
      let trackingNumber = null;
      let carrier = null;
      
      // Try different patterns for USPS
      const uspsPatterns = [
        /USPS\s+Tracking[^\d]*(\d+)/i,
        /Tracking\s+Number[^\d]*(\d+)/i,
        /tracking\s+number\s*:\s*(\d+)/i
      ];
      
      for (const pattern of uspsPatterns) {
        const bodyText = $('body').text();
        const match = bodyText.match(pattern);
        if (match && match[1]) {
          trackingNumber = match[1];
          carrier = 'USPS';
          break;
        }
      }
      
      // If not found, look for UPS tracking
      if (!trackingNumber) {
        const upsPatterns = [
          /UPS\s+Tracking[^\d]*(\d+)/i,
          /UPS[^\d]*(\d{1,2}[A-Z]\d{10})/i
        ];
        
        for (const pattern of upsPatterns) {
          const bodyText = $('body').text();
          const match = bodyText.match(pattern);
          if (match && match[1]) {
            trackingNumber = match[1];
            carrier = 'UPS';
            break;
          }
        }
      }
      
      // If still not found, look for any tracking links
      if (!trackingNumber) {
        const trackingLinks = $('a[href*="tracking"]');
        if (trackingLinks.length > 0) {
          const href = trackingLinks.attr('href');
          const match = href.match(/(\d{10,})/);
          if (match && match[1]) {
            trackingNumber = match[1];
            carrier = href.includes('usps') ? 'USPS' : 
                     href.includes('ups') ? 'UPS' : 'Other';
          }
        }
      }

      if (trackingNumber) {
        logger.info(`Extracted tracking number ${trackingNumber} (${carrier}) for order ${orderNumber}`);
        return {
          orderNumber,
          trackingNumber,
          carrier
        };
      }

      logger.warn('Could not extract tracking number from email');
      return null;
    } catch (error) {
      logger.error(`Error extracting tracking number: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract customer name from confirmation email
   * @param {Object} emailContent - Email content object from GmailService
   * @returns {string|null} - Customer name or null if not found
   */
  extractCustomerNameFromConfirmationEmail(emailContent) {
    try {
      if (!emailContent || !emailContent.body) {
        logger.error('Invalid email content provided');
        return null;
      }

      // Load HTML content
      const $ = cheerio.load(emailContent.body);
      
      // Look for billing address section
      let customerName = null;
      
      // Try to find billing address section
      const billingAddressSection = $('*:contains("Billing Address")').closest('table, div, section');
      
      if (billingAddressSection.length > 0) {
        // Get the text content of the billing address section
        const billingText = billingAddressSection.text();
        
        // Extract the first line after "Billing Address" which should be the name
        const nameMatch = billingText.match(/Billing Address\s*(?::|)\s*([A-Za-z\s]+)/);
        if (nameMatch && nameMatch[1]) {
          customerName = nameMatch[1].trim();
        }
      }
      
      // If not found in billing address section, try other methods
      if (!customerName) {
        // Look for "Dear [Name]" pattern
        const dearMatch = $('body').text().match(/Dear\s+([A-Za-z\s]+),/);
        if (dearMatch && dearMatch[1]) {
          customerName = dearMatch[1].trim();
        }
      }
      
      if (!customerName) {
        // Look for "Thank you, [Name]" pattern
        const thankYouMatch = $('body').text().match(/Thank you,\s+([A-Za-z\s]+)/);
        if (thankYouMatch && thankYouMatch[1]) {
          customerName = thankYouMatch[1].trim();
        }
      }

      if (customerName) {
        logger.info(`Extracted customer name: ${customerName}`);
        return customerName;
      }

      logger.warn('Could not extract customer name from confirmation email');
      return null;
    } catch (error) {
      logger.error(`Error extracting customer name: ${error.message}`);
      return null;
    }
  }
}

module.exports = new ParserService();
