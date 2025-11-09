import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ListGroup, Image, Badge, Modal, Table, Pagination } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// SỬA: Thêm FaTicketAlt và FaClock cho Ví Voucher
import { FaUserCircle, FaLock, FaBox, FaEdit, FaSave, FaTimes, FaSearch, FaHeart, FaStar, FaPen, FaTicketAlt, FaClock } from 'react-icons/fa';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

// === Import API và Component ===
import { checkReviewEligibilityAPI } from '../../api'; 
import ReviewFormModal from '../../components/ReviewFormModal'; 

// Import các actions (thunks) và selectors từ Redux
import {
    fetchUserProfile,
    updateUserProfile,
    changePassword,
    selectUser,
    selectUserStatus,
    selectUserError,
} from '../../redux/userSlice';
import {
    fetchUserOrders,
    fetchOrderDetail,
    cancelUserOrder,
    fetchPaginatedWishlist,
    fetchUserWalletVouchers,
    resetVoucherStatus // THÊM MỚI
} from '../../redux/profileSlice'; //

const PLACEHOLDER = `/placeholder.jpg`;

export default function Profile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    // --- Lấy state từ Redux Store ---
    const user = useSelector(selectUser);
    const userStatus = useSelector(selectUserStatus);
    const userError = useSelector(selectUserError);

    // LẤY STATE CHI TIẾT TỪ SLICE MỚI
    const {
        orders: orderState,      // { data, status, error }
        wishlist: wishlistState,  // { data, status, error }
        orderDetail,
        userVouchers,             // { data, status, error }
    } = useSelector((state) => state.profile); //
    
    // Tạo biến data từ state (Đã đúng)
    const orders = orderState.data;
    const wishlist = wishlistState.data;

    // (State cũ)
    const LS_KEY_SECTION = 'profile.activeSection';
    const LS_KEY_ORDERTAB = 'profile.activeOrderTab';
    const readInitialSection = () => {
        const params = new URLSearchParams(location.search);
        return params.get('section') || localStorage.getItem(LS_KEY_SECTION) || 'info';
    };
    const readInitialOrderTab = () => {
        const params = new URLSearchParams(location.search);
        return params.get('tab') || localStorage.getItem(LS_KEY_ORDERTAB) || 'Pending';
    };
    // THÊM: State cho tab Voucher
    const readInitialVoucherTab = () => {
        const params = new URLSearchParams(location.search);
        return params.get('vtab') || 'available';
    };

    const [activeSection, setActiveSection] = useState(readInitialSection());
    const [activeOrderTab, setActiveOrderTab] = useState(readInitialOrderTab());
    const [activeVoucherTab, setActiveVoucherTab] = useState(readInitialVoucherTab()); // THÊM MỚI
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingItem, setReviewingItem] = useState(null); 
    const [reviewEligibilityCache, setReviewEligibilityCache] = useState({});

    // CẬP NHẬT: Đồng bộ URL khi đổi tab
    useEffect(() => {
        localStorage.setItem(LS_KEY_SECTION, activeSection);
        const params = new URLSearchParams();
        params.set('section', activeSection);
        if (activeSection === 'orders') {
            params.set('tab', activeOrderTab);
            localStorage.setItem(LS_KEY_ORDERTAB, activeOrderTab);
        }
        if (activeSection === 'vouchers') { 
             params.set('vtab', activeVoucherTab);
        }
        navigate(`?${params.toString()}`, { replace: true });
    }, [activeSection, activeOrderTab, activeVoucherTab, navigate]);

    useEffect(() => {
        if (user?.id) {
        dispatch(fetchUserProfile());
        dispatch(fetchUserOrders());
        dispatch(fetchPaginatedWishlist({ page: 1, pageSize: 8 }));
        dispatch(fetchUserWalletVouchers());
    }

    // 2. Dọn dẹp state CỦA PROFILE SLICE khi unmount
    return () => {
        dispatch(resetVoucherStatus());
    };
    },  [dispatch, user?.id]);

    const profileFormik = useFormik({
        initialValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            fullName: Yup.string().required('Họ và tên không được để trống.'),
            email: Yup.string().email('Email không hợp lệ.').required('Email không được để trống.'),
            phone: Yup.string().matches(/(^$)|(^0(3|5|7|8|9)\d{8}$)/, 'Số điện thoại không hợp lệ.').nullable(),
        }),
        onSubmit: async (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => formData.append(key, values[key] || ''));
            if (avatarFile) formData.append('avatar', avatarFile);
            const resultAction = await dispatch(updateUserProfile(formData));
            if (updateUserProfile.fulfilled.match(resultAction)) {
                toast.success('Cập nhật thông tin thành công!');
                setIsEditingProfile(false);
                setAvatarFile(null);
                setAvatarPreview(null);
            }
        },
    });

    const passwordFormik = useFormik({
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            currentPassword: Yup.string().required('Vui lòng nhập mật khẩu hiện tại.'),
            newPassword: Yup.string().required('Vui lòng nhập mật khẩu mới.').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ HOA, thường, số, và ký tự đặc biệt.'),
            confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu mới.')
        }),
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(changePassword({ oldPassword: values.currentPassword, newPassword: values.newPassword }));
            if (changePassword.fulfilled.match(resultAction)) {
                toast.success('Đổi mật khẩu thành công!');
                resetForm();
            }
        }
    });

    // === LOGIC VOUCHER TẠI PROFILE ===
    const VOUCHER_TABS = [{ key: 'available', label: 'Chưa dùng' }, { key: 'used', label: 'Đã dùng' }];

    const categorizedVouchers = useMemo(() => {
        const allVouchers = userVouchers.data || []; 
        const now = new Date();
        
        // Phân loại các voucher được gán cho user
        return allVouchers.reduce((acc, v) => {
            const expiryDate = new Date(v.ExpiryDate);
            const isUsed = v.IsUsedInWallet;
            
            if (isUsed) {
                 acc.used.push(v);
            } else if (expiryDate < now) {
                 // Nếu chưa dùng nhưng hết hạn
                 acc.expired.push(v);
            } else {
                 acc.available.push(v);
            }
            return acc;
        }, { available: [], used: [], expired: [] });
    }, [userVouchers.data]); 
    
    const renderVoucherContent = () => {
        const vouchers = categorizedVouchers[activeVoucherTab] || [];
        
        if (userVouchers.status === 'loading') return <div className="text-center p-5"><Spinner /></div>; //
        if (userVouchers.status === 'failed') return <Alert variant="danger">{userVouchers.error}</Alert>; //
        
        if (vouchers.length === 0) {
            return <p className="text-muted mt-3">Không có voucher nào trong mục này.</p>;
        }
        
        return (
            <div className="row g-3">
                {vouchers.map(v => {
                    const discountText = v.DiscountType === 'Percent' 
                        ? `Giảm ${v.DiscountValue}%` 
                        : `Giảm ${Number(v.DiscountValue).toLocaleString('vi-VN')}₫`;
                    // Dùng class cho UI
                    const statusClass = activeVoucherTab === 'available' ? 'border-success' : (activeVoucherTab === 'used' ? 'border-secondary opacity-75' : 'border-danger opacity-75');
                    const statusVariant = activeVoucherTab === 'available' ? 'success' : (activeVoucherTab === 'used' ? 'secondary' : 'danger');

                    return (
                        <Col key={v.CouponID} md={6}>
                            <Card className={`h-100 ${statusClass}`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1 text-primary fw-bold">{discountText}</h6>
                                            <p className="mb-0 small text-muted">Mã: <strong>{v.Code}</strong></p>
                                            <p className="mb-0 small text-muted">ĐH tối thiểu: {Number(v.MinPurchaseAmount).toLocaleString('vi-VN')}₫</p>
                                        </div>
                                        <Badge bg={statusVariant} className="text-uppercase p-2">
                                            {activeVoucherTab === 'available' ? 'CÓ SẴN' : (activeVoucherTab === 'used' ? 'ĐÃ DÙNG' : 'HẾT HẠN')}
                                        </Badge>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span><FaClock className="me-1" /> HSD: {new Date(v.ExpiryDate).toLocaleDateString('vi-VN')}</span>
                                        {activeVoucherTab === 'available' && <Link to="/checkout" className="text-success fw-bold">Dùng ngay →</Link>}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </div>
        );
    };

    // === HÀM REVIEW (GIỮ NGUYÊN) ===
    const checkAllReviewEligibilities = async (items) => {
        if (!items || items.length === 0) return;

        const productIdsToCheck = new Set(
            items.map(it => it.variant.product.ProductID)
                 .filter(id => reviewEligibilityCache[id] === undefined) 
        );

        if (productIdsToCheck.size === 0) return;

        const promises = Array.from(productIdsToCheck).map(id => 
            checkReviewEligibilityAPI(id).then(res => ({ id, ...res.data }))
        );

        const results = await Promise.all(promises);

        setReviewEligibilityCache(prevCache => {
            const newCache = { ...prevCache };
            results.forEach(result => {
                newCache[result.id] = { canReview: result.canReview, hasReviewed: result.hasReviewed };
            });
            return newCache;
        });
    };

    const handleOpenDetail = (orderId) => {
        dispatch(fetchOrderDetail(orderId)).unwrap().then((detailData) => { //
            if (detailData?.Order?.Status === 'Delivered') {
                checkAllReviewEligibilities(detailData.Items);
            }
        });
        setShowDetailModal(true);
    };

    const handleOpenReviewModal = (item) => {
        setReviewingItem(item); 
        setShowDetailModal(false); 
        setShowReviewModal(true);
    };
    
    const handleReviewSubmitted = (productId) => {
        setReviewEligibilityCache(prevCache => ({
            ...prevCache,
            [productId]: { canReview: false, hasReviewed: true }
        }));
        setShowReviewModal(false);
        handleOpenDetail(orderDetail.data.Order.OrderID); 
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Xác nhận hủy đơn hàng này?')) return;
        setIsCancelling(true); 
        try {
            const resultAction = await dispatch(cancelUserOrder(orderId)); //
            if (cancelUserOrder.fulfilled.match(resultAction)) {
                toast.success('Đã hủy đơn hàng thành công.');
                if (showDetailModal && orderDetail.data?.Order?.OrderID === orderId) {
                    dispatch(fetchOrderDetail(orderId)); //
                }
                if (activeOrderTab === 'Pending') setActiveOrderTab('Cancelled');
            } else {
                toast.error(resultAction.payload?.message || 'Không thể hủy đơn hàng.');
            }
        } finally {
            setIsCancelling(false); 
        }
    };
    // ... (các hàm xử lý form, tìm kiếm, pagination giữ nguyên)

    const handleAvatarChange = (event) => {
        const file = event.currentTarget.files[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            toast.error('Vui lòng chọn một file hình ảnh.');
        }
    };
    const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        profileFormik.resetForm();
        setAvatarFile(null);
        setAvatarPreview(null);
    };
    const handleSearchOrders = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        try {
            await dispatch(fetchUserOrders({ q: orderSearch })).unwrap(); //
        } catch (error) {
            toast.error("Lỗi khi tìm kiếm đơn hàng.");
        } finally {
            setIsSearching(false);
        }
    };
    const handleWishlistPageChange = (page) => {
        dispatch(fetchPaginatedWishlist({ page, pageSize: 8 })); //
    };
    
    const orderCounts = useMemo(() => orders.reduce((acc, o) => {
        acc[o.Status] = (acc[o.Status] || 0) + 1;
        return acc;
    }, { Pending: 0, Confirmed: 0, Shipped: 0, Delivered: 0, Cancelled: 0 }), [orders]);
    const filteredOrders = useMemo(() => {
        return orders.filter((o) => o.Status === activeOrderTab);
    }, [orders, activeOrderTab]);
    
    // SỬA LỖI TREO MÀN HÌNH: Dùng trạng thái loading tổng của các slice con
    const isActionLoading = userStatus === 'loading' || 
                            orderState.status === 'loading' || 
                            wishlistState.status === 'loading';
    const STATUS_META = { Pending: { label: 'Chờ xác nhận', variant: 'warning' }, Confirmed: { label: 'Chờ lấy hàng', variant: 'info' }, Shipped: { label: 'Chờ giao hàng', variant: 'primary' }, Delivered: { label: 'Đã giao', variant: 'success' }, Cancelled: { label: 'Đã hủy', variant: 'danger' } };
    const ORDER_TABS = [{ key: 'Pending', label: 'Chờ xác nhận' }, { key: 'Confirmed', label: 'Chờ lấy hàng' }, { key: 'Shipped', label: 'Chờ giao hàng' }, { key: 'Delivered', label: 'Đã giao' }, { key: 'Cancelled', label: 'Đã hủy' }];
    const styles = `
    :root {
      --bg-body: #f7f8fa;
      --bg-card: #ffffff;
      --bg-sidebar: #ffffff;
      --border-soft: #e9ecef;
      --text-primary: #212529;
      --text-secondary: #6c757d;
      --brand: #0d6efd;
      --brand-soft: #e7f0ff;
      --danger: #dc3545;
      --success: #198754;
    }
    .profile-container { min-height: 100vh; background: var(--bg-body); padding: 2rem 0; }
    .profile-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .sidebar { background: var(--bg-sidebar); border: 1px solid var(--border-soft); border-radius: 12px; padding: 1rem; }
    .sidebar .list-group-item { border: none; }
    .sidebar-item { cursor: pointer; padding: .75rem 1rem; margin-bottom: .25rem; border-radius: 10px; color: var(--text-primary); background: transparent; transition: all .2s ease; font-weight: 500; }
    .sidebar-item:hover { background: var(--brand-soft); color: var(--brand); }
    .sidebar-item.active { background: var(--brand); color: #fff; }
    .content-card { background: var(--bg-card); border: 1px solid var(--border-soft); padding: 2rem; border-radius: 12px; }
    .avatar-img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 1px solid var(--border-soft); }
    .order-item { border-bottom: 1px solid var(--border-soft); padding: 1rem 0; }
    .order-item:last-child { border-bottom: 0; }
    .btn-primary-auth { background: var(--brand); border-color: var(--brand); border-radius: 999px; padding: .5rem 1.25rem; font-weight: 600; transition: all .2s ease; }
    .btn-primary-auth:hover { filter: brightness(.95); }
    .btn-outline-secondary-custom { border-color: var(--text-secondary); color: var(--text-secondary); border-radius: 999px; padding: .5rem 1.25rem; font-weight: 600; transition: all .2s ease; }
    .btn-outline-secondary-custom:hover { background: var(--text-secondary); color: #fff; }
    h4 { font-weight: 700; margin-bottom: 1.25rem; color: var(--text-primary); }
    .text-muted { color: var(--text-secondary) !important; }
    .form-control:read-only { background-color: #e9ecef; opacity: 1; }
    .order-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-soft); }
    @media (max-width: 768px) { .sidebar { margin-bottom: 1rem; } }
    .order-tabs { display:flex; gap:28px; border-bottom:1px solid var(--border-soft); margin-bottom:12px; }
    .order-tab { padding:14px 0; font-weight:600; cursor:pointer; position:relative; color:#222; }
    .order-tab:hover { color:#ff5622; }
    .order-tab.active { color:#ff5622; }
    .order-tab.active::after{
      content:''; position:absolute; left:0; bottom:-1px; height:3px; width:100%;
      background:#ff5622; border-radius:2px;
    }
    .order-count{ margin-left:6px; font-weight:700; font-size:13px; color:#999; }
    .wishlist-card img{ object-fit:cover; width:100%; height:100%; }
    .voucher-tab { padding:14px 0; font-weight:600; cursor:pointer; position:relative; color:#222; }
    .voucher-tab:hover { color:var(--brand); }
    .voucher-tab.active { color:var(--brand); }
    .voucher-tab.active::after{
      content:''; position:absolute; left:0; bottom:-1px; height:3px; width:100%;
      background:var(--brand); border-radius:2px;
    }
  `;
    const renderWLPagination = () => {
        const totalPages = Math.ceil(wishlist.total / wishlist.pageSize);
        if (totalPages <= 1) return null;
        let items = [];
        const currentPage = wishlist.page;
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        items.push(<Pagination.First key="first" disabled={currentPage === 1} onClick={() => handleWishlistPageChange(1)} />);
        items.push(<Pagination.Prev key="prev" disabled={currentPage === 1} onClick={() => handleWishlistPageChange(currentPage - 1)} />);
        if (startPage > 1) {
            items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        }
        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handleWishlistPageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        if (endPage < totalPages) {
            items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
        }
        items.push(<Pagination.Next key="next" disabled={currentPage === totalPages} onClick={() => handleWishlistPageChange(currentPage + 1)} />);
        items.push(<Pagination.Last key="last" disabled={currentPage === totalPages} onClick={() => handleWishlistPageChange(totalPages)} />);
        return <Pagination className="mt-3 justify-content-center">{items}</Pagination>;
    };


   // === RENDER ===
    return (
        <div className="profile-container">
            <style>{styles}</style>
            <Container>
                <Row className="g-3">
                    {/* Sidebar */}
                    <Col md={3}>
                        <Card className="sidebar profile-card">
                            <ListGroup variant="flush">
                                <ListGroup.Item className={`sidebar-item ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}><FaUserCircle className="me-2" /> Thông tin tài khoản</ListGroup.Item>
                                <ListGroup.Item className={`sidebar-item ${activeSection === 'orders' ? 'active' : ''}`} onClick={() => setActiveSection('orders')}><FaBox className="me-2" /> Đơn hàng của bạn</ListGroup.Item>
                                <ListGroup.Item className={`sidebar-item ${activeSection === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveSection('wishlist')}><FaHeart className="me-2" /> Yêu thích ({wishlist.total || 0})</ListGroup.Item>
                                <ListGroup.Item className={`sidebar-item ${activeSection === 'vouchers' ? 'active' : ''}`} onClick={() => setActiveSection('vouchers')}><FaTicketAlt className="me-2" /> Ví Voucher</ListGroup.Item>
                                <ListGroup.Item className={`sidebar-item ${activeSection === 'password' ? 'active' : ''}`} onClick={() => setActiveSection('password')}><FaLock className="me-2" /> Đổi mật khẩu</ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>

                    {/* Content */}
                    <Col md={9}>
                        <Card className="content-card profile-card">
                            {/* Lỗi chung của user (như đổi mật khẩu thất bại) */}
                            {userStatus === 'failed' && userError && <Alert variant="danger">{userError}</Alert>}
                            
                            {/* SỬA LỖI: Xóa profileStatus và hiển thị lỗi riêng lẻ */}
                            {orderState.status === 'failed' && <Alert variant="danger">{orderState.error}</Alert>}
                            {wishlistState.status === 'failed' && <Alert variant="danger">{wishlistState.error}</Alert>}
                            {userVouchers.status === 'failed' && <Alert variant="danger">{userVouchers.error}</Alert>}

                            {activeSection === 'info' && (<>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h4>Thông tin tài khoản</h4>
                                    {!isEditingProfile ? (<Button variant="outline-secondary" className="btn-outline-secondary-custom" onClick={() => setIsEditingProfile(true)}><FaEdit className="me-2" /> Sửa</Button>) : (
                                        <div>
                                            <Button type="submit" form="profileForm" className="btn-primary-auth me-2" disabled={isActionLoading}>{isActionLoading ? <Spinner size="sm" /> : <><FaSave className="me-2" /> Lưu</>}</Button>
                                            <Button variant="secondary" className="btn-outline-secondary-custom" onClick={handleCancelEditProfile} disabled={isActionLoading}><FaTimes className="me-2" /> Hủy</Button>
                                        </div>
                                    )}
                                </div>
                                <Form noValidate id="profileForm" onSubmit={profileFormik.handleSubmit}>
                                    <div className="d-flex align-items-center mb-3">
                                        <Image src={avatarPreview || user?.avatar || PLACEHOLDER} alt="Avatar" className="avatar-img me-3" />
                                        {isEditingProfile && <Form.Group controlId="avatarUpload"><Form.Label className="fw-semibold">Thay đổi avatar</Form.Label><Form.Control type="file" accept="image/*" onChange={handleAvatarChange} /><Form.Text muted>Tối đa 2MB.</Form.Text></Form.Group>}
                                    </div>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Họ và tên</Form.Label>
                                        <Form.Control name="fullName" {...profileFormik.getFieldProps('fullName')} isInvalid={profileFormik.touched.fullName && profileFormik.errors.fullName} readOnly={!isEditingProfile} />
                                        <Form.Control.Feedback type="invalid">{profileFormik.errors.fullName}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control name="email" type="email" {...profileFormik.getFieldProps('email')} isInvalid={profileFormik.touched.email && profileFormik.errors.email} readOnly={!isEditingProfile} />
                                        <Form.Control.Feedback type="invalid">{profileFormik.errors.email}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Số điện thoại</Form.Label>
                                        <Form.Control name="phone" {...profileFormik.getFieldProps('phone')} isInvalid={profileFormik.touched.phone && profileFormik.errors.phone} readOnly={!isEditingProfile} />
                                        <Form.Control.Feedback type="invalid">{profileFormik.errors.phone}</Form.Control.Feedback>
                                    </Form.Group>
                                </Form>
                            </>)}

                            {activeSection === 'orders' && (<>
                                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                                    <h4 className="mb-0">Đơn hàng của bạn</h4>
                                    <Form className="d-flex" onSubmit={handleSearchOrders}>
                                        <Form.Control placeholder="Tìm theo mã đơn, tên, SĐT..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} style={{ width: 280 }} />
                                        <Button className="ms-2" variant="outline-secondary" type="submit" disabled={isSearching}>{isSearching ? <Spinner size="sm" /> : <FaSearch />}</Button>
                                    </Form>
                                </div>
                                <div className="order-tabs">
                                    {ORDER_TABS.map((tab) => (
                                        <div key={tab.key} className={`order-tab ${activeOrderTab === tab.key ? 'active' : ''}`} onClick={() => setActiveOrderTab(tab.key)}>
                                            {tab.label}<span className="order-count">({orderCounts[tab.key] || 0})</span>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* SỬA LỖI: Đọc từ orderState.status */}
                                {orderState.status === 'loading' && !isSearching ? <div className="text-center p-5"><Spinner /></div> :
                                    filteredOrders.length === 0 ? <p className="text-muted mt-3">Không có đơn hàng nào trong mục này.</p> :
                                    <ListGroup variant="flush">{filteredOrders.map(order => (
                                        <ListGroup.Item key={order.OrderID} className="order-item">
                                          <div className="d-flex align-items-start gap-3">
                                          <div>
                                            {order.FirstItemImage ? (
                                              <img
                                                src={order.FirstItemImage}
                                                alt={order.FirstItemName || 'product'}
                                                className="order-thumb"
                                                onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                                              />
                                            ) : (
                                              <img src={PLACEHOLDER} alt="placeholder" className="order-thumb" />
                                            )}
                                          </div>
                                          <div className="flex-grow-1">
                                            <div className="d-flex align-items-center justify-content-between">
                                              <div className="fw-semibold">
                                                Mã đơn: #{order.OrderID}{' '}
                                                <Badge bg={STATUS_META[order.Status]?.variant || 'secondary'}>
                                                  {STATUS_META[order.Status]?.label || order.Status}
                                                </Badge>
                                              </div>
                                              <div className="text-muted small">
                                                Ngày đặt: {new Date(order.OrderDate).toLocaleString()}
                                              </div>
                                            </div>

                                            <div className="small text-muted mb-1">
                                              {order.FirstItemName ? <>Sản phẩm đầu tiên: <strong>{order.FirstItemName}</strong></> : '—'}
                                              {' '}•{' '}
                                              Tổng dòng hàng: <strong>{order.ItemsCount}</strong>
                                            </div>

                                            <div className="mb-1">
                                              <strong>Tổng tiền: </strong>
                                              {Number(order.TotalAmount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                            </div>

                                            <div className="small text-muted">
                                              <div>Người nhận: {order.RecipientName || '-'}</div>
                                              <div>Điện thoại: {order.ShippingPhone || '-'}</div>
                                              <div>Địa chỉ: {order.Address || '-'}</div>
                                              {(order.TrackingCode || order.ShippingProvider) && (
                                                <div>
                                                  Vận chuyển: {order.ShippingProvider || 'N/A'} • Mã theo dõi: {order.TrackingCode || 'N/A'}
                                                </div>
                                              )}
                                            </div>

                                            <div className="mt-2">
                                              <Button size="sm" variant="outline-primary" onClick={() => handleOpenDetail(order.OrderID)}>
                                                Xem chi tiết
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                        </ListGroup.Item>
                                    ))}</ListGroup>}
                            </>)}
                            
                            {/* VÍ VOUCHER */}
                            {activeSection === 'vouchers' && (<>
                                <h4 className="mb-0">Ví Voucher ({userVouchers.data?.length || 0})</h4>
                                <div className="order-tabs">
                                    {VOUCHER_TABS.map((tab) => (
                                        <div key={tab.key} className={`voucher-tab ${activeVoucherTab === tab.key ? 'active' : ''}`} onClick={() => setActiveVoucherTab(tab.key)}>
                                            {tab.label}<span className="order-count">({categorizedVouchers[tab.key]?.length || 0})</span>
                                        </div>
                                    ))}
                                    <div key="expired" className={`voucher-tab ${activeVoucherTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveVoucherTab('expired')}>
                                            Hết hạn<span className="order-count">({categorizedVouchers['expired']?.length || 0})</span>
                                    </div>
                                </div>
                                {renderVoucherContent()}
                            </>)}

                            {activeSection === 'wishlist' && (<>
                                <h4>Danh sách yêu thích ({wishlist.total || 0})</h4>
                                
                                {/* SỬA LỖI: Đọc từ wishlistState.status */}
                                {wishlistState.status === 'loading' ? <div className="text-center p-5"><Spinner /></div> :
                                    wishlist.items.length === 0 ? <p className="text-muted">Bạn chưa thêm sản phẩm nào vào yêu thích.</p> :
                                    <>
                                        <Row className="g-3">
                                            {wishlist.items.map(w => {
                                                const item = w.product;
                                                const price = Number(item.DiscountedPrice ?? item.Price ?? 0);
                                                return (
                                                    <Col key={w.WishlistID} sm={6} md={4} lg={3}>
                                                        <Card className="h-100 position-relative wishlist-card">
                                                            <Link to={`/product/${item.ProductID}`} className="stretched-link" />
                                                            <div style={{ aspectRatio: '4 / 3' }}><Image src={item.DefaultImage || PLACEHOLDER} className="card-img-top" style={{ objectFit: 'cover', height: '100%' }} /></div>
                                                            <Card.Body>
                                                                <Card.Title as="h6" className="text-truncate">{item.Name}</Card.Title>
                                                                <Card.Text className="text-danger fw-bold">{price.toLocaleString('vi-VN')}₫</Card.Text>
                                                            </Card.Body>
                                                        </Card>
                                                    </Col>
                                                )
                                            })}
                                        </Row>
                                        {renderWLPagination()}
                                    </>
                                }
                            </>)}

                            {activeSection === 'password' && (<>
                                <h4>Đổi mật khẩu</h4>
                                <Form noValidate onSubmit={passwordFormik.handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mật khẩu hiện tại</Form.Label>
                                        <Form.Control name="currentPassword" type="password" {...passwordFormik.getFieldProps('currentPassword')} isInvalid={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword} />
                                        <Form.Control.Feedback type="invalid">{passwordFormik.errors.currentPassword}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mật khẩu mới</Form.Label>
                                        <Form.Control name="newPassword" type="password" {...passwordFormik.getFieldProps('newPassword')} isInvalid={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword} />
                                        <Form.Control.Feedback type="invalid">{passwordFormik.errors.newPassword}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                        <Form.Control name="confirmPassword" type="password" {...passwordFormik.getFieldProps('confirmPassword')} isInvalid={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword} />
                                        <Form.Control.Feedback type="invalid">{passwordFormik.errors.confirmPassword}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Button type="submit" className="btn-primary-auth" disabled={userStatus === 'loading'}>{userStatus === 'loading' ? <Spinner size="sm" /> : 'Đổi mật khẩu'}</Button>
                                </Form>
                            </>)}
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{orderDetail.data?.Order?.OrderID}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {orderDetail.status === 'loading' && <div className="text-center p-5"><Spinner /></div>}
                    {orderDetail.status === 'failed' && <Alert variant="danger">{orderDetail.error}</Alert>}
                    {orderDetail.status === 'succeeded' && orderDetail.data && (
                        <>
                            <div className="mb-3">
                                <div className="mb-1 d-flex align-items-center gap-2">
                                    <strong>Trạng thái: </strong>
                                    <Badge bg={STATUS_META[orderDetail.data.Order?.Status]?.variant || 'secondary'}>{STATUS_META[orderDetail.data.Order?.Status]?.label || orderDetail.data.Order?.Status}</Badge>
                                    {orderDetail.data.Order?.Status === 'Pending' && <Button size="sm" variant="outline-danger" onClick={() => handleCancelOrder(orderDetail.data.Order.OrderID)} disabled={isCancelling}>{isCancelling ? <><Spinner size="sm" /> Đang hủy...</> : 'Hủy đơn'}</Button>}
                                </div>
                                <div><strong>Ngày đặt: </strong>{new Date(orderDetail.data.Order?.OrderDate).toLocaleString()}</div>
                                <div><strong>Tổng tiền: </strong>{Number(orderDetail.data.Order?.TotalAmount || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</div>
                                <div><strong>Người nhận: </strong>{orderDetail.data.Order?.RecipientName || '-'}</div>
                                <div><strong>SĐT: </strong>{orderDetail.data.Order?.ShippingPhone || '-'}</div>
                                <div><strong>Địa chỉ: </strong>{orderDetail.data.Order?.Address || '-'}</div>
                            </div>
                            <Table bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Phân loại</th>
                                        <th className="text-end">SL</th>
                                        <th className="text-end">Đơn giá</th>
                                        <th className="text-end">Thành tiền</th>
                                        {orderDetail.data.Order?.Status === 'Delivered' && (
                                            <th className="text-center">Đánh giá</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderDetail.data.Items?.map(it => {
                                        const qty = it.Quantity ?? 0; const price = it.Price ?? 0;
                                        const productId = it.variant?.product?.ProductID;
                                        const eligibility = reviewEligibilityCache[productId];
                                        
                                        return (
                                            <tr key={it.OrderItemID}>
                                                <td><div className="d-flex align-items-center gap-2"><Image src={it.ImageURL || PLACEHOLDER} style={{ width: 44, height: 44, objectFit: 'cover' }} /><span className="fw-semibold">{it.ProductName || ''}</span></div></td>
                                                <td>{it.Size || it.Color ? `${it.Size ? `Size ${it.Size}` : ''}${it.Color ? (it.Size ? ' - ' : '') + `Màu ${it.Color}` : ''}` : '—'}</td>
                                                <td className="text-end">{qty}</td>
                                                <td className="text-end">{price.toLocaleString('vi-VN')}₫</td>
                                                <td className="text-end">{(price * qty).toLocaleString('vi-VN')}₫</td>
                                                
                                                {orderDetail.data.Order?.Status === 'Delivered' && (
                                                    <td className="text-center align-middle">
                                                        {eligibility?.hasReviewed ? (
                                                            <Button size="sm" variant="outline-success" disabled>
                                                                <FaStar className="me-1" /> Đã đánh giá
                                                            </Button>
                                                        ) : eligibility?.canReview ? (
                                                            <Button size="sm" variant="primary" onClick={() => handleOpenReviewModal(it)}>
                                                                <FaPen className="me-1" /> Viết đánh giá
                                                            </Button>
                                                        ) : (
                                                            eligibility === undefined ? <Spinner size="sm" /> : <span className="text-muted small">—</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* MODAL REVIEW MỚI */}
            <ReviewFormModal 
                show={showReviewModal}
                onHide={() => {
                    setShowReviewModal(false);
                    if (orderDetail.data) {
                        setShowDetailModal(true); 
                    }
                }}
                item={reviewingItem}
                onReviewSubmitted={handleReviewSubmitted}
            />
        </div>
    );
}