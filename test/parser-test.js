/**
 * Test script for email parsing functionality
 * 
 * This script tests the parser service functionality:
 * - Extracting order numbers from tracking emails
 * - Extracting tracking numbers from tracking emails
 * - Extracting customer names from confirmation emails
 */

const parserService = require('../backend/src/services/parserService');
const fs = require('fs');
const path = require('path');

// Sample email content for testing
const sampleEmails = {
  tracking: {
    subject: 'Your Countryside Pet Supply Order Has Been Updated (#12345)',
    body: `
      <html>
        <body>
          <h1>Your Order Has Been Shipped</h1>
          <p>Good news! Your order #12345 has been shipped.</p>
          <p>You can track your package with the following information:</p>
          <p>USPS Tracking Number: 9400123456789012345678</p>
          <p>Thank you for shopping with us!</p>
        </body>
      </html>
    `
  },
  confirmation: {
    subject: 'Your Countryside Pet Supply Order Confirmation (#12345)',
    body: `
      <html>
        <body>
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
          <p>Order #12345</p>
          <div>
            <h2>Billing Address</h2>
            <p>John Smith</p>
            <p>123 Main St</p>
            <p>Anytown, CA 12345</p>
          </div>
          <div>
            <h2>Shipping Address</h2>
            <p>John Smith</p>
            <p>123 Main St</p>
            <p>Anytown, CA 12345</p>
          </div>
        </body>
      </html>
    `
  }
};

function runTests() {
  console.log('=== Email Parsing Tests ===');
  
  try {
    // Test 1: Extract order number from tracking email
    console.log('\n1. Testing order number extraction from tracking email...');
    const orderNumber = parserService.extractOrderNumberFromTrackingEmail(sampleEmails.tracking);
    
    if (orderNumber === '12345') {
      console.log(`✅ Order number extracted correctly: ${orderNumber}`);
    } else {
      console.log(`❌ Order number extraction failed. Expected: 12345, Got: ${orderNumber}`);
    }
    
    // Test 2: Extract tracking number from tracking email
    console.log('\n2. Testing tracking number extraction from tracking email...');
    const trackingInfo = parserService.extractTrackingNumberFromEmail(sampleEmails.tracking);
    
    if (trackingInfo && trackingInfo.trackingNumber === '9400123456789012345678') {
      console.log(`✅ Tracking number extracted correctly: ${trackingInfo.trackingNumber}`);
      if (trackingInfo.carrier === 'USPS') {
        console.log(`✅ Carrier extracted correctly: ${trackingInfo.carrier}`);
      } else {
        console.log(`⚠️ Carrier extraction unexpected. Expected: USPS, Got: ${trackingInfo.carrier}`);
      }
    } else {
      console.log(`❌ Tracking number extraction failed. Expected: 9400123456789012345678, Got: ${trackingInfo?.trackingNumber}`);
    }
    
    // Test 3: Extract customer name from confirmation email
    console.log('\n3. Testing customer name extraction from confirmation email...');
    const customerName = parserService.extractCustomerNameFromConfirmationEmail(sampleEmails.confirmation);
    
    if (customerName === 'John Smith') {
      console.log(`✅ Customer name extracted correctly: ${customerName}`);
    } else {
      console.log(`❌ Customer name extraction failed. Expected: John Smith, Got: ${customerName}`);
    }
    
    // Test 4: Handle missing or invalid data
    console.log('\n4. Testing handling of missing or invalid data...');
    
    const emptyResult1 = parserService.extractOrderNumberFromTrackingEmail({});
    if (emptyResult1 === null) {
      console.log('✅ Correctly handled empty email for order number extraction');
    } else {
      console.log(`❌ Failed to handle empty email for order number extraction. Got: ${emptyResult1}`);
    }
    
    const emptyResult2 = parserService.extractTrackingNumberFromEmail({});
    if (emptyResult2 === null) {
      console.log('✅ Correctly handled empty email for tracking number extraction');
    } else {
      console.log(`❌ Failed to handle empty email for tracking number extraction. Got: ${emptyResult2}`);
    }
    
    const emptyResult3 = parserService.extractCustomerNameFromConfirmationEmail({});
    if (emptyResult3 === null) {
      console.log('✅ Correctly handled empty email for customer name extraction');
    } else {
      console.log(`❌ Failed to handle empty email for customer name extraction. Got: ${emptyResult3}`);
    }
    
    console.log('\nAll email parsing tests completed!');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests();
