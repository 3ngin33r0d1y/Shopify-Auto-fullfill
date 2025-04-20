#!/bin/bash

# Start both frontend and backend servers
# Usage: ./start.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Order Fulfillment Application...${NC}"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js to run this application."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm to run this application."
    exit 1
fi

# Create logs directory for backend if it doesn't exist
mkdir -p ./backend/logs

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd backend
npm install &> /dev/null
NODE_ENV=development node src/index.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend server to start..."
sleep 3

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd frontend
npm install &> /dev/null
npm start &
FRONTEND_PID=$!
cd ..

# Function to handle script termination
cleanup() {
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Register the cleanup function for when script receives SIGINT (Ctrl+C)
trap cleanup SIGINT

echo -e "${GREEN}Both servers are running!${NC}"
echo "Backend server running on http://localhost:5001"
echo "Frontend server running on http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

# Keep script running
wait
