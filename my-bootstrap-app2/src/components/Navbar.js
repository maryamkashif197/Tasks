import React from 'react';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <BSNavbar bg="light" expand="lg">
      <Container>
        <BSNavbar.Brand as={Link} to="/">TaskManager</BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="nav" />
        <BSNavbar.Collapse id="nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/tasks">Tasks</Nav.Link>
            <Nav.Link as={Link} to="/create-task">Create Task</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
            <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}