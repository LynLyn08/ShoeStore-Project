import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// SỬA: THÊM Row, Col vào danh sách import
import { 
    Table, Button, Modal, Form, Spinner, Alert, 
    Container, Pagination, InputGroup, Row, Col, 
    Tabs, Tab, Badge 
} from 'react-bootstrap';
import { useFormik } from 'formik';

import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { 
    fetchAdminCoupons, 
    deleteCoupon,
    fetchCouponDetails,   
    clearCouponDetails    
} from '../../redux/adminCouponsSlice'; 
import { 
    createCouponAPI, 
    updateCouponAPI, 
    getCustomerEmailsAPI, 
    sendCouponEmailAPI
} from '../../api'; 

export default function AdminCoupon() {
    const dispatch = useDispatch();
    const { coupons, pagination, status, error, detail } = useSelector(state => state.adminCoupons); 

    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [emails, setEmails] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    useEffect(() => {
        dispatch(fetchAdminCoupons({ page, limit: 10, keyword })); 
    }, [page, keyword, dispatch]);

    useEffect(() => {
        getCustomerEmailsAPI().then(res => setEmails(res.data.emails)).catch(() => {}); 
    }, []);

    const formik = useFormik({
        initialValues: { 
            Code: '', 
            DiscountValue: '', 
            DiscountType: 'Percent', 
            ExpiryDate: '', 
            MaxUses: '0', 
            MinPurchaseAmount: '0', 
            IsPublic: true, 
            UsesPerUser: '1', 
            EmailTo: '' 
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            Code: Yup.string().required('Bắt buộc'),
            DiscountValue: Yup.number().min(1).required('Bắt buộc'),
            DiscountType: Yup.string().required('Bắt buộc'),
            ExpiryDate: Yup.date().required('Bắt buộc'),
            MaxUses: Yup.number().min(0).integer().required('Bắt buộc (0 là không giới hạn)'),
            MinPurchaseAmount: Yup.number().min(0).integer().required('Bắt buộc (0 là không yêu cầu)'),
            IsPublic: Yup.boolean(), 
            UsesPerUser: Yup.number().min(0).integer().required('Bắt buộc (0 là không giới hạn)'), 
            EmailTo: Yup.string().optional()
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                // Tách riêng giá trị EmailTo
                const { EmailTo, ...couponData } = values;

                let responseCoupon;
                let actionMessage = '';

                if (isEdit) {
                    // Bước 1: Cập nhật coupon
                    const { data } = await updateCouponAPI(editingCoupon.CouponID, couponData);
                    responseCoupon = data.coupon;
                    actionMessage = "Cập nhật coupon thành công!";
                } else {
                    // Bước 1: Tạo coupon mới
                    const { data } = await createCouponAPI(couponData);
                    responseCoupon = data.coupon;
                    actionMessage = "Tạo coupon thành công!";
                }
                
                toast.success(actionMessage);

                // Bước 2: Nếu có chọn gửi email, thực hiện cuộc gọi API thứ 2
                if (EmailTo && responseCoupon?.CouponID) {
                    try {
                        await sendCouponEmailAPI({ 
                            couponId: responseCoupon.CouponID, 
                            emailTo: EmailTo 
                        });
                        toast.info(`Đang gửi email coupon đến: ${EmailTo === 'all' ? 'Tất cả' : EmailTo}`);
                    } catch (emailError) {
                        // Lỗi gửi email không nên làm hỏng toàn bộ quy trình
                        toast.error(emailError.response?.data?.errors?.[0]?.msg || 'Gửi email thất bại.');
                    }
                }

                setShowModal(false);
                dispatch(fetchAdminCoupons({ page: 1, limit: 10, keyword: '' })); // Reset về trang 1
            } catch (err) {
                toast.error(err.response?.data?.errors?.[0]?.msg || 'Thao tác thất bại.');
            } finally {
                setSubmitting(false); // Đảm bảo form được bật lại
            }
        }
    });

    const handleAdd = () => {
        setIsEdit(false);
        setEditingCoupon(null);
        formik.resetForm();
        setShowModal(true);
    };

    const handleEdit = (coupon) => {
        setIsEdit(true);
        setEditingCoupon(coupon);
        formik.setValues({ 
            Code: coupon.Code,
            DiscountValue: coupon.DiscountValue,
            DiscountType: coupon.DiscountType,
            ExpiryDate: new Date(coupon.ExpiryDate).toISOString().split('T')[0],
            MaxUses: coupon.MaxUses,
            MinPurchaseAmount: coupon.MinPurchaseAmount,
            IsPublic: coupon.IsPublic, 
            UsesPerUser: coupon.UsesPerUser, 
            EmailTo: '' 
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc muốn xóa coupon này?')) {
            dispatch(deleteCoupon(id)); 
        }
    };
    const handleShowDetails = (coupon) => {
        setSelectedCoupon(coupon);
        dispatch(fetchCouponDetails(coupon.CouponID));
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        dispatch(clearCouponDetails());
        setSelectedCoupon(null);
    };
    const handleActionClick = (e, callback) => {
        e.stopPropagation(); // Ngăn sự kiện click của hàng
        callback();
    };
    return (
        <Container fluid>
            <h2 className="my-3">Quản lý Khuyến mãi</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <InputGroup className="mb-3">
                <Form.Control value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm kiếm..." />
                <Button onClick={() => setPage(1)}>Tìm</Button>
                <Button variant="success" onClick={handleAdd} className="ms-2">Thêm Coupon</Button>
            </InputGroup>
            
            {status === 'loading' ? <Spinner /> : (
                <Table striped bordered hover responsive>
                    <thead><tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Giảm giá</th>
                        <th>Điều kiện</th>
                        <th>Hết hạn</th>
                        <th>Đã dùng / Tổng</th>
                        <th>Loại</th>
                        <th>Hành động</th>
                    </tr></thead>
                    <tbody>
                        {coupons.map(c => (
                            <tr 
                                key={c.CouponID} 
                                onClick={() => handleShowDetails(c)} 
                                style={{ cursor: 'pointer' }} 
                            >
                                <td>{c.CouponID}</td>
                                <td>{c.Code}</td>
                                <td>{c.DiscountType === 'Percent' ? `${c.DiscountValue}%` : `${Number(c.DiscountValue).toLocaleString('vi-VN')}₫`}</td>
                                <td>{`Từ ${Number(c.MinPurchaseAmount).toLocaleString('vi-VN')}₫`}</td>
                                <td>{new Date(c.ExpiryDate).toLocaleDateString('vi-VN')}</td>
                                <td>{c.UsedCount} / {c.MaxUses === 0 ? '∞' : c.MaxUses}</td>
                                <td>{c.IsPublic ? 'Công khai' : 'Riêng tư'}</td>
                               <td>
                
                                    <Button 
                                        variant="outline-warning" 
                                        size="sm" 
                                        onClick={(e) => handleActionClick(e, () => handleEdit(c))} 
                                        className="me-2"
                                    >
                                        Sửa
                                    </Button>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm" 
                                        onClick={(e) => handleActionClick(e, () => handleDelete(c.CouponID))}
                                    >
                                        Xóa
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Pagination>
                {[...Array(pagination.totalPages).keys()].map(num => <Pagination.Item key={num+1} active={num+1 === page} onClick={() => setPage(num+1)}>{num+1}</Pagination.Item>)}
            </Pagination>
            
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>{isEdit ? 'Sửa' : 'Thêm'} Coupon</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã Code*</Form.Label>
                            <Form.Control name="Code" {...formik.getFieldProps('Code')} isInvalid={formik.touched.Code && formik.errors.Code} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Code}</Form.Control.Feedback>
                        </Form.Group>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loại giảm giá*</Form.Label>
                                    <Form.Select name="DiscountType" {...formik.getFieldProps('DiscountType')} isInvalid={formik.touched.DiscountType && formik.errors.DiscountType}>
                                        <option value="Percent">Phần trăm (%)</option>
                                        <option value="FixedAmount">Số tiền cố định (₫)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Giá trị giảm*</Form.Label>
                                    <Form.Control name="DiscountValue" type="number" {...formik.getFieldProps('DiscountValue')} isInvalid={formik.touched.DiscountValue && formik.errors.DiscountValue} />
                                    <Form.Control.Feedback type="invalid">{formik.errors.DiscountValue}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Đơn hàng tối thiểu (₫)*</Form.Label>
                            <Form.Control name="MinPurchaseAmount" type="number" {...formik.getFieldProps('MinPurchaseAmount')} isInvalid={formik.touched.MinPurchaseAmount && formik.errors.MinPurchaseAmount} />
                            <Form.Control.Feedback type="invalid">{formik.errors.MinPurchaseAmount}</Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Ngày hết hạn*</Form.Label>
                            <Form.Control name="ExpiryDate" type="date" {...formik.getFieldProps('ExpiryDate')} isInvalid={formik.touched.ExpiryDate && formik.errors.ExpiryDate} />
                            <Form.Control.Feedback type="invalid">{formik.errors.ExpiryDate}</Form.Control.Feedback>
                        </Form.Group>
                        
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tổng lượt dùng*</Form.Label>
                                    <Form.Control name="MaxUses" type="number" {...formik.getFieldProps('MaxUses')} isInvalid={formik.touched.MaxUses && formik.errors.MaxUses} />
                                    <Form.Text muted>0 = không giới hạn.</Form.Text>
                                    <Form.Control.Feedback type="invalid">{formik.errors.MaxUses}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Lượt dùng / User*</Form.Label>
                                    <Form.Control name="UsesPerUser" type="number" {...formik.getFieldProps('UsesPerUser')} isInvalid={formik.touched.UsesPerUser && formik.errors.UsesPerUser} />
                                    <Form.Text muted>0 = không giới hạn.</Form.Text>
                                    <Form.Control.Feedback type="invalid">{formik.errors.UsesPerUser}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        <Form.Group className="mb-3">
                           <Form.Check 
                                type="switch"
                                id="is-public-switch"
                                label="Công khai (Ai cũng nhập mã được)"
                                name="IsPublic"
                                checked={formik.values.IsPublic}
                                onChange={formik.handleChange}
                           />
                           <Form.Text muted>Nếu TẮT, voucher này phải được gán thủ công cho người dùng (qua Email) để sử dụng.</Form.Text>
                        </Form.Group>
                         
                        <Form.Group className="mb-3">
                            <Form.Label>Gửi email tới (Tùy chọn)</Form.Label>
                            <Form.Select name="EmailTo" {...formik.getFieldProps('EmailTo')} isInvalid={formik.touched.EmailTo && formik.errors.EmailTo}>
                                <option value="">Không gửi</option>
                                <option value="all">Gửi cho tất cả</option>
                                {emails.map(email => <option key={email} value={email}>{email}</option>)}
                            </Form.Select>
                        </Form.Group>
                        
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">Hủy</Button>
                        <Button type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? <Spinner size="sm"/> : 'Lưu'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
      {/* === THÊM MODAL CHI TIẾT MỚI === */}
            <Modal show={showDetailModal} onHide={handleCloseDetailModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Coupon: {selectedCoupon?.Code}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detail.status === 'loading' ? <Spinner /> : (
                        <Tabs defaultActiveKey="usage" id="coupon-details-tabs">
                            
                            <Tab eventKey="usage" title={`Lượt đã dùng (${detail.usage.length})`}>
                                <Table striped bordered hover size="sm" className="mt-3">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Khách hàng</th>
                                            <th>Mã Đơn hàng</th>
                                            <th>Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail.usage.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center">Chưa có ai sử dụng mã này.</td></tr>
                                        ) : (
                                            detail.usage.map((log, index) => (
                                                <tr key={log.UsageID}>
                                                    <td>{index + 1}</td>
                                                    <td>{log.Customer}</td>
                                                    <td>{log.OrderID}</td>
                                                    <td>{new Date(log.UsedAt).toLocaleString('vi-VN')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </Tab>

                            {!selectedCoupon?.IsPublic && (
                                <Tab eventKey="assignments" title={`Đã gán cho (${detail.assignments.length})`}>
                                    <Table striped bordered hover size="sm" className="mt-3">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Thời gian gán</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.assignments.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center">Chưa gán cho User nào.</td></tr>
                                            ) : (
                                                detail.assignments.map((assign, index) => (
                                                    <tr key={assign.user?.UserID || index}>
                                                        <td>{index + 1}</td>
                                                        <td>{assign.user?.Username || 'N/A'}</td>
                                                        <td>{assign.user?.Email || 'N/A'}</td>
                                                        <td>{new Date(assign.createdAt).toLocaleString('vi-VN')}</td>
                                                        <td>
                                                            {assign.IsUsed ? 
                                                                <Badge bg="success">Đã dùng</Badge> : 
                                                                <Badge bg="secondary">Chưa dùng</Badge>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </Tab>
                            )}
                        </Tabs>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDetailModal}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* === KẾT THÚC MODAL CHI TIẾT === */}
        </Container>
    );
}