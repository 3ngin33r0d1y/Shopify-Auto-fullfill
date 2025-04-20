# Detailed Component Architecture for Order Fulfillment Application

## Overview
This document outlines the detailed component architecture for the React frontend of the order fulfillment application with the reversed workflow. The application follows a step-by-step process starting with tracking emails and ending with order fulfillment in Shopify.

## Component Structure

### 1. Navigation Component
- **Purpose**: Provides navigation between different steps of the workflow
- **Features**:
  - Displays the current step in the workflow
  - Allows resetting the workflow
  - Shows different navigation options based on authentication status

### 2. TrackingEmails Component
- **Purpose**: Displays unread tracking emails from Gmail
- **Features**:
  - Fetches and displays tracking emails with extracted order numbers and tracking information
  - Allows selection of emails for processing
  - Shows loading state during API calls
  - Handles error states
  - Provides pagination for large numbers of emails

### 3. ConfirmationEmails Component
- **Purpose**: Finds and displays confirmation emails for the selected tracking email
- **Features**:
  - Uses the order number from the tracking email to find confirmation emails
  - Displays confirmation emails with extracted customer information
  - Allows selection of the correct confirmation email if multiple are found
  - Shows loading and error states

### 4. ShopifyOrders Component
- **Purpose**: Searches for unfulfilled Shopify orders matching the customer name
- **Features**:
  - Uses customer name from confirmation email to search Shopify
  - Displays matching unfulfilled orders
  - Shows order details including line items and shipping information
  - Allows selection of the correct order to fulfill
  - Handles cases with multiple or no matching orders

### 5. FulfillmentReview Component
- **Purpose**: Reviews order and tracking information before fulfillment
- **Features**:
  - Displays selected Shopify order details
  - Shows tracking information extracted from the tracking email
  - Allows toggling customer notification
  - Provides fulfillment confirmation button
  - Shows loading state during fulfillment process

### 6. FulfillmentResults Component
- **Purpose**: Displays results of the fulfillment process
- **Features**:
  - Shows success or failure status
  - Displays fulfillment details including tracking number and carrier
  - Provides option to start a new workflow
  - Shows any error messages if fulfillment failed

### 7. Setup Component
- **Purpose**: Handles Gmail and Shopify authentication
- **Features**:
  - Provides Gmail authentication flow
  - Checks and displays authentication status
  - Guides user through the setup process
  - Shows clear error messages for authentication issues

## Data Flow

1. **User Authentication**:
   - User authenticates with Gmail through the Setup component
   - Authentication status is stored in App.js state

2. **Tracking Email Selection**:
   - TrackingEmails component fetches unread tracking emails
   - User selects a tracking email
   - Selected email data is stored in App.js state

3. **Confirmation Email Processing**:
   - ConfirmationEmails component uses the order number to find confirmation emails
   - Confirmation emails are displayed with extracted customer information
   - User selects the correct confirmation email
   - Selected confirmation email data is stored in App.js state

4. **Shopify Order Matching**:
   - ShopifyOrders component uses customer name to search for unfulfilled orders
   - Matching orders are displayed with details
   - User selects the correct order to fulfill
   - Selected order data is stored in App.js state

5. **Order Fulfillment**:
   - FulfillmentReview component displays order and tracking information
   - User confirms fulfillment
   - Fulfillment request is sent to the backend
   - Results are displayed in FulfillmentResults component

## State Management

The application uses React's built-in state management through:
- Component-level state for UI interactions
- App-level state for workflow data
- React Router for navigation state

Key state variables in App.js:
- `isAuthenticated`: Tracks authentication status
- `selectedTrackingEmail`: Stores the selected tracking email
- `confirmationEmail`: Stores the selected confirmation email
- `matchingOrders`: Stores Shopify orders matching the customer name
- `selectedOrder`: Stores the selected order for fulfillment
- `fulfillmentResults`: Stores the results of the fulfillment process

## API Integration

The ApiService handles all communication with the backend:
- Authentication methods
- Email retrieval methods
- Order search methods
- Fulfillment methods

Each component uses the appropriate ApiService methods to fetch and send data.

## Error Handling

The application implements comprehensive error handling:
- API call errors are caught and displayed to the user
- Loading states are shown during API calls
- Empty states are handled gracefully
- Authentication errors redirect to the Setup component

## Responsive Design

The application uses React Bootstrap for responsive design:
- Mobile-friendly layout
- Responsive tables for email and order data
- Accessible UI components
- Consistent styling across all components
