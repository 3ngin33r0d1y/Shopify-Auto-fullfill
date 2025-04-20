# Order Fulfillment Application

This application implements a reversed workflow for order fulfillment, starting with tracking emails and working backward to find and fulfill Shopify orders.

## Features

- Retrieves unread tracking emails from Gmail
- Extracts order numbers and tracking information
- Finds confirmation emails for those order numbers
- Extracts customer names from confirmation emails
- Matches with unfulfilled Shopify orders
- Allows selection of orders to fulfill
- Updates Shopify orders with tracking information

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Gmail account with API access
- Shopify store with API access

## Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/order-fulfillment-app.git
cd order-fulfillment-app
```

2. Install dependencies:
```
cd backend
npm install
cd ../frontend
npm install
```

3. Create configuration files:

Create `backend/credentials.json` with your Gmail API credentials:
```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost:5001/auth/callback"]
  }
}
```

Create `backend/shopify_config.json` with your Shopify API credentials:
```json
{
  "shop_url": "https://your-store.myshopify.com",
  "api_key": "YOUR_API_KEY",
  "password": "YOUR_API_PASSWORD"
}
```

## Running the Application

Use the provided start script to run both frontend and backend:

```
chmod +x start.sh
./start.sh
```

Or run them separately:

```
# Terminal 1 - Backend
cd backend
node src/index.js

# Terminal 2 - Frontend
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Usage

1. Open the application in your browser
2. Complete the Gmail authentication if prompted
3. Select a tracking email to process
4. Review the confirmation email and customer information
5. Select the matching Shopify order
6. Review and confirm the fulfillment
7. View the fulfillment results

## Project Structure

- `backend/`: Node.js/Express backend
  - `src/`: Source code
    - `services/`: Service modules for Gmail, Shopify, and parsing
    - `utils/`: Utility functions
    - `index.js`: Main server file
- `frontend/`: React frontend
  - `src/`: Source code
    - `components/`: React components
    - `services/`: API service for backend communication
    - `App.js`: Main application component
    - `index.js`: Entry point

## Development

To run the application in development mode with hot reloading:

```
# Terminal 1 - Backend
cd backend
npm install -g nodemon
nodemon src/index.js

# Terminal 2 - Frontend
cd frontend
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
