import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function CancelInvoiceButton({ onCancel, children = "Annuler" }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Veuillez saisir un motif d'annulation");
      return;
    }
    onCancel(reason);
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setShowModal(true)}
      >
        ❌ {children}
      </button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Annuler la facture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Motif de l'annulation</Form.Label>
            <Form.Control
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Erreur de saisie, Client a annulé..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Confirmer l'annulation
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}