import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './components/Navigation';
import TrackingEmails from './components/TrackingEmails';
import ConfirmationEmails from './components/ConfirmationEmails';
import ShopifyOrders from './components/ShopifyOrders';
import FulfillmentReview from './components/FulfillmentReview';
import FulfillmentResults from './components/FulfillmentResults';
import Setup from './components/Setup';
import ApiService from './services/ApiService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackingEmail, setSelectedTrackingEmail] = useState(null);
  const [confirmationEmail, setConfirmationEmail] = useState(null);
  const [matchingOrders, setMatchingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillmentResults, setFulfillmentResults] = useState(null);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const result = await ApiService.checkGmailAuth();
        setIsAuthenticated(result.authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Reset state when navigating away
  const resetState = () => {
    setSelectedTrackingEmail(null);
    setConfirmationEmail(null);
    setMatchingOrders([]);
    setSelectedOrder(null);
    setFulfillmentResults(null);
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading application...</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="App">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        onReset={resetState} 
      />
      <Container className="mt-4 mb-5">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <TrackingEmails 
                  onSelectEmail={setSelectedTrackingEmail} 
                /> : 
                <Navigate to="/setup" replace />
            } 
          />
          <Route 
            path="/confirmation" 
            element={
              selectedTrackingEmail ? 
                <ConfirmationEmails 
                  trackingEmail={selectedTrackingEmail}
                  onSelectEmail={setConfirmationEmail}
                /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/orders" 
            element={
              confirmationEmail ? 
                <ShopifyOrders 
                  confirmationEmail={confirmationEmail}
                  trackingEmail={selectedTrackingEmail}
                  onOrdersFound={setMatchingOrders}
                  onSelectOrder={setSelectedOrder}
                /> : 
                <Navigate to="/confirmation" replace />
            } 
          />
          <Route 
            path="/review" 
            element={
              selectedOrder ? 
                <FulfillmentReview 
                  order={selectedOrder}
                  trackingEmail={selectedTrackingEmail}
                  onFulfillment={setFulfillmentResults}
                /> : 
                <Navigate to="/orders" replace />
            } 
          />
          <Route 
            path="/results" 
            element={
              fulfillmentResults ? 
                <FulfillmentResults 
                  results={fulfillmentResults}
                  onReset={resetState}
                /> : 
                <Navigate to="/review" replace />
            } 
          />
          <Route 
            path="/setup" 
            element={
              <Setup 
                onAuthenticated={() => setIsAuthenticated(true)} 
              />
            } 
          />
        </Routes>
      </Container>
      <footer className="bg-light py-3 text-center">
        <Container>
          <p className="text-muted mb-0">Order Fulfillment App &copy; {new Date().getFullYear()}</p>
        </Container>
      </footer>
    </div>
  );
}

export default App;
