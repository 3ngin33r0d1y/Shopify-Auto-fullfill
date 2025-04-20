import React from 'react';
import { Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const FulfillmentResults = ({ results, onReset }) => {
  const navigate = useNavigate();

  const handleReset = () => {
    onReset();
    navigate('/');
  };

  return (
    <Card>
      <Card.Header>
        <h2>Fulfillment Results</h2>
      </Card.Header>
      <Card.Body>
        {results.success ? (
          <>
            <Alert variant="success">
              <Alert.Heading>Order Fulfilled Successfully!</Alert.Heading>
              <p>
                Order {results.orderName} for {results.customerName} has been fulfilled with tracking information.
              </p>
            </Alert>
            
            <Row className="mt-4">
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5>Fulfillment Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <p>
                      <strong>Fulfillment ID:</strong>{' '}
                      {results.fulfillmentId}
                    </p>
                    <p>
                      <strong>Tracking Number:</strong>{' '}
                      <Badge bg="success">{results.trackingNumber}</Badge>
                    </p>
                    <p>
                      <strong>Carrier:</strong>{' '}
                      {results.carrier || 'Not specified'}
                    </p>
                    <p>
                      <strong>Customer Notified:</strong>{' '}
                      {results.notifiedCustomer ? 'Yes' : 'No'}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5>Next Steps</h5>
                  </Card.Header>
                  <Card.Body>
                    <p>The order has been marked as fulfilled in Shopify.</p>
                    <p>
                      {results.notifiedCustomer
                        ? 'The customer has been notified with the tracking information.'
                        : 'The customer has not been notified about this fulfillment.'}
                    </p>
                    <p>You can now process another order or check your Shopify dashboard for more details.</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Alert variant="danger">
            <Alert.Heading>Fulfillment Failed</Alert.Heading>
            <p>
              There was an error fulfilling the order: {results.message}
            </p>
          </Alert>
        )}
        
        <div className="text-center mt-4">
          <Button variant="primary" onClick={handleReset}>
            Process Another Order
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FulfillmentResults;
