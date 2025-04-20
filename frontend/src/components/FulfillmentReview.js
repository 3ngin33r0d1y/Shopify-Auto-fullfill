import React, { useState } from 'react';
import { Card, Button, Spinner, Alert, Badge, Form, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const FulfillmentReview = ({ order, trackingEmail, onFulfillment }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const navigate = useNavigate();

  const handleFulfillOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.fulfillOrder(
        order.id, 
        trackingEmail.trackingInfo, 
        notifyCustomer
      );
      
      if (response.success) {
        onFulfillment({
          ...response.fulfillment,
          orderName: order.name,
          customerName: order.customerName,
          notifiedCustomer: notifyCustomer
        });
        navigate('/results');
      } else {
        setError(response.error || 'Failed to fulfill order');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fulfilling the order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <Card>
      <Card.Header>
        <h2>Review & Fulfill Order</h2>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Order Details</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>Order Number:</strong> {order.name}</p>
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Total:</strong> {formatCurrency(order.totalPrice)}</p>
                
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
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>
                <h5>Tracking Information</h5>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Tracking Number:</strong>{' '}
                  <Badge bg="success">{trackingEmail.trackingInfo.trackingNumber}</Badge>
                </p>
                <p>
                  <strong>Carrier:</strong>{' '}
                  {trackingEmail.trackingInfo.carrier || 'Not specified'}
                </p>
                <p>
                  <strong>From Email:</strong>{' '}
                  {trackingEmail.subject}
                </p>
                
                <Form.Group className="mt-4">
                  <Form.Check
                    type="checkbox"
                    id="notify-customer"
                    label="Notify customer about fulfillment"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    If checked, an email will be sent to the customer with the tracking information.
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-between mt-3">
          <Button variant="secondary" onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleFulfillOrder}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Fulfilling Order...
              </>
            ) : (
              'Fulfill Order'
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FulfillmentReview;
