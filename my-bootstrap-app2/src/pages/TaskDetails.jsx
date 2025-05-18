// src/pages/TaskDetail.jsx

import React, { useEffect, useState } from 'react';
import {
  Container,
  Spinner,
  Alert,
  Button,
  Form,
  Row,
  Col,
  ListGroup
} from 'react-bootstrap';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function TaskDetail() {
  const { id }           = useParams();
  const navigate         = useNavigate();

  const [task, setTask]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    async function loadTask() {
      try {
        const resp = await api.get(`/tasks/${id}`);
        setTask(resp.data);
      } catch (err) {
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();

      // 1) pack all updatable fields (including existing attachments)
      const payload = {
        title:       task.title,
        description: task.description || '',
        status:      task.status || 'Pending',
        attachments: task.attachments || []
      };
      formData.append('data', JSON.stringify(payload));

      // 2) append any new files
      selectedFiles.forEach(f => formData.append('attachments', f));

      // 3) send multipart/form-data
      await api.put(`/tasks/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/tasks');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${id}`);
      navigate('/tasks');
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Container className="mt-4"><Spinner animation="border" /></Container>;
  if (error)   return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!task)   return <Container className="mt-4"><Alert variant="warning">Task not found</Alert></Container>;

  return (
    <Container className="mt-4">
      <h2>Task Details</h2>
      <Form>
        {/* Title */}
        <Form.Group as={Row} className="mb-3" controlId="taskTitle">
          <Form.Label column sm={2}>Title</Form.Label>
          <Col sm={10}>
            <Form.Control
              type="text"
              value={task.title}
              onChange={e => setTask({ ...task, title: e.target.value })}
            />
          </Col>
        </Form.Group>

        {/* Description */}
        <Form.Group className="mb-3" controlId="taskDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={task.description || ''}
            onChange={e => setTask({ ...task, description: e.target.value })}
          />
        </Form.Group>

        {/* Status */}
        <Form.Group as={Row} className="mb-3" controlId="taskStatus">
          <Form.Label column sm={2}>Status</Form.Label>
          <Col sm={10}>
            <Form.Select
              value={task.status || 'Pending'}
              onChange={e => setTask({ ...task, status: e.target.value })}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </Form.Select>
          </Col>
        </Form.Group>

        {/* Read-only fields */}
        <ListGroup className="mb-3">
          <ListGroup.Item><strong>User ID:</strong> {task.user_id}</ListGroup.Item>
          <ListGroup.Item>
            <strong>Created:</strong> {new Date(task.created_at).toLocaleString()}
          </ListGroup.Item>
          <ListGroup.Item>
            <strong>Last Updated:</strong> {new Date(task.updated_at).toLocaleString()}
          </ListGroup.Item>
        </ListGroup>

        {/* Existing Attachments */}
        <h5>Attachments</h5>
        {task.attachments && task.attachments.length > 0 ? (
          <ListGroup className="mb-3">
            {task.attachments.map((url, i) => (
              <ListGroup.Item key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url.split('/').pop()}
                </a>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">No attachments yet.</p>
        )}

        {/* New Attachments */}
        <Form.Group controlId="taskFiles" className="mb-4">
          <Form.Label>Upload Attachments</Form.Label>
          <Form.Control
            type="file"
            multiple
            onChange={e => setSelectedFiles([...e.target.files])}
          />
        </Form.Group>

        {/* Action Buttons */}
        <Row>
          <Col>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Col>
          <Col className="text-end">
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete Task'}
            </Button>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}
