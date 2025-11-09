import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Table, Button, Form, Alert, Stack, Modal, Spinner } from "react-bootstrap";
import { toast } from 'react-toastify';
import { Image } from 'react-bootstrap';  // SỬA: Import Image nếu dùng (giả sử từ bootstrap)

// Import các thunks và selectors mới
import {
    fetchCart,
    updateCartItemQuantity,
    removeCartItem,
    addToCart,  // SỬA: Import addToCart cho update variant
    selectCartItems,
    selectCartStatus,
    selectCartError,
    selectCartTotalPrice,
    clearCartLocal  // SỬA: Import để clear sau checkout nếu cần
} from "../../redux/cartSlice";
import { getProductVariantsAPI } from '../../api';
import VariantPickerModal from "../../components/VariantPickerModal"; // Tách Modal

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER_IMG = `/placeholder.jpg`;

function Cart() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy state từ Redux store
    const cartItems = useSelector(selectCartItems);
    const cartStatus = useSelector(selectCartStatus);
    const cartError = useSelector(selectCartError);
    const totalAll = useSelector(selectCartTotalPrice);

    // State cục bộ cho UI
    const [selectedIds, setSelectedIds] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [updating, setUpdating] = useState(false);  // SỬA: Loading state cho update variant

    // Fetch giỏ hàng khi component mount
    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    // --- Handlers ---
    const handleUpdateQuantity = async (cartItemId, newQuantity, stock) => {
        if (newQuantity <= 0) return toast.warn("Số lượng phải lớn hơn 0.");
        if (stock && newQuantity > stock) return toast.warn(`Số lượng vượt quá tồn kho (${stock}).`);
        dispatch(updateCartItemQuantity({ cartItemId, quantity: newQuantity }));
    };

    const handleRemoveItem = (cartItemId) => {
        if(window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            dispatch(removeCartItem(cartItemId));
        }
    };

    const handleRemoveSelected = () => {
        if (!selectedIds.length) return toast.warn("Vui lòng chọn ít nhất 1 sản phẩm để xóa.");
        if(window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) {
            // Dispatch nhiều action xóa
            Promise.all(selectedIds.map(id => dispatch(removeCartItem(id))))
                .then(() => setSelectedIds([]));
        }
    };

    const handleCheckout = () => {
        if (!cartItems.length) return toast.error("Giỏ hàng trống.");
        const itemsToPay = selectedIds.length ? cartItems.filter(i => selectedIds.includes(i.CartItemID)) : cartItems;
        if (!itemsToPay.length) return toast.warn("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.");
        navigate("/checkout", { state: { selectedItems: itemsToPay } });
        // SỬA: Clear cart sau checkout (dispatch ở đây hoặc ở checkout success)
        // dispatch(clearCartLocal());  // Uncomment nếu clear ngay (nhưng tốt hơn clear sau place order ở backend)
    };

    // SỬA: Wrap với loading và better error handling để tránh race
    const handleUpdateVariant = async (oldItem, newVariant, quantity) => {
        if (updating) return;  // Prevent multiple calls
        setUpdating(true);
        try {
            // Remove old
            await dispatch(removeCartItem(oldItem.CartItemID)).unwrap();
            // Add new với quantity cũ
            await dispatch(addToCart({ variantId: newVariant.VariantID, quantity })).unwrap();
            toast.success("Đã cập nhật lựa chọn sản phẩm.");
        } catch (err) {
            toast.error(err.message || "Lỗi khi cập nhật sản phẩm.");
            // Rollback: Refetch cart nếu fail
            dispatch(fetchCart());
        } finally {
            setUpdating(false);
            setShowPicker(false);
        }
    };

    // --- Logic chọn item ---
    const toggleSelect = (cartItemId) => setSelectedIds(prev => prev.includes(cartItemId) ? prev.filter(id => id !== cartItemId) : [...prev, cartItemId]);
    const allChecked = cartItems.length > 0 && selectedIds.length === cartItems.length;
    const toggleSelectAll = () => setSelectedIds(allChecked ? [] : cartItems.map(i => i.CartItemID));

    const totalToShow = useMemo(() => {
        if (!selectedIds.length) return totalAll;
        return cartItems.filter(it => selectedIds.includes(it.CartItemID))
                       .reduce((sum, it) => sum + (it.Price * it.Quantity), 0);
    }, [cartItems, selectedIds, totalAll]);

    if (cartStatus === 'loading' && cartItems.length === 0) {
        return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }

    return (
        <div className="container mt-4">
            {cartStatus === 'failed' && cartError && <Alert variant="danger">{cartError}</Alert>}

            <Stack direction="horizontal" className="mb-3" gap={3} style={{ justifyContent: "space-between" }}>
                <h2 className="m-0">Giỏ hàng</h2>
                <Stack direction="horizontal" gap={2}>
                    <Form.Check type="checkbox" id="select-all" label="Chọn tất cả" checked={allChecked} onChange={toggleSelectAll} />
                    <Button variant="outline-danger" size="sm" onClick={handleRemoveSelected} disabled={!selectedIds.length}>Xóa đã chọn</Button>
                </Stack>
            </Stack>

            {!cartItems.length ? (
                <p>Giỏ hàng của bạn trống. <Link to="/products">Mua sắm ngay</Link></p>
            ) : (
                <>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th style={{ width: 60, textAlign: "center" }}><Form.Check type="checkbox" checked={allChecked} onChange={toggleSelectAll} /></th>
                                <th>Sản phẩm</th>
                                <th>Thuộc tính</th>
                                <th className="text-end">Giá</th>
                                <th style={{ width: 160 }} className="text-center">Số lượng</th>
                                <th className="text-end">Tổng</th>
                                <th style={{ width: 120 }} className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.CartItemID}>
                                    <td style={{ textAlign: "center", verticalAlign: 'middle' }}>
                                        <Form.Check type="checkbox" checked={selectedIds.includes(item.CartItemID)} onChange={() => toggleSelect(item.CartItemID)} />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <img src={`${API_BASE_URL}${item.variant.ProductImage}`} alt={item.variant.product.Name} style={{ width: 60, height: 60, objectFit: "cover" }} onError={(e) => e.target.src = PLACEHOLDER_IMG} />  {/* SỬA: Dùng <img> thay Image nếu không import */}
                                            <div>
                                                <Link to={`/product/${item.variant.ProductID}`} className="fw-semibold text-decoration-none text-dark">{item.variant.product.Name}</Link>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div><small>Màu: <strong>{item.variant.Color}</strong></small></div>
                                        <div><small>Size: <strong>{item.variant.Size}</strong></small></div>
                                        <Button variant="link" size="sm" className="p-0" onClick={() => { setEditingItem(item); setShowPicker(true); }} disabled={updating}>
                                            {updating ? <Spinner size="sm" /> : 'Thay đổi'}
                                        </Button>  {/* SỬA: Disable + spinner khi updating */}
                                    </td>
                                    <td className="text-end" style={{ verticalAlign: 'middle' }}>{item.Price.toLocaleString('vi-VN')}₫</td>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={item.Quantity}
                                            onChange={(e) => handleUpdateQuantity(item.CartItemID, parseInt(e.target.value) || 1, item.variant.StockQuantity)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td className="text-end" style={{ verticalAlign: 'middle' }}>{(item.Price * item.Quantity).toLocaleString('vi-VN')}₫</td>
                                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveItem(item.CartItemID)}>Xóa</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <Button variant="outline-secondary" onClick={() => navigate('/products')}>← Tiếp tục mua sắm</Button>
                        <div className="text-end">
                            <h4 className="mb-2">Tổng cộng: {totalToShow.toLocaleString('vi-VN')}₫</h4>
                            <Button variant="success" onClick={handleCheckout} disabled={updating}>Thanh toán</Button>
                        </div>
                    </div>
                </>
            )}
            
            {editingItem && (
                <VariantPickerModal
                    show={showPicker}
                    onHide={() => setShowPicker(false)}
                    product={{ ProductID: editingItem.variant.ProductID, Name: editingItem.variant.product.Name }}
                    action="update"
                    editingItem={editingItem}
                    onUpdateVariant={handleUpdateVariant}  // SỬA: Pass quantity từ editingItem
                    fetchVariantsApi={() => getProductVariantsAPI(editingItem.variant.ProductID)}
                />
            )}
        </div>
    );
}
export default Cart;