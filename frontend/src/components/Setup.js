import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/ApiService';

const Setup = ({ onAuthenticated }) => {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState(null);
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [step, setStep] = useState('initial'); // initial, auth, code
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setCheckingAuth(true);
      setError(null);
      const result = await ApiService.checkGmailAuth();

      if (result.authenticated) {
        onAuthenticated();
        navigate('/');
      } else {
        setStep('auth');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Error checking authentication status. Please try again.');
      setStep('auth');
    } finally {
      setCheckingAuth(false);
    }
  };

  const getAuthUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getGmailAuthUrl();

      if (response.success && response.authUrl) {
        setAuthUrl(response.authUrl);
        setStep('code');
      } else {
        setError(response.error || 'Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Get auth URL error:', error);
      setError('An error occurred while getting authentication URL. Please check if the backend server is running and credentials.json is properly configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();

    if (!authCode.trim()) {
      setError('Please enter the authorization code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.saveGmailToken(authCode);

      if (response.success) {
        onAuthenticated();
        navigate('/');
      } else {
        setError(response.error || 'Failed to authenticate with Gmail');
      }
    } catch (error) {
      console.error('Save token error:', error);
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    checkAuth();
  };

  if (checkingAuth) {
    return (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Checking authentication status...</p>
        </div>
    );
  }

  return (
      <Card>
        <Card.Header>
          <h2>Setup</h2>
        </Card.Header>
        <Card.Body>
          {error && (
              <Alert variant="danger">
                {error}
                {step === 'auth' && (
                    <div className="mt-2">
                      <Button variant="outline-danger" size="sm" onClick={handleRetry}>
                        Retry
                      </Button>
                    </div>
                )}
              </Alert>
          )}

          {step === 'auth' && (
              <div>
                <p>Welcome to the Order Fulfillment Application!</p>
                <p>This application requires access to your Gmail account to search for tracking and confirmation emails.</p>
                <p>Before proceeding, make sure:</p>
                <ul>
                  <li>The backend server is running properly</li>
                  <li>You've created a <code>credentials.json</code> file in the backend directory with your Gmail API credentials</li>
                  <li>Your Gmail API project has the Gmail API enabled</li>
                </ul>
                <p>Click the button below to start the authentication process:</p>

                <div className="text-center mt-4">
                  <Button
                      variant="primary"
                      onClick={getAuthUrl}
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
                          Getting Auth URL...
                        </>
                    ) : (
                        'Authenticate with Gmail'
                    )}
                  </Button>
                </div>
              </div>
          )}

          {step === 'code' && (
              <div>
                <p>Please follow these steps to complete authentication:</p>
                <ol>
                  <li>Click the link below to open the Google authentication page</li>
                  <li>Sign in with your Gmail account and grant the required permissions</li>
                  <li>Copy the authorization code provided by Google</li>
                  <li>Paste the code in the field below and submit</li>
                </ol>

                <div className="text-center my-4">
                  <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary"
                  >
                    Open Google Authentication Page
                  </a>
                </div>

                <Form onSubmit={handleSubmitCode}>
                  <Form.Group className="mb-3">
                    <Form.Label>Authorization Code</Form.Label>
                    <Form.Control
                        type="text"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="Paste the authorization code here"
                        required
                    />
                    <Form.Text className="text-muted">
                      The code will be provided by Google after you grant permission.
                    </Form.Text>
                  </Form.Group>

                  <div className="text-center">
                    <Button
                        variant="primary"
                        type="submit"
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
                            Authenticating...
                          </>
                      ) : (
                          'Submit Authorization Code'
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
          )}
        </Card.Body>
      </Card>
  );
};

export default Setup;
