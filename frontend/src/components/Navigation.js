import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ isAuthenticated, onReset }) => {
  const location = useLocation();
  
  // Define the workflow steps
  const steps = [
    { path: '/', label: '1. Tracking Emails' },
    { path: '/confirmation', label: '2. Confirmation Emails' },
    { path: '/orders', label: '3. Shopify Orders' },
    { path: '/review', label: '4. Review & Fulfill' },
    { path: '/results', label: '5. Results' }
  ];
  
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={onReset}>
          Order Fulfillment App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                {steps.map((step, index) => (
                  <Nav.Link
                    key={step.path}
                    as={Link}
                    to={step.path}
                    active={location.pathname === step.path}
                    disabled={!isAuthenticated}
                    className={`${location.pathname === step.path ? 'active' : ''}`}
                  >
                    {step.label}
                  </Nav.Link>
                ))}
              </>
            )}
            {!isAuthenticated && (
              <Nav.Link as={Link} to="/setup" active={location.pathname === '/setup'}>
                Setup
              </Nav.Link>
            )}
          </Nav>
          {isAuthenticated && (
            <Nav>
              <Nav.Link onClick={onReset}>Reset Workflow</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
