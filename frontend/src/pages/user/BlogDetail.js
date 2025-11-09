import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Spinner, Alert, Breadcrumb } from 'react-bootstrap';
import { FaUser, FaCalendarAlt } from 'react-icons/fa';
import { 
    fetchBlogById, 
    selectCurrentBlog, 
    selectBlogDetailStatus, 
    selectBlogError, 
    clearCurrentPost 
} from '../../redux/blogSlice';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER = '/blog-placeholder.jpg';

export default function BlogDetail() {
    const { id } = useParams();
    const dispatch = useDispatch();

    // Lấy dữ liệu từ Redux store
    const blog = useSelector(selectCurrentBlog);
    const status = useSelector(selectBlogDetailStatus);
    const error = useSelector(selectBlogError);

    useEffect(() => {
        if (id) {
            // Dispatch action để fetch dữ liệu khi có ID
            dispatch(fetchBlogById(id));
        }

        // Cleanup function: dọn dẹp state khi component unmount
        return () => {
            dispatch(clearCurrentPost());
        };
    }, [id, dispatch]);

    // Xử lý các trạng thái UI
    if (status === 'loading') {
        return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    if (status === 'failed') {
        return <Container className="py-5"><Alert variant="danger">{error || 'Không thể tải bài viết.'}</Alert></Container>;
    }

    if (!blog) {
        // Trường hợp không có lỗi nhưng cũng không có dữ liệu (ví dụ: ID không tồn tại)
        return <Container className="py-5"><Alert variant="warning">Không tìm thấy bài viết.</Alert></Container>;
    }

    const imageUrl = blog.ImageURL ? `${API_BASE_URL}${blog.ImageURL}` : PLACEHOLDER;

    return (
        <div className="py-4" style={{ background: '#f8f9fa' }}>
            <Container>
                <Breadcrumb className="mb-4">
                    <Breadcrumb.Item as={Link} to="/">Trang chủ</Breadcrumb.Item>
                    <Breadcrumb.Item as={Link} to="/blogs">Blog</Breadcrumb.Item>
                    <Breadcrumb.Item active>{blog.Title}</Breadcrumb.Item>
                </Breadcrumb>
                
                <Row className="justify-content-center">
                    <Col lg={8}>
                        <Card className="border-0 shadow-sm">
                            <Card.Img 
                                variant="top" 
                                src={imageUrl} 
                                alt={blog.Title} 
                                style={{ maxHeight: '450px', objectFit: 'cover' }}
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                            />
                            <Card.Body className="p-4 p-md-5">
                                <Card.Title as="h1" className="fw-bold mb-3">{blog.Title}</Card.Title>
                                <div className="d-flex align-items-center text-muted small mb-4">
                                    <span className="me-4 d-flex align-items-center">
                                        <FaUser className="me-2" /> {blog.Author || 'Admin'}
                                    </span>
                                    <span className="d-flex align-items-center">
                                        <FaCalendarAlt className="me-2" /> {new Date(blog.CreatedAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div 
                                    className="blog-content" 
                                    dangerouslySetInnerHTML={{ __html: blog.Content }} 
                                />
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}