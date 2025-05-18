// src/pages/Tasks.jsx

import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Tasks() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const resp = await api.get('/tasks');
        setTasks(resp.data);
      } catch (err) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Your Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks found. <Link to="/create-task">Create one now</Link></p>
      ) : (
        <div className="row">
          {tasks.map(task => (
            <div key={task.taskId} className="col-md-4 mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{task.title}</Card.Title>
                  {task.description && <Card.Text>{task.description}</Card.Text>}
                  <Card.Text>
                    <small>Status: {task.status}</small>
                  </Card.Text>
                  <Button as={Link} to={`/tasks/${task.taskId}`} variant="primary">
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
