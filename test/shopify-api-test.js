/**
 * Test script for Shopify API integration
 * 
 * This script tests the Shopify service functionality:
 * - Authentication
 * - Retrieving unfulfilled orders
 * - Searching for orders by customer name
 * - Fulfilling orders with tracking information
 */

const shopifyService = require('../backend/src/services/shopifyService');
const logger = require('../backend/src/utils/logger');

// Test configuration
const TEST_CUSTOMER_NAME = 'Joseph Lee'; // Replace with a real customer name for testing
const TEST_ORDER_ID = ''; // Will be populated during testing if orders are found

async function runTests() {
  console.log('=== Shopify API Integration Tests ===');
  
  try {
    // Test 1: Initialize Shopify service
    console.log('\n1. Testing Shopify service initialization...');
    await shopifyService.initialize();
    console.log('✅ Shopify service initialized successfully');
    
    // Test 2: Get unfulfilled orders
    console.log('\n2. Testing retrieval of unfulfilled orders...');
    const unfulfilledOrders = await shopifyService.getUnfulfilledOrders(5);
    console.log(`✅ Retrieved ${unfulfilledOrders.length} unfulfilled orders`);
    
    if (unfulfilledOrders.length > 0) {
      // Store the first order ID for later tests
      TEST_ORDER_ID = unfulfilledOrders[0].id;
      
      // Display order details
      console.log('\nSample order details:');
      console.log(`   Order ID: ${unfulfilledOrders[0].id}`);
      console.log(`   Order Name: ${unfulfilledOrders[0].name}`);
      console.log(`   Customer: ${unfulfilledOrders[0].customerName}`);
    }
    
    // Test 3: Search for orders by customer name
    console.log(`\n3. Testing search for orders by customer name: "${TEST_CUSTOMER_NAME}"...`);
    const matchingOrders = await shopifyService.searchUnfulfilledOrdersByCustomerName(TEST_CUSTOMER_NAME);
    console.log(`✅ Found ${matchingOrders.length} orders matching customer name`);
    
    if (matchingOrders.length > 0) {
      // Update TEST_ORDER_ID if we found a matching order
      TEST_ORDER_ID = matchingOrders[0].id;
      
      // Display order details
      console.log('\nMatching order details:');
      console.log(`   Order ID: ${matchingOrders[0].id}`);
      console.log(`   Order Name: ${matchingOrders[0].name}`);
      console.log(`   Customer: ${matchingOrders[0].customerName}`);
    }
    
    // Test 4: Test fulfillment (only if explicitly enabled)
    const ENABLE_FULFILLMENT_TEST = false; // Set to true to test actual fulfillment
    
    if (ENABLE_FULFILLMENT_TEST && TEST_ORDER_ID) {
      console.log(`\n4. Testing order fulfillment for order ID: ${TEST_ORDER_ID}...`);
      
      // Create test tracking info
      const trackingInfo = {
        trackingNumber: 'TEST123456789',
        carrier: 'USPS'
      };
      
      // Don't notify customer during test
      const notifyCustomer = false;
      
      // Attempt fulfillment
      const fulfillmentResult = await shopifyService.fulfillOrder(
        TEST_ORDER_ID, 
        trackingInfo, 
        notifyCustomer
      );
      
      if (fulfillmentResult.success) {
        console.log('✅ Order fulfilled successfully');
        console.log(`   Fulfillment ID: ${fulfillmentResult.fulfillmentId}`);
        console.log(`   Tracking Number: ${fulfillmentResult.trackingNumber}`);
        console.log(`   Carrier: ${fulfillmentResult.carrier}`);
      } else {
        console.log(`⚠️ Fulfillment test skipped or failed: ${fulfillmentResult.message}`);
      }
    } else {
      console.log('\n4. Skipping fulfillment test (disabled or no order ID available)');
    }
    
    console.log('\nAll Shopify API tests completed successfully!');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});
