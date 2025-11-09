// src/components/ReviewFormModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Image } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { createReviewAPI } from '../api'; // Import API

// Component này nhận vào:
// 1. show: (boolean) để hiện/ẩn modal
// 2. onHide: (function) để đóng modal
// 3. item: (object) sản phẩm cần đánh giá (lấy từ chi tiết đơn hàng)
// 4. onReviewSubmitted: (function) callback để báo cho Profile.js biết đã review xong

function ReviewFormModal({ show, onHide, item, onReviewSubmitted }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Lấy ProductID và ProductName từ item (lưu ý cấu trúc lồng nhau)
    // Tên sản phẩm: item.ProductName (đã làm phẳng ở controller)
    // ProductID: item.variant.product.ProductID (từ controller)
    const productId = item?.variant?.product?.ProductID;
    const productName = item?.ProductName;

    // Reset state khi đổi sản phẩm (nếu modal được tái sử dụng)
    useEffect(() => {
        if (show) {
            setRating(5);
            setComment("");
            setMediaFiles([]);
            setIsLoading(false);
        }
    }, [show, item]); // Chạy lại khi 'show' hoặc 'item' thay đổi

    const handleFileChange = (e) => {
        if (e.target.files.length > 5) {
            toast.error("Chỉ được tải lên tối đa 5 file.");
            return;
        }
        setMediaFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId) {
            toast.error("Lỗi: Không tìm thấy ID sản phẩm.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('comment', comment);
        mediaFiles.forEach(file => {
            formData.append('media', file);
        });

        try {
            await createReviewAPI(productId, formData);
            toast.success("Đánh giá của bạn đã được gửi thành công!");
            
            // Báo cho Profile.js biết đã review xong
            if (onReviewSubmitted) {
                onReviewSubmitted(productId); 
            }
            
            onHide(); // Tự động đóng modal
        } catch (error) {
            toast.error(error.response?.data?.errors?.[0]?.msg || "Gửi đánh giá thất bại.");
            setIsLoading(false); // Chỉ tắt loading nếu có lỗi
        }
        // (Không tắt loading ở đây nếu thành công, vì modal sẽ bị đóng)
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <span className="fw-normal fs-6">Đánh giá sản phẩm:</span>
                    <br/> {productName}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <div className="d-flex align-items-center mb-3">
                        <Image src={item?.ImageURL} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginRight: 12 }} />
                        <div>
                            <div><strong>Phân loại:</strong> {item?.Size || ''} - {item?.Color || ''}</div>
                        </div>
                    </div>
                    <Form.Group className="mb-3 text-center">
                        <Form.Label className="fw-semibold">Bạn chấm mấy sao?</Form.Label>
                        <div>
                            {[...Array(5)].map((_, i) => (
                                <FaStar
                                    key={i}
                                    size={30}
                                    color={i < rating ? "#FFD700" : "#ddd"}
                                    onClick={() => setRating(i + 1)}
                                    style={{ cursor: 'pointer', margin: '0 5px' }}
                                />
                            ))}
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Bình luận</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm..."
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Thêm ảnh/video (Tối đa 5)</Form.Label>
                        <Form.Control
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? <Spinner size="sm" /> : "Gửi đánh giá"}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default ReviewFormModal;