// frontend/src/components/checkout/Checkout.js 

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Row, Col, Card, Form, Button, Alert, Spinner, Badge, InputGroup, Modal, Image } from "react-bootstrap";
import { FaMapMarkerAlt, FaPlus, FaTruck, FaMoneyBillWave, FaShieldAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

import { 
    fetchCheckoutData, 
    validateCoupon, 
    placeOrder, 
    createNewAddress, 
    clearCoupon,
    fetchUserVouchers // THÊM MỚI
} from "../../redux/checkoutSlice"; //
import { clearCartLocal } from "../../redux/cartSlice";
import { selectUser } from "../../redux/userSlice";
import { resetVoucherStatus } from "../../redux/profileSlice";
import AddressCard from "../../components/checkout/AddressCard";
import * as api from '../../api'; //

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const normalizeImg = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
};

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const user = useSelector(selectUser);
    const { 
        addresses, 
        providers, 
        coupons, 
        userVouchers, // THÊM MỚI
        userVouchersStatus, // THÊM MỚI
        paymentMethods, 
        status, 
        error, 
        orderStatus, 
        orderError, 
        couponDiscount, 
        couponNote, 
        validatingCoupon 
    } = useSelector(state => state.checkout); //
    const cartItemsFromRedux = useSelector(state => state.cart.items);
    const isUser = !!user;

    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [shippingProviderId, setShippingProviderId] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [showCouponModal, setShowCouponModal] = useState(false);

    const [addrModalOpen, setAddrModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const items = useMemo(() => {
        const itemsFromState = location.state?.selectedItems || location.state?.buyNowItems;
        if (itemsFromState && itemsFromState.length > 0) return itemsFromState;
        return cartItemsFromRedux;
    }, [location.state, cartItemsFromRedux]);

    const guestFormik = useFormik({
        initialValues: { fullName: "", phone: "", email: "", street: "", city: "" },
        validationSchema: Yup.object({
            fullName: Yup.string().required('Họ tên là bắt buộc.'),
            phone: Yup.string().matches(/^0\d{9}$/, 'Số điện thoại không hợp lệ.').required('Số điện thoại là bắt buộc.'),
            email: Yup.string().email('Email không hợp lệ.').required('Email là bắt buộc.'),
            street: Yup.string().required('Địa chỉ là bắt buộc.'),
            city: Yup.string().required('Thành phố là bắt buộc.'),
        }),
        onSubmit: () => {}
    });

    const addressFormik = useFormik({
        initialValues: { fullName: '', phone: '', email: '', street: '', city: '', isDefault: false },
        enableReinitialize: true,
        validationSchema: Yup.object({
            fullName: Yup.string().required('Họ tên là bắt buộc.'),
            phone: Yup.string().matches(/^0\d{9}$/, 'Số điện thoại không hợp lệ.').required('Số điện thoại là bắt buộc.'),
            email: Yup.string().email('Email không hợp lệ.'),
            street: Yup.string().required('Địa chỉ là bắt buộc.'),
            city: Yup.string().required('Thành phố là bắt buộc.'),
        }),
        onSubmit: async (values) => {
            const payload = {
                FullName: values.fullName,
                Phone: values.phone,
                Email: values.email,
                Street: values.street,
                City: values.city,
                IsDefault: values.isDefault,
            };

            try {
                if (editingAddress) {
                    await api.updateAddressAPI(editingAddress.AddressID, payload); //
                    toast.success("Cập nhật địa chỉ thành công!");
                } else {
                    const resultAction = await dispatch(createNewAddress(payload)); //
                    toast.success("Thêm địa chỉ mới thành công!");
                    setSelectedAddressId(resultAction.payload.id);
                    console.log('New address payload:', resultAction.payload);
                }
                setAddrModalOpen(false);
                dispatch(fetchCheckoutData(!!user)); //
            } catch (err) {
                console.error('Add address error:', err);
                toast.error(err.response?.data?.message || "Lưu địa chỉ thất bại.");
            }
        }
    });

    const handleDeleteAddress = async (addressId) => {
        if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
            try {
                await api.deleteAddressAPI(addressId); //
                toast.success("Đã xóa địa chỉ.");
                dispatch(fetchCheckoutData(isUser)); //
            } catch (err) {
                toast.error(err.response?.data?.message || "Xóa địa chỉ thất bại.");
            }
        }
    };

    useEffect(() => { 
        dispatch(fetchCheckoutData(isUser)); //
        if(isUser) {
            dispatch(fetchUserVouchers()); // THÊM: Lấy ví voucher nếu là user
        }
    }, [dispatch, isUser]);

    useEffect(() => {
        if (status === 'succeeded') {
            if (isUser && addresses.length > 0 && !selectedAddressId) {
                const defaultAddress = addresses.find(a => a.IsDefault) || addresses[0];
                setSelectedAddressId(defaultAddress?.AddressID);
            }
            if (providers.length > 0 && !shippingProviderId) {
                setShippingProviderId(providers[0].ProviderID);
                setShippingFee(providers[0].Fee || 0);
            }
            if (paymentMethods.length > 0 && !paymentMethod) {
                setPaymentMethod(paymentMethods[0].Code);
            }
        }
    }, [status, isUser, addresses, providers, paymentMethods, selectedAddressId, shippingProviderId, paymentMethod]);

    const subtotal = useMemo(() => items.reduce((total, item) => total + ((item.price ?? item.Price) * (item.quantity ?? item.Quantity)), 0), [items]);
    const grandTotal = useMemo(() => Math.max(0, subtotal - couponDiscount + shippingFee), [subtotal, couponDiscount, shippingFee]);
    
    // TÍNH TOÁN DANH SÁCH COUPON HOÀN CHỈNH ĐỂ HIỂN THỊ TRONG MODAL
    const availableCoupons = useMemo(() => {
        const allCoupons = [...coupons];
        userVouchers.forEach(v => {
            if (!allCoupons.some(c => c.Code === v.Code)) {
                allCoupons.push(v);
            }
        });

        return allCoupons.map(c => ({
            CouponID: c.CouponID,
            Code: c.Code,
            DiscountType: c.DiscountType,
            DiscountValue: c.DiscountValue,
            DisplayDiscount: c.DiscountType === 'Percent' ? `${c.DiscountValue}%` : `${Number(c.DiscountValue).toLocaleString('vi-VN')}₫`,
            ExpiryDate: c.ExpiryDate
        }));
    }, [coupons, userVouchers]);

    const handleValidateCoupon = async (inputCode) => {
        const code = String(inputCode || couponCode || '');
        
        if (!code.trim()) {
            toast.warn("Vui lòng nhập mã giảm giá.");
            return;
        }
        
        dispatch(clearCoupon()); //
        try {
            const resultAction = await dispatch(validateCoupon({ code, total: subtotal })); //
            if (validateCoupon.fulfilled.match(resultAction)) {
                if (resultAction.payload.valid) {
                    const type = resultAction.payload.type;
                    const value = resultAction.payload.value;
                    const display = type === 'Percent' ? `${value}%` : `${Number(value).toLocaleString('vi-VN')}₫`;
                    toast.success(`Áp dụng mã thành công! Giảm ${display}`);
                } else {
                    toast.error(resultAction.payload.message || "Mã không hợp lệ.");
                }
            }
        } catch (err) {
            toast.error("Lỗi xác thực mã giảm giá.");
        }
    };

    const handleSelectCoupon = (coupon) => {
        setCouponCode(coupon.Code);
        setShowCouponModal(false);
        handleValidateCoupon(coupon.Code);
    };

    const handlePlaceOrder = async () => {
        // Part 1: Validations (this part is unchanged)
        if (!items.length) return toast.error("Giỏ hàng trống.");
        if (isUser && !selectedAddressId) return toast.error("Vui lòng chọn địa chỉ.");
        if (!isUser && !guestFormik.isValid) return toast.error("Vui lòng điền đầy đủ thông tin nhận hàng.");
        if (!shippingProviderId) return toast.error("Vui lòng chọn đơn vị vận chuyển.");
        if (!paymentMethod) return toast.error("Vui lòng chọn phương thức thanh toán.");

        // Part 2: Create a base payload with common fields
        let orderPayload = {
            items: items.map(it => ({
                variantId: it.variantId || it.VariantID || it.variant?.VariantID,
                quantity: it.quantity || it.Quantity,
                price: it.price || it.Price
            })),
            shippingProviderId,
            paymentMethod,
            couponCode: couponCode || null,
            shippingFee,
            totalAmount: grandTotal,
            source: location.state?.buyNowItems ? 'buy-now' : 'cart'
        };

        // Part 3: Add specific fields for either user or guest
        if (isUser) {
            orderPayload.shippingAddressId = selectedAddressId;
        } else {
            // For guests, add their form data
            const sessionId = localStorage.getItem("guest_session_id");
            Object.assign(orderPayload, guestFormik.values, { sessionId });
        }
        
        console.log('FINAL PAYLOAD TO SEND:', orderPayload);

        // Part 4: API call (this part is unchanged)
       try {
            const resultAction = await dispatch(placeOrder({ payload: orderPayload, isUser }));

            if (placeOrder.fulfilled.match(resultAction)) {
                const responseData = resultAction.payload;

                if (responseData.success) {
                    
                    if (isUser) {
                        dispatch(resetVoucherStatus());
                    }
            
                    if (responseData.code === '01' && responseData.paymentUrl) {
                        toast.info("Đang chuyển đến trang thanh toán an toàn...");
                        window.location.href = responseData.paymentUrl;
                    } else {
                        toast.success("Đặt hàng thành công!");
                        dispatch(clearCartLocal());
                        const orderId = responseData.orderId || responseData.guestOrderId;
                        navigate('/order-success', { state: { orderId: orderId } });
                    }
                } else {
                    toast.error(responseData.message || "Đặt hàng thất bại.");
                }
            } else {
                toast.error(resultAction.payload?.message || "Có lỗi xảy ra, vui lòng thử lại.");
            }
        } catch (err) {
            console.error('Place order error:', err);
            toast.error("Một lỗi không mong muốn đã xảy ra.");
        }
    };

    const openAddrModal = (addr = null) => {
        setEditingAddress(addr);
        addressFormik.setValues({
            fullName: addr?.FullName || user?.fullName || '',
            phone: addr?.Phone || user?.phone || '',
            email: addr?.Email || user?.email || '',
            street: addr?.Street || '',
            city: addr?.City || '',
            isDefault: addr?.IsDefault || false,
        });
        setAddrModalOpen(true);
    };
    
    if (status === 'loading') return <div className="text-center p-5"><Spinner /></div>;
    if (status === 'failed') return <Alert variant="danger">{error}</Alert>;
    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center gap-2 mb-3">
                <h2 className="mb-0">Thanh toán</h2>
                <Badge bg="light" text="dark" className="d-inline-flex align-items-center gap-1"><FaShieldAlt /> Bảo mật thông tin</Badge>
            </div>
            {orderStatus === 'failed' && <Alert variant="danger">{orderError}</Alert>}
            
            <Row className="g-4">
                <Col lg={7}>
                    <Card className="mb-3 shadow-sm">
                        <Card.Header as="h5" className="d-flex align-items-center gap-2"><FaMapMarkerAlt /> Thông tin nhận hàng</Card.Header>
                        <Card.Body>
                            {isUser ? (
                                <>
                                    {addresses.map(addr => (
                                        <AddressCard 
                                            key={addr.AddressID} 
                                            data={addr} 
                                            selected={selectedAddressId === addr.AddressID} 
                                            onSelect={() => setSelectedAddressId(addr.AddressID)} 
                                            onEdit={() => openAddrModal(addr)}
                                            onDelete={() => handleDeleteAddress(addr.AddressID)}
                                        />
                                    ))}
                                    <div className="mt-2">
                                        <Button variant="outline-primary" size="sm" onClick={() => openAddrModal(null)}>
                                            <FaPlus className="me-1" /> Thêm địa chỉ mới
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Form noValidate onSubmit={guestFormik.handleSubmit}>
                                    <Row>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ tên *</Form.Label><Form.Control name="fullName" {...guestFormik.getFieldProps('fullName')} isInvalid={guestFormik.touched.fullName && guestFormik.errors.fullName} /><Form.Control.Feedback type="invalid">{guestFormik.errors.fullName}</Form.Control.Feedback></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại *</Form.Label><Form.Control name="phone" {...guestFormik.getFieldProps('phone')} isInvalid={guestFormik.touched.phone && guestFormik.errors.phone} /><Form.Control.Feedback type="invalid">{guestFormik.errors.phone}</Form.Control.Feedback></Form.Group></Col>
                                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control name="email" type="email" {...guestFormik.getFieldProps('email')} isInvalid={guestFormik.touched.email && guestFormik.errors.email} /><Form.Control.Feedback type="invalid">{guestFormik.errors.email}</Form.Control.Feedback></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Địa chỉ *</Form.Label><Form.Control name="street" {...guestFormik.getFieldProps('street')} isInvalid={guestFormik.touched.street && guestFormik.errors.street} /><Form.Control.Feedback type="invalid">{guestFormik.errors.street}</Form.Control.Feedback></Form.Group></Col>
                                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Thành phố *</Form.Label><Form.Control name="city" {...guestFormik.getFieldProps('city')} isInvalid={guestFormik.touched.city && guestFormik.errors.city} /><Form.Control.Feedback type="invalid">{guestFormik.errors.city}</Form.Control.Feedback></Form.Group></Col>
                                    </Row>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="mb-3 shadow-sm">
                        <Card.Header as="h5" className="d-flex align-items-center gap-2"><FaTruck /> Đơn vị vận chuyển</Card.Header>
                        <Card.Body>
                            {providers.map(p => <Form.Check key={p.ProviderID} type="radio" name="provider" id={`provider-${p.ProviderID}`} label={`${p.Name} - ${(p.Fee || 0).toLocaleString('vi-VN')}₫`} checked={shippingProviderId === p.ProviderID} onChange={() => {setShippingProviderId(p.ProviderID); setShippingFee(p.Fee || 0);}} />)}
                        </Card.Body>
                    </Card>

                    <Card className="mb-3 shadow-sm">
                        <Card.Header as="h5" className="d-flex align-items-center gap-2"><FaMoneyBillWave /> Phương thức thanh toán</Card.Header>
                        <Card.Body>
                            {paymentMethods.map(pm => (
                                <Form.Check key={pm.MethodID} type="radio" label={pm.Name} name="paymentMethod" checked={paymentMethod === pm.Code} onChange={() => setPaymentMethod(pm.Code)} />
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="shadow-sm" style={{ position: "sticky", top: 16 }}>
                        <Card.Header as="h5">Đơn hàng ({items.length} sản phẩm)</Card.Header>
                        <Card.Body>
                            {items.map(it => {
                                const itemData = {
                                    key: it.variantId || it.CartItemID || it.variant?.VariantID,
                                    image: it.image || it.variant?.ProductImage,
                                    name: it.name || it.variant?.product?.Name,
                                    color: it.color || it.variant?.Color,
                                    size: it.size || it.variant?.Size,
                                    quantity: it.quantity || it.Quantity,
                                    price: it.price || it.Price
                                };
                                return (
                                    <div key={itemData.key} className="d-flex gap-2 mb-3">
                                        <Image src={normalizeImg(itemData.image)} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold">{itemData.name}</div>
                                            <small className="text-muted">Màu: {itemData.color} • Size: {itemData.size} • SL: {itemData.quantity}</small>
                                        </div>
                                        <div className="fw-medium">{(itemData.price * itemData.quantity).toLocaleString('vi-VN')}₫</div>
                                    </div>
                                );
                            })}
                            <hr />
                            <InputGroup className="mb-2">
                                <Form.Control placeholder="Nhập mã voucher…" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                               <Button onClick={() => handleValidateCoupon()} disabled={validatingCoupon}>
                                    {validatingCoupon ? <Spinner size="sm" /> : "Áp dụng"}
                                </Button>
                                <Button variant="outline-secondary" onClick={() => setShowCouponModal(true)}>Chọn mã</Button>
                            </InputGroup>
                            {couponNote && <div className="small text-muted mb-3">{couponNote}</div>}
                            <div className="d-flex justify-content-between mb-1"><span>Tạm tính</span><span>{subtotal.toLocaleString('vi-VN')}₫</span></div>
                            <div className="d-flex justify-content-between mb-1"><span>Giảm giá</span><span className="text-success">-{couponDiscount.toLocaleString('vi-VN')}₫</span></div>
                            <div className="d-flex justify-content-between mb-1"><span>Phí vận chuyển</span><span>{shippingFee.toLocaleString('vi-VN')}₫</span></div>
                            <div className="d-flex justify-content-between fw-bold h5 mt-2"><span>Tổng thanh toán</span><span className="text-primary">{grandTotal.toLocaleString('vi-VN')}₫</span></div>
                        </Card.Body>
                        <Card.Footer className="d-grid">
                            <Button size="lg" variant="success" onClick={handlePlaceOrder} disabled={orderStatus === 'loading' || !items.length}>
                                {orderStatus === 'loading' ? <Spinner size="sm" /> : "Đặt hàng ngay"}
                            </Button>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>

            {/* SỬA MODAL ĐỂ HIỂN THỊ CẢ VÍ VOUCHER VÀ COUPON CÔNG KHAI */}
            <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chọn mã giảm giá</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isUser && userVouchersStatus === 'loading' && <div className="text-center"><Spinner size="sm" /> Đang tải ví voucher...</div>}
                    
                    {availableCoupons.length === 0 ? (
                        <p>Không có mã giảm giá khả dụng.</p>
                    ) : (
                        <div className="list-group">
                            {availableCoupons.map(coupon => (
                                <div key={coupon.CouponID} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{coupon.Code}</strong>
                                        <small className="d-block text-muted">Giảm {coupon.DisplayDiscount} - HSD: {new Date(coupon.ExpiryDate).toLocaleDateString('vi-VN')}</small>
                                        {/* THÊM GHI CHÚ VOUCHER RIÊNG TƯ */}
                                        {!coupon.IsPublic && <small className="d-block text-success fw-semibold"> (Voucher của bạn)</small>}
                                    </div>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleSelectCoupon(coupon)}>
                                        Chọn
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
                
            <Modal show={addrModalOpen} onHide={() => setAddrModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={addressFormik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Họ và tên *</Form.Label>
                            <Form.Control name="fullName" {...addressFormik.getFieldProps('fullName')} isInvalid={addressFormik.touched.fullName && addressFormik.errors.fullName} />
                            <Form.Control.Feedback type="invalid">{addressFormik.errors.fullName}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại *</Form.Label>
                            <Form.Control name="phone" {...addressFormik.getFieldProps('phone')} isInvalid={addressFormik.touched.phone && addressFormik.errors.phone} />
                            <Form.Control.Feedback type="invalid">{addressFormik.errors.phone}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control name="email" type="email" {...addressFormik.getFieldProps('email')} isInvalid={addressFormik.touched.email && addressFormik.errors.email} />
                            <Form.Control.Feedback type="invalid">{addressFormik.errors.email}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ *</Form.Label>
                            <Form.Control name="street" {...addressFormik.getFieldProps('street')} isInvalid={addressFormik.touched.street && addressFormik.errors.street} />
                            <Form.Control.Feedback type="invalid">{addressFormik.errors.street}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Thành phố *</Form.Label>
                            <Form.Control name="city" {...addressFormik.getFieldProps('city')} isInvalid={addressFormik.touched.city && addressFormik.errors.city} />
                            <Form.Control.Feedback type="invalid">{addressFormik.errors.city}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Check type="switch" label="Đặt làm địa chỉ mặc định" name="isDefault" checked={addressFormik.values.isDefault} onChange={addressFormik.handleChange} />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setAddrModalOpen(false)}>Hủy</Button>
                    <Button variant="primary" onClick={() => addressFormik.handleSubmit()}>
                        {addressFormik.isSubmitting ? <Spinner size="sm" /> : "Lưu"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}