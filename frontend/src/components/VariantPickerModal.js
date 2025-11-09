import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, InputGroup, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER_IMG = `/placeholder.jpg`;

// Component nút chọn (Màu/Size)
function Pill({ active, disabled, children, onClick }) {
    return (
        <Button variant={active ? "primary" : "outline-primary"} className="rounded-pill me-2 mb-2" size="sm" disabled={disabled} onClick={onClick} style={{ minWidth: 44 }}>
            {children}
        </Button>
    );
}

export default function VariantPickerModal({ show, onHide, product, action, onAddToCart, onBuyNow, editingItem, onUpdateVariant, fetchVariantsApi }) {
    const [loading, setLoading] = useState(true);
    const [variants, setVariants] = useState([]);  // Luôn init là array rỗng
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [selColor, setSelColor] = useState("");
    const [selSize, setSelSize] = useState("");
    const [selVariant, setSelVariant] = useState(null);
    const [qty, setQty] = useState(1);
    const [notice, setNotice] = useState("");

   useEffect(() => {
    if (show && (product || editingItem)) {
        const loadVariants = async () => {
            setLoading(true);
            setNotice("");
            try {
                // SỬA: Destructure response.data để lấy array thực (không phải full response object)
                const { data } = await fetchVariantsApi();  // <<< THÊM DÒNG NÀY (thay cho const data = await...)
                
                // Validate data là array trước khi set
                if (!Array.isArray(data)) {
                    throw new Error("Dữ liệu biến thể không hợp lệ (không phải mảng).");
                }
                setVariants(data);

                const colorSet = [...new Set(data.map(v => v.Color))];
                setColors(colorSet);

                if (colorSet.length > 0) {
                    let initialColor = colorSet[0];
                    let initialSize = '';
                    
                    if (action === 'update' && editingItem) {
                        initialColor = editingItem.variant.Color;
                        initialSize = editingItem.variant.Size;
                        setQty(editingItem.Quantity);
                    } else {
                        setQty(1);
                    }

                    const sizesForColor = [...new Set(data.filter(v => v.Color === initialColor).map(v => v.Size))];
                    setSizes(sizesForColor);

                    if (!sizesForColor.includes(initialSize)) {
                        initialSize = sizesForColor[0] || '';
                    }
                    
                    onChooseColor(initialColor, initialSize, data);
                } else {
                    setNotice("Sản phẩm này không có biến thể nào.");
                }
            } catch (error) {
                console.error("Load variants error:", error);
                toast.error("Không thể tải thông tin biến thể: " + (error.message || "Lỗi không xác định."));
                onHide();
            } finally {
                setLoading(false);
            }
        };
        loadVariants();
    }
}, [show, product, editingItem, action, fetchVariantsApi]);
    // Helper: Đảm bảo variants luôn là array (fallback nếu undefined)
    const safeVariants = Array.isArray(variants) ? variants : [];

    const onChooseColor = (color, initialSize = null, currentVariants = safeVariants) => {
        setSelColor(color);
        const availableSizes = [...new Set(currentVariants.filter(v => v.Color === color).map(v => v.Size))];
        setSizes(availableSizes);

        const sizeToSet = initialSize !== null ? initialSize : (availableSizes.includes(selSize) ? selSize : availableSizes[0] || "");
        onChooseSize(sizeToSet, color, currentVariants);
    };

    const onChooseSize = (size, color = selColor, currentVariants = safeVariants) => {
        setSelSize(size);
        const variant = currentVariants.find(v => v.Color === color && v.Size === size) || null;
        setSelVariant(variant);
        setNotice("");
    };

    const handleConfirm = () => {
        if (!selVariant) return setNotice("Vui lòng chọn đầy đủ màu sắc và kích cỡ.");
        if (selVariant.StockQuantity < qty) return setNotice(`Số lượng tồn kho không đủ (còn ${selVariant.StockQuantity}).`);

        if (action === 'add') {
            onAddToCart(selVariant, qty);
        } else if (action === 'buy') {
            onBuyNow(selVariant, qty, product);
        } else if (action === 'update') {
            onUpdateVariant(editingItem, selVariant, qty);
        }
    };

    // SỬA: Thêm safety check cho variants
    const getImageForSelection = () => {
        const currentProduct = product || editingItem?.variant?.product;
        if (!Array.isArray(variants)) {
            console.warn("Variants not array, using placeholder");  // Log để debug
            return PLACEHOLDER_IMG;
        }
        if (selVariant?.ImageURL) return `${API_BASE_URL}${selVariant.ImageURL}`;
        const sameColorVariant = variants.find(v => v.Color === selColor && v.ImageURL);
        if (sameColorVariant) return `${API_BASE_URL}${sameColorVariant.ImageURL}`;
        if (currentProduct?.DefaultImage) return `${API_BASE_URL}${currentProduct.DefaultImage}`;
        return PLACEHOLDER_IMG;
    };

    const renderButtonText = () => {
        if (action === 'add') return 'Thêm vào giỏ';
        if (action === 'buy') return 'Mua ngay';
        if (action === 'update') return 'Cập nhật';
        return 'Xác nhận';
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{product?.Name || editingItem?.variant.product.Name || "Chọn biến thể"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center p-4"><Spinner /></div>
                ) : (
                    <>
                        <div className="d-flex gap-3 mb-3">
                            <img src={getImageForSelection()} alt={product?.Name || editingItem?.variant.product.Name} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }}/>
                            <div>
                                <div className="fw-bold">{product?.Name || editingItem?.variant.product.Name}</div>
                                <div className="text-danger fw-bold mt-1">{(selVariant?.Price || 0).toLocaleString('vi-VN')}₫</div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="fw-semibold mb-2">Màu sắc:</div>
                            {colors.map(c => <Pill key={c} active={c === selColor} onClick={() => onChooseColor(c)}>{c}</Pill>)}
                        </div>
                        <div className="mb-3">
                            <div className="fw-semibold mb-2">Kích cỡ:</div>
                            {sizes.map(s => {
                                const v = safeVariants.find(va => va.Color === selColor && va.Size === s);  // SỬA: Dùng safeVariants
                                const isDisabled = !v || v.StockQuantity <= 0;
                                return <Pill key={s} active={s === selSize} disabled={isDisabled} onClick={() => onChooseSize(s)}>{s}</Pill>
                            })}
                        </div>
                        {selVariant && <div className="text-muted mb-2">Tồn kho: {selVariant.StockQuantity}</div>}
                        <div className="mb-2">
                             <div className="fw-semibold mb-2">Số lượng:</div>
                             <InputGroup style={{ maxWidth: 150 }}>
                                 <Button variant="outline-secondary" onClick={() => setQty(q => Math.max(1, q - 1))}>-</Button>
                                 <Form.Control value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" />
                                 <Button variant="outline-secondary" onClick={() => setQty(q => Math.min(selVariant?.StockQuantity || 99, q + 1))}>+</Button>  
                             </InputGroup>
                        </div>
                        {notice && <Alert variant="warning" className="mt-3 py-2">{notice}</Alert>}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Hủy</Button>
                {/* THAY ĐỔI 2: Cập nhật văn bản và logic nút xác nhận */}
                <Button variant={action === 'buy' ? 'danger' : 'primary'} onClick={handleConfirm} disabled={!selVariant || loading}>
                    {renderButtonText()}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}