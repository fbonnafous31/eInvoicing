// src/components/EmailModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const EmailModal = ({ show, onClose, onSend, defaultValues }) => {
  const [to, setTo] = useState(defaultValues.to || '');
  const [subject, setSubject] = useState(defaultValues.subject || '');
  const [message, setMessage] = useState(defaultValues.message || '');

  const handleSubmit = () => {
    onSend({ to, subject, message });
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>✉️ Envoyer la facture par email</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Destinataire</Form.Label>
            <Form.Control
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="exemple@client.fr"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sujet</Form.Label>
            <Form.Control
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Envoyer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmailModal;
