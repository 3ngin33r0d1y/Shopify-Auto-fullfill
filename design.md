# Order Fulfillment Application Design

## Overview

This document outlines the design for a new order fulfillment application that follows a reversed workflow as requested. The application will use React.js for the frontend and Node.js/Express for the backend.

## Workflow

The application follows this reversed workflow:

1. **Start with unread tracking emails**
   - Retrieve all unread emails with tracking information from Gmail
   - Focus on emails with subject "Your Countryside Pet Supply Order Has Been Updated"

2. **Extract order numbers from tracking emails**
   - Parse the tracking emails to extract order numbers (e.g., #182733)
   - Extract tracking numbers from these emails

3. **Find confirmation emails for those order numbers**
   - Search Gmail for confirmation emails matching the extracted order numbers
   - Focus on emails with subject "Your Countryside Pet Supply Order Confirmation"

4. **Extract customer names from confirmation emails**
   - Parse the confirmation emails to extract customer names from the billing address
   - This solves the problem of missing customer names in Shopify orders

5. **Match with unfulfilled Shopify orders**
   - Search Shopify for unfulfilled orders matching the extracted customer names
   - Present these matches to the user for review

6. **User selection for fulfillment**
   - Allow the user to select which orders to fulfill
   - Update selected orders in Shopify with the tracking information

## Architecture

### Frontend (React.js)

- **Components**
  - `App`: Main application component
  - `EmailList`: Displays tracking emails
  - `OrderDetails`: Shows extracted order information
  - `CustomerInfo`: Displays customer information from confirmation emails
  - `ShopifyMatches`: Shows matching unfulfilled Shopify orders
  - `FulfillmentForm`: Interface for selecting orders to fulfill

- **State Management**
  - Use React Context or Redux for state management
  - Track the current step in the workflow
  - Store email data, extracted information, and matches

### Backend (Node.js/Express)

- **API Endpoints**
  - `/api/emails/tracking`: Get unread tracking emails
  - `/api/emails/confirmation`: Find confirmation emails by order number
  - `/api/shopify/orders`: Get unfulfilled orders
  - `/api/shopify/fulfill`: Fulfill orders with tracking information

- **Services**
  - `GmailService`: Handles Gmail API integration
  - `ShopifyService`: Handles Shopify API integration
  - `ParserService`: Extracts information from emails

### Data Flow

1. Backend retrieves unread tracking emails from Gmail
2. Frontend displays these emails to the user
3. User selects emails to process
4. Backend extracts order numbers and tracking information
5. Backend finds confirmation emails for these order numbers
6. Backend extracts customer names from confirmation emails
7. Backend searches Shopify for matching unfulfilled orders
8. Frontend displays matches to the user
9. User selects which orders to fulfill
10. Backend updates selected orders in Shopify with tracking information

## Technical Considerations

- **Authentication**
  - OAuth 2.0 for Gmail API
  - API key and password for Shopify API

- **Error Handling**
  - Graceful handling of missing information
  - Clear error messages for API failures
  - Retry mechanisms for transient errors

- **Performance**
  - Pagination for large numbers of emails or orders
  - Caching of API responses where appropriate
  - Asynchronous processing for long-running operations

## Implementation Plan

1. Set up project structure for both frontend and backend
2. Implement Gmail API integration for retrieving emails
3. Create email parsing functionality
4. Implement Shopify API integration
5. Develop the React frontend components
6. Connect frontend to backend API
7. Add user authentication and error handling
8. Test the complete workflow
9. Deploy the application

This design addresses the user's request for a reversed workflow that starts with tracking emails and works backward to find and fulfill Shopify orders, using React.js for the frontend and a suitable backend.
