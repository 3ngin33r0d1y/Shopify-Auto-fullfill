import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const ConfirmationEmails = ({ trackingEmail, onSelectEmail }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trackingEmail || !trackingEmail.orderNumber) {
      setError('No order number found in tracking email');
      setLoading(false);
      return;
    }
    
    fetchConfirmationEmails(trackingEmail.orderNumber);
  }, [trackingEmail]);

  const fetchConfirmationEmails = async (orderNumber) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getConfirmationEmails(orderNumber);
      
      if (response.success) {
        setEmails(response.emails || []);
      } else {
        setError(response.error || 'Failed to retrieve confirmation emails');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while retrieving confirmation emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = (email) => {
    onSelectEmail(email);
    navigate('/orders');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Searching for confirmation emails...</p>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h2>Confirmation Emails</h2>
        <p className="text-muted mb-0">
          Order Number: <Badge bg="info">#{trackingEmail?.orderNumber}</Badge>
        </p>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {emails.length === 0 ? (
          <Alert variant="warning">
            No confirmation emails found for order #{trackingEmail?.orderNumber}.
            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Back to Tracking Emails
              </Button>
            </div>
          </Alert>
        ) : (
          <>
            <p>Select a confirmation email to extract customer information:</p>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Customer Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td>{formatDate(email.date)}</td>
                    <td>{email.subject}</td>
                    <td>
                      {email.customerName ? (
                        <Badge bg="success">{email.customerName}</Badge>
                      ) : (
                        <Badge bg="warning">Not found</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectEmail(email)}
                        disabled={!email.customerName}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/')}>
                Back to Tracking Emails
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ConfirmationEmails;
