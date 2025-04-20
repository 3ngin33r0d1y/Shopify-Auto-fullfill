import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const TrackingEmails = ({ onSelectEmail }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrackingEmails();
  }, []);

  const fetchTrackingEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getTrackingEmails();
      
      if (response.success) {
        setEmails(response.emails || []);
      } else {
        setError(response.error || 'Failed to retrieve tracking emails');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while retrieving tracking emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = (email) => {
    onSelectEmail(email);
    navigate('/confirmation');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Pagination logic
  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = emails.slice(indexOfFirstEmail, indexOfLastEmail);
  const totalPages = Math.ceil(emails.length / emailsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading tracking emails...</p>
      </div>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h2>Tracking Emails</h2>
        <Button variant="outline-primary" onClick={fetchTrackingEmails}>
          Refresh
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {emails.length === 0 ? (
          <Alert variant="info">
            No unread tracking emails found. Please check your Gmail inbox or refresh.
          </Alert>
        ) : (
          <>
            <p>Select a tracking email to process:</p>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Order #</th>
                  <th>Tracking #</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEmails.map((email) => (
                  <tr key={email.id}>
                    <td>{formatDate(email.date)}</td>
                    <td>{email.subject}</td>
                    <td>
                      {email.orderNumber ? (
                        <Badge bg="success">#{email.orderNumber}</Badge>
                      ) : (
                        <Badge bg="warning">Not found</Badge>
                      )}
                    </td>
                    <td>
                      {email.trackingInfo && email.trackingInfo.trackingNumber ? (
                        <Badge bg="success">
                          {email.trackingInfo.trackingNumber}
                          {email.trackingInfo.carrier && ` (${email.trackingInfo.carrier})`}
                        </Badge>
                      ) : (
                        <Badge bg="warning">Not found</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectEmail(email)}
                        disabled={!email.orderNumber || !email.trackingInfo || !email.trackingInfo.trackingNumber}
                      >
                        Process
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {totalPages > 1 && (
              <Pagination className="justify-content-center">
                <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                
                {[...Array(totalPages).keys()].map(number => (
                  <Pagination.Item
                    key={number + 1}
                    active={number + 1 === currentPage}
                    onClick={() => paginate(number + 1)}
                  >
                    {number + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default TrackingEmails;
