// frontend/src/pages/user/PaymentResult.js
import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { clearCartLocal } from '../../redux/cartSlice'; // Import action để xóa giỏ hàng

// Hook tùy chỉnh để lấy query params từ URL
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function PaymentResult() {
    const query = useQuery();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');
    
    useEffect(() => {
        const responseCode = query.get('vnp_ResponseCode');
        const txnRef = query.get('vnp_TxnRef');

        setOrderId(txnRef);

        if (responseCode === '00') {
            setStatus('success');
            setMessage(`Thanh toán thành công cho đơn hàng #${txnRef}. Cảm ơn bạn đã mua hàng!`);
            // Xóa giỏ hàng khi thanh toán thành công
            dispatch(clearCartLocal());
        } else {
            setStatus('error');
            setMessage(`Thanh toán cho đơn hàng #${txnRef} đã thất bại hoặc bị hủy. Vui lòng thử lại.`);
        }
        
    }, [dispatch, query]); 

    const renderResult = () => {
        if (status === 'loading') {
            return <Spinner animation="border" variant="primary" />;
        }
        if (status === 'success') {
            return (
                <>
                    <FaCheckCircle size={70} className="text-success mb-3" />
                    <Alert variant="success">{message}</Alert>
                    <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <Button as={Link} to={`/profile/orders/${orderId}`} variant="primary" size="lg">
                            Xem chi tiết đơn hàng
                        </Button>
                        <Button as={Link} to="/products" variant="outline-secondary" size="lg">
                            Tiếp tục mua sắm
                        </Button>
                    </div>
                </>
            );
        }
        if (status === 'error') {
            return (
                <>
                    <FaTimesCircle size={70} className="text-danger mb-3" />
                    <Alert variant="danger">{message}</Alert>
                     <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                        <Button onClick={() => navigate('/checkout')} variant="warning" size="lg">
                            Thử lại thanh toán
                        </Button>
                         <Button as={Link} to="/" variant="outline-secondary" size="lg">
                            Về trang chủ
                        </Button>
                    </div>
                </>
            );
        }
    };

    return (
        <Container className="my-5">
            <Card className="text-center shadow-sm">
                <Card.Body className="p-4 p-md-5">
                    {renderResult()}
                </Card.Body>
            </Card>
        </Container>
    );
}