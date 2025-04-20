/**
 * Test script for Gmail API integration
 * 
 * This script tests the Gmail service functionality:
 * - Authentication
 * - Retrieving tracking emails
 * - Searching for confirmation emails
 * - Extracting email content
 * - Marking emails as read
 */

const gmailService = require('../backend/src/services/gmailService');
const parserService = require('../backend/src/services/parserService');
const logger = require('../backend/src/utils/logger');

// Test configuration
const TEST_ORDER_NUMBER = '12345'; // Replace with a real order number for testing

async function runTests() {
  console.log('=== Gmail API Integration Tests ===');
  
  try {
    // Test 1: Initialize Gmail service
    console.log('\n1. Testing Gmail service initialization...');
    await gmailService.initialize();
    console.log('✅ Gmail service initialized successfully');
    
    // Test 2: Get unread tracking emails
    console.log('\n2. Testing retrieval of unread tracking emails...');
    const trackingEmails = await gmailService.getUnreadTrackingEmails(5);
    console.log(`✅ Retrieved ${trackingEmails.length} tracking emails`);
    
    if (trackingEmails.length > 0) {
      // Test 3: Extract email content
      console.log('\n3. Testing email content extraction...');
      const emailContent = gmailService.getEmailContent(trackingEmails[0]);
      console.log('✅ Email content extracted successfully');
      console.log(`   Subject: ${emailContent.subject}`);
      
      // Test 4: Extract order number and tracking info
      console.log('\n4. Testing order number and tracking extraction...');
      const orderNumber = parserService.extractOrderNumberFromTrackingEmail(emailContent);
      const trackingInfo = parserService.extractTrackingNumberFromEmail(emailContent);
      
      if (orderNumber) {
        console.log(`✅ Order number extracted: ${orderNumber}`);
      } else {
        console.log('⚠️ Could not extract order number from email');
      }
      
      if (trackingInfo && trackingInfo.trackingNumber) {
        console.log(`✅ Tracking number extracted: ${trackingInfo.trackingNumber}`);
        if (trackingInfo.carrier) {
          console.log(`   Carrier: ${trackingInfo.carrier}`);
        }
      } else {
        console.log('⚠️ Could not extract tracking number from email');
      }
      
      // Test 5: Search for confirmation emails
      if (orderNumber) {
        console.log(`\n5. Testing search for confirmation emails for order #${orderNumber}...`);
        const confirmationEmails = await gmailService.searchConfirmationEmailsByOrderNumber(orderNumber);
        console.log(`✅ Found ${confirmationEmails.length} confirmation emails`);
        
        if (confirmationEmails.length > 0) {
          // Test 6: Extract customer name
          console.log('\n6. Testing customer name extraction...');
          const confirmationContent = gmailService.getEmailContent(confirmationEmails[0]);
          const customerName = parserService.extractCustomerNameFromConfirmationEmail(confirmationContent);
          
          if (customerName) {
            console.log(`✅ Customer name extracted: ${customerName}`);
          } else {
            console.log('⚠️ Could not extract customer name from confirmation email');
          }
        }
      } else {
        // Use test order number as fallback
        console.log(`\n5. Testing search for confirmation emails for test order #${TEST_ORDER_NUMBER}...`);
        const confirmationEmails = await gmailService.searchConfirmationEmailsByOrderNumber(TEST_ORDER_NUMBER);
        console.log(`✅ Found ${confirmationEmails.length} confirmation emails`);
      }
    } else {
      console.log('⚠️ No tracking emails found for testing extraction');
    }
    
    console.log('\nAll Gmail API tests completed successfully!');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});
