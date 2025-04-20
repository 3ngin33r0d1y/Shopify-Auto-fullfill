/**
 * Test script for end-to-end workflow
 * 
 * This script tests the complete order fulfillment workflow:
 * - Retrieving tracking emails
 * - Finding confirmation emails
 * - Matching with Shopify orders
 * - Fulfilling orders
 */

const gmailService = require('../backend/src/services/gmailService');
const shopifyService = require('../backend/src/services/shopifyService');
const parserService = require('../backend/src/services/parserService');

// Test configuration
const MAX_EMAILS = 5; // Maximum number of emails to retrieve for testing

async function runEndToEndTest() {
  console.log('=== End-to-End Workflow Test ===');
  
  try {
    // Step 1: Initialize services
    console.log('\n1. Initializing services...');
    await gmailService.initialize();
    await shopifyService.initialize();
    console.log('✅ Services initialized successfully');
    
    // Step 2: Get unread tracking emails
    console.log('\n2. Retrieving unread tracking emails...');
    const trackingEmails = await gmailService.getUnreadTrackingEmails(MAX_EMAILS);
    console.log(`✅ Retrieved ${trackingEmails.length} tracking emails`);
    
    if (trackingEmails.length === 0) {
      console.log('⚠️ No tracking emails found. Test cannot continue.');
      return;
    }
    
    // Process each tracking email
    for (let i = 0; i < trackingEmails.length; i++) {
      const trackingEmail = trackingEmails[i];
      console.log(`\n--- Processing Tracking Email ${i+1}/${trackingEmails.length} ---`);
      
      // Step 3: Extract content and order number
      const emailContent = gmailService.getEmailContent(trackingEmail);
      console.log(`Email Subject: ${emailContent.subject}`);
      
      const orderNumber = parserService.extractOrderNumberFromTrackingEmail(emailContent);
      if (!orderNumber) {
        console.log('⚠️ Could not extract order number. Skipping this email.');
        continue;
      }
      console.log(`✅ Extracted Order Number: ${orderNumber}`);
      
      // Step 4: Extract tracking information
      const trackingInfo = parserService.extractTrackingNumberFromEmail(emailContent);
      if (!trackingInfo || !trackingInfo.trackingNumber) {
        console.log('⚠️ Could not extract tracking number. Skipping this email.');
        continue;
      }
      console.log(`✅ Extracted Tracking Number: ${trackingInfo.trackingNumber}`);
      if (trackingInfo.carrier) {
        console.log(`   Carrier: ${trackingInfo.carrier}`);
      }
      
      // Step 5: Find confirmation email for this order number
      console.log(`\n3. Searching for confirmation emails for order #${orderNumber}...`);
      const confirmationEmails = await gmailService.searchConfirmationEmailsByOrderNumber(orderNumber);
      console.log(`✅ Found ${confirmationEmails.length} confirmation emails`);
      
      if (confirmationEmails.length === 0) {
        console.log('⚠️ No confirmation emails found. Skipping this order.');
        continue;
      }
      
      // Step 6: Extract customer name from confirmation email
      const confirmationContent = gmailService.getEmailContent(confirmationEmails[0]);
      const customerName = parserService.extractCustomerNameFromConfirmationEmail(confirmationContent);
      
      if (!customerName) {
        console.log('⚠️ Could not extract customer name. Skipping this order.');
        continue;
      }
      console.log(`✅ Extracted Customer Name: ${customerName}`);
      
      // Step 7: Search for unfulfilled orders matching this customer name
      console.log(`\n4. Searching for unfulfilled orders for customer "${customerName}"...`);
      const matchingOrders = await shopifyService.searchUnfulfilledOrdersByCustomerName(customerName);
      console.log(`✅ Found ${matchingOrders.length} matching unfulfilled orders`);
      
      if (matchingOrders.length === 0) {
        console.log('⚠️ No matching unfulfilled orders found. Skipping this order.');
        continue;
      }
      
      // Display matching orders
      matchingOrders.forEach((order, index) => {
        console.log(`\nMatching Order ${index+1}:`);
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Order Name: ${order.name}`);
        console.log(`   Customer: ${order.customerName}`);
      });
      
      // Step 8: Test fulfillment (disabled by default)
      const ENABLE_FULFILLMENT_TEST = false; // Set to true to test actual fulfillment
      
      if (ENABLE_FULFILLMENT_TEST) {
        const selectedOrder = matchingOrders[0]; // Select first matching order
        console.log(`\n5. Testing fulfillment for order ${selectedOrder.name}...`);
        
        // Don't notify customer during test
        const notifyCustomer = false;
        
        // Attempt fulfillment
        const fulfillmentResult = await shopifyService.fulfillOrder(
          selectedOrder.id, 
          trackingInfo, 
          notifyCustomer
        );
        
        if (fulfillmentResult.success) {
          console.log('✅ Order fulfilled successfully');
          console.log(`   Fulfillment ID: ${fulfillmentResult.fulfillmentId}`);
          console.log(`   Tracking Number: ${fulfillmentResult.trackingNumber}`);
        } else {
          console.log(`⚠️ Fulfillment failed: ${fulfillmentResult.message}`);
        }
      } else {
        console.log('\n5. Skipping fulfillment test (disabled)');
      }
      
      // Step 9: Mark tracking email as read (disabled by default)
      const MARK_AS_READ = false; // Set to true to mark emails as read
      
      if (MARK_AS_READ) {
        console.log('\n6. Marking tracking email as read...');
        await gmailService.markAsRead(trackingEmail.id);
        console.log('✅ Email marked as read');
      } else {
        console.log('\n6. Skipping marking email as read (disabled)');
      }
      
      console.log('\n--- End of processing for this email ---');
    }
    
    console.log('\nEnd-to-end workflow test completed successfully!');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the end-to-end test
runEndToEndTest().catch(error => {
  console.error('Test execution failed:', error);
});
