import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { validateEmail } from '../../utils/validators/email';

const EmailModal = ({ show, onClose, onSend, defaultValues }) => {
  const [to, setTo] = useState(defaultValues.to || '');
  const [subject, setSubject] = useState(defaultValues.subject || '');
  const [message, setMessage] = useState(defaultValues.message || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setTo(defaultValues.to || '');
    setSubject(defaultValues.subject || '');
    setMessage(defaultValues.message || '');
    setError(validateEmail(defaultValues.to || ''));
  }, [defaultValues, show]);

  const handleSubmit = () => {
    const validationError = validateEmail(to);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSend({ to, subject, message });
    onClose();
  };

  const emailHasError = !!error;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>✉️ Envoyer la facture par email</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {emailHasError && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3" controlId="emailTo">
            <Form.Label>Destinataire</Form.Label>
            <Form.Control
              type="email"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                const validationError = validateEmail(e.target.value);
                setError(validationError);
              }}
              placeholder="exemple@client.fr"
              isInvalid={emailHasError} 
            />
            <Form.Control.Feedback type="invalid">
              {error || 'Adresse email invalide.'}
            </Form.Control.Feedback>
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
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!!validateEmail(to)} 
        >
          Envoyer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmailModal;
