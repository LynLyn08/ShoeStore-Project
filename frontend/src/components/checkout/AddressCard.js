// frontend/src/components/checkout/AddressCard.js
import React from 'react';
import { Card, Form, Badge, Button } from 'react-bootstrap';
import { FaHome, FaPen, FaTrash, FaCheckCircle } from 'react-icons/fa';

function AddressCard({ data, selected, onSelect, onEdit, onDelete, onMakeDefault }) {
    return (
        <Card
            className={`mb-2 shadow-sm ${selected ? "border-primary" : "border-0"}`}
            onClick={onSelect}
            role="button"
            style={{ cursor: 'pointer' }}
        >
            <Card.Body className="d-flex align-items-start gap-3">
                <Form.Check type="radio" name="shippingAddress" checked={selected} readOnly className="mt-1" />
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                        <strong className="me-1">{data.FullName}</strong>
                        {data.IsDefault && (
                            <Badge bg="success" pill className="d-inline-flex align-items-center gap-1">
                                <FaHome size={12} /> Mặc định
                            </Badge>
                        )}
                    </div>
                    <div className="text-muted small">{data.Phone} {data.Email ? `• ${data.Email}` : ""}</div>
                    <div className="small">{`${data.Street}, ${data.City}${data.State ? `, ${data.State}` : ""}, ${data.Country}`}</div>
                    {data.Note && <div className="small text-muted">Ghi chú: {data.Note}</div>}
                </div>
                <div className="d-flex flex-column gap-2">
                    <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Sửa"><FaPen /></Button>
                    <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Xoá"><FaTrash /></Button>
                    {!data.IsDefault && (
                        <Button size="sm" variant="outline-secondary" onClick={(e) => { e.stopPropagation(); onMakeDefault(); }} title="Đặt mặc định"><FaCheckCircle /></Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default AddressCard;