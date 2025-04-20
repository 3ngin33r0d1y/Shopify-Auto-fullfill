import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const ShopifyOrders = ({ confirmationEmail, trackingEmail, onOrdersFound, onSelectOrder }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!confirmationEmail || !confirmationEmail.customerName) {
      setError('No customer name found in confirmation email');
      setLoading(false);
      return;
    }
    
    searchOrders(confirmationEmail.customerName);
  }, [confirmationEmail]);

  const searchOrders = async (customerName) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.searchOrdersByCustomerName(customerName);
      
      if (response.success) {
        const matchingOrders = response.orders || [];
        setOrders(matchingOrders);
        onOrdersFound(matchingOrders);
      } else {
        setError(response.error || 'Failed to search for orders');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while searching for orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    // Combine order with tracking info from tracking email
    const enrichedOrder = {
      ...order,
      trackingInfo: trackingEmail?.trackingInfo
    };
    
    onSelectOrder(enrichedOrder);
    navigate('/review');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Searching for unfulfilled Shopify orders...</p>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h2>Unfulfilled Shopify Orders</h2>
        <p className="text-muted mb-0">
          Customer: <Badge bg="info">{confirmationEmail?.customerName}</Badge>
        </p>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {orders.length === 0 ? (
          <Alert variant="warning">
            No unfulfilled orders found for customer "{confirmationEmail?.customerName}".
            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/confirmation')}>
                Back to Confirmation Emails
              </Button>
            </div>
          </Alert>
        ) : (
          <>
            <p>Select an order to fulfill with tracking number: <Badge bg="success">{trackingEmail?.trackingInfo?.trackingNumber}</Badge></p>
            
            {orders.map((order) => (
              <Card key={order.id} className="mb-4 order-card">
                <Card.Header>
                  <Row>
                    <Col>
                      <h5>{order.name}</h5>
                      <p className="text-muted mb-0">Created: {formatDate(order.createdAt)}</p>
                    </Col>
                    <Col className="text-end">
                      <h5>{formatCurrency(order.totalPrice)}</h5>
                      <p className="text-muted mb-0">Customer: {order.customerName}</p>
                    </Col>
                  </Row>
                </Card.Header>
                <Card.Body>
                  <h6>Line Items:</h6>
                  <Table responsive striped size="sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.lineItems && order.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.title || item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {order.shippingAddress && (
                    <div className="mt-3">
                      <h6>Shipping Address:</h6>
                      <p className="mb-0">{order.shippingAddress.name}</p>
                      <p className="mb-0">{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && <p className="mb-0">{order.shippingAddress.address2}</p>}
                      <p className="mb-0">
                        {order.shippingAddress.city}, {order.shippingAddress.province_code} {order.shippingAddress.zip}
                      </p>
                      <p className="mb-0">{order.shippingAddress.country}</p>
                    </div>
                  )}
                  
                  <div className="text-center mt-4">
                    <Button 
                      variant="primary" 
                      onClick={() => handleSelectOrder(order)}
                    >
                      Select for Fulfillment
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
            
            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/confirmation')}>
                Back to Confirmation Emails
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ShopifyOrders;
