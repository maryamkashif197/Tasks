// src/pages/CreateTask.jsx

import React, { useState } from 'react';
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert
} from 'react-bootstrap';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function CreateTask() {
  const navigate = useNavigate();

  // TODO: Replace with real logged-in user ID
  const userId = '8d1e3c66-aa93-4179-8d2f-3a83467a2229';

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [files, setFiles]             = useState([]);
  const [error, setError]             = useState(null);
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('dueDate', dueDate);
      formData.append('userId', userId);
      files.forEach(f => formData.append('attachments', f));

      const resp = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (resp.status === 201) {
        navigate('/tasks');
      } else {
        throw new Error(resp.data?.error || 'Unexpected response');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="my-5">
      <Card className="mx-auto shadow-sm" style={{ maxWidth: '600px' }}>
        <Card.Header as="h3" className="bg-primary text-white">
          Create New Task
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} className="mb-3" controlId="taskTitle">
              <Form.Label column sm={3}>Title</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </Col>
            </Form.Group>

            <Form.Group className="mb-3" controlId="taskDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter a description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="taskDueDate">
              <Form.Label column sm={3}>Due Date</Form.Label>
              <Col sm={9}>
                <Form.Control
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </Col>
            </Form.Group>

            <Form.Group className="mb-4" controlId="taskAttachments">
              <Form.Label>Attachments</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={e => setFiles(Array.from(e.target.files))}
              />
              {files.length > 0 && (
                <ul className="mt-2">
                  {files.map((f, idx) => (
                    <li key={idx}>{f.name}</li>
                  ))}
                </ul>
              )}
            </Form.Group>

            <div className="text-end">
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Creating…' : 'Create Task'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
