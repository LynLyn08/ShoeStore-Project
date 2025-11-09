import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, Button, Form, Badge, ListGroup, InputGroup, Tabs, Tab, Ratio, Modal, Spinner, Alert, Image, ProgressBar, Pagination } from "react-bootstrap";
import { FaStar, FaChevronLeft, FaChevronRight, FaHeart, FaUserCircle } from "react-icons/fa";
import { FiMinus, FiPlus, FiCheckCircle, FiShoppingCart, FiZap } from "react-icons/fi";
import { toast } from "react-toastify";
// Sửa imports (đã xóa các import thừa)
import {
    fetchProductAllData,
    toggleProductWishlist,
    clearProductDetail,
    fetchProductReviewsPage
} from "../../redux/productDetailSlice";
import { addToCart } from "../../redux/cartSlice";
// (Không cần import API review ở đây nữa)

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER = `/placeholder.jpg`;

const formatVND = (n) => (n == null ? "" : n.toLocaleString("vi-VN") + "₫");

// --- Component ProductCardItem (Giữ nguyên) ---
function ProductCardItem({ p }) {
    const navigate = useNavigate();
    const hasDiscount = p.DiscountPercent > 0;
    const finalPrice = Number(p.DiscountedPrice || p.Price) || 0;
    const imageUrl = p.DefaultImage ? `${API_BASE_URL}${p.DefaultImage}` : PLACEHOLDER;

    return (
        <Card className="h-100 shadow-sm" onClick={() => navigate(`/product/${p.ProductID}`)} style={{ cursor: 'pointer' }}>
            {hasDiscount && <Badge bg="danger" className="position-absolute top-0 end-0 m-2">-{p.DiscountPercent}%</Badge>}
            <Card.Img variant="top" src={imageUrl} style={{ aspectRatio: '4/3', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
            <Card.Body>
                <Card.Title as="h6" title={p.Name} className="text-truncate">{p.Name}</Card.Title>
                <div>
                    <span className="text-danger fw-bold me-2">{formatVND(finalPrice)}</span>
                    {hasDiscount && <del className="text-muted small">{formatVND(p.Price)}</del>}
                </div>
            </Card.Body>
        </Card>
    );
}

// --- Component Stars (Giữ nguyên) ---
function Stars({ value = 0, size = 16 }) {
    const v = Math.round(Number(value) || 0);
    return (
        <span aria-label={`rating ${v}/5`}>
            {[...Array(5)].map((_, i) => (
                <FaStar key={i} size={size} color={i < v ? "#FFD700" : "#ddd"} />
            ))}
        </span>
    );
}

// === COMPONENT CHÍNH ===
export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const carouselRef = useRef(null);

    // Sửa lại selector
    const { data, reviews, reviewStats, relatedProducts, wishlist, status, error } = useSelector((state) => state.productDetail);
    // (Đã xóa isAuthenticated)
    const { product, variants } = data || { product: null, variants: [] };

    // ... (State cũ) ...
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [qty, setQty] = useState(1);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    // (Đã xóa state 'canReview' và 'showReviewModal')

    useEffect(() => {
        if (id) {
            dispatch(fetchProductAllData(id));
        }
        return () => {
            dispatch(clearProductDetail());
        };
    }, [id, dispatch]);

    // (Đã xóa useEffect 'checkEligibility')

    // ... (useEffect cũ cho variants, giữ nguyên) ...
     useEffect(() => {
        if (status === 'succeeded' && variants.length > 0) {
            const firstVariant = variants.find(v => v.ImageURL) || variants[0];
            if(firstVariant) {
                setSelectedColor(firstVariant.Color);
                setSelectedSize(firstVariant.Size);
            }
        }
    }, [status, variants]);

    // ... (Các useMemo, giữ nguyên) ...
    const uniqueColors = useMemo(() => [...new Set(variants.map(v => v.Color))], [variants]);
    const uniqueSizes = useMemo(() => [...new Set(variants.map(v => v.Size))].sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true})), [variants]);
    const sizesByColor = useMemo(() => {
        return variants.reduce((acc, v) => {
            if (!acc[v.Color]) acc[v.Color] = new Set();
            acc[v.Color].add(v.Size);
            return acc;
        }, {});
    }, [variants]);
    const selectedVariant = useMemo(() => variants.find(v => v.Color === selectedColor && v.Size === selectedSize) || null, [variants, selectedColor, selectedSize]);
    const currentImage = useMemo(() => {
        const norm = (u) => u ? `${API_BASE_URL}${u}` : "";
        if (selectedVariant?.ImageURL) return norm(selectedVariant.ImageURL);
        const sameColorImg = variants.find(v => v.Color === selectedColor && v.ImageURL);
        if (sameColorImg) return norm(sameColorImg.ImageURL);
        if (product?.DefaultImage) return norm(product.DefaultImage);
        return PLACEHOLDER;
    }, [selectedVariant, selectedColor, variants, product]);
    const price = selectedVariant?.Price ?? product?.DiscountedPrice ?? 0;
    const oldPrice = product?.DiscountPercent > 0 ? Number(product?.Price || 0) : null;
    const inStock = selectedVariant?.StockQuantity > 0;
    const isLiked = wishlist.includes(Number(id));
    const listAllUrl = `/products?category=${product?.category?.key}`;


    // ... (Các Handlers, giữ nguyên) ...
    const handleColorChange = (color) => {
        setSelectedColor(color);
        const sizesForNewColor = Array.from(sizesByColor[color] || []);
        if (!sizesForNewColor.includes(selectedSize)) {
            setSelectedSize(sizesForNewColor[0] || "");
        }
    };
    const handleAddToCart = async () => {
        if (!selectedVariant || !inStock) return toast.warn("Vui lòng chọn biến thể còn hàng.");
        try {
            await dispatch(addToCart({ variantId: selectedVariant.VariantID, quantity: qty })).unwrap();
            toast.success(`Đã thêm ${product.Name} vào giỏ hàng!`);
        } catch (err) {
            toast.error(err.message || "Không thể thêm vào giỏ hàng.");
        }
    };
    const handleBuyNow = () => {
        if (!selectedVariant || !inStock) return toast.warn("Vui lòng chọn biến thể còn hàng.");
        const item = {
            CartItemID: `buyNow_${selectedVariant.VariantID}`, 
            VariantID: selectedVariant.VariantID,
            Quantity: qty,
            Price: price, 
            variant: {
                ProductID: product.ProductID,
                Size: selectedVariant.Size,
                Color: selectedVariant.Color,
                StockQuantity: selectedVariant.StockQuantity,
                ProductImage: currentImage.replace(API_BASE_URL, ''), 
                product: {
                    Name: product.Name,
                    Price: product.Price,
                    DiscountPercent: product.DiscountPercent
                }
            }
        };
        navigate("/checkout", { state: { selectedItems: [item] } });
    };
    const handleToggleWishlist = () => {
        dispatch(toggleProductWishlist(Number(id)));
    };
    const scroll = (offset) => carouselRef.current?.scrollBy({ left: offset, behavior: "smooth" });

    // Handler cho phân trang review (giữ lại)
    const handleReviewPageChange = (page) => {
        dispatch(fetchProductReviewsPage({ productId: id, page: page + 1 })); // react-paginate bắt đầu từ 0
    };


    // ... (Phần render loading, error, giữ nguyên) ...
    if (status === 'loading') {
        return <div className="text-center p-5"><Spinner animation="border" /> <span className="ms-2">Đang tải...</span></div>;
    }
    if (status === 'failed') {
        return <div className="container py-5"><Alert variant="danger">{error}</Alert></div>;
    }
    if (!product) return <div className="container py-5"><Alert variant="warning">Không tìm thấy sản phẩm.</Alert></div>;

    return (
        <div className="container py-4">
            {/* ... (Phần render chi tiết sản phẩm, Row, Col, Card, ... giữ nguyên) ... */}
            <Row className="g-4">
                <Col lg={6}>
                    <Card className="border-0 shadow-sm">
                        <div className="position-relative">
                            {product.DiscountPercent > 0 && <Badge bg="danger" className="position-absolute top-0 end-0 m-2 rounded-pill px-3 py-2">-{Number(product.DiscountPercent)}%</Badge>}
                            <Button variant="light" className="position-absolute top-0 start-0 m-2 rounded-circle shadow-sm" style={{ width: 42, height: 42, display: "grid", placeItems: "center" }} onClick={handleToggleWishlist} aria-label={isLiked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}>
                                <FaHeart size={18} color={isLiked ? "#e53935" : "#bbb"} />
                            </Button>
                            <Ratio aspectRatio="4x3">
                                <img src={currentImage} alt={product.Name} style={{ objectFit: "contain", width: "100%", height: "100%", background: "#fff" }} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} />
                            </Ratio>
                        </div>
                    </Card>
                </Col>
                <Col lg={6}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <Stars value={reviewStats.averageRating} size={16} />
                        <small className="text-muted">{reviewStats.averageRating ? `${reviewStats.averageRating.toFixed(1)}/5` : "Chưa có"} • {reviewStats.totalReviews} đánh giá</small>
                    </div>
                    <h2 className="fw-bold mb-1">{product.Name}</h2>
                    <div className="d-flex align-items-center gap-3 my-2">
                        <span className="fs-3 fw-bold text-danger">{formatVND(price)}</span>
                        {oldPrice && <del className="text-muted">{formatVND(oldPrice)}</del>}
                        {!inStock && <Badge bg="secondary">Hết hàng</Badge>}
                    </div>
                    <div className="mb-3">
                        <div className="fw-semibold mb-1">Màu sắc:</div>
                        {uniqueColors.map(c => <Button key={c} size="sm" variant={selectedColor === c ? "dark" : "outline-dark"} className="me-2 mb-2 rounded-pill" onClick={() => handleColorChange(c)}>{c}</Button>)}
                    </div>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="fw-semibold">Kích cỡ:</div>
                            <Button variant="link" size="sm" onClick={() => setShowSizeGuide(true)}>Hướng dẫn chọn size</Button>
                        </div>
                        {uniqueSizes.map(s => <Button key={s} size="sm" variant={selectedSize === s ? "primary" : "outline-primary"} className="me-2 mb-2 rounded-pill" onClick={() => (sizesByColor[selectedColor]?.has(s)) && setSelectedSize(s)} disabled={!sizesByColor[selectedColor]?.has(s)}>{s}</Button>)}
                        {selectedVariant && <div className="mt-1 small text-muted">Tồn kho: {selectedVariant.StockQuantity}</div>}
                    </div>
                    <div className="d-flex align-items-center mb-3">
                        <div className="fw-semibold me-3">Số lượng:</div>
                        <InputGroup style={{ width: 180 }}>
                            <Button variant="outline-secondary" onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></Button>
                            <Form.Control value={qty} readOnly className="text-center" />
                            <Button variant="outline-secondary" onClick={() => setQty(q => Math.min(selectedVariant?.StockQuantity || 99, q + 1))}><FiPlus /></Button>
                        </InputGroup>
                    </div>
                    <Row className="g-2 my-3">
                        <Col sm={6}><Button variant="primary" className="w-100 py-2 rounded-pill shadow-sm" onClick={handleAddToCart} disabled={!inStock}><FiShoppingCart className="me-2" /> Thêm vào giỏ</Button></Col>
                        <Col sm={6}><Button variant="danger" className="w-100 py-2 rounded-pill shadow-sm" onClick={handleBuyNow} disabled={!inStock}><FiZap className="me-2" /> Mua ngay</Button></Col>
                    </Row>
                    <Card className="border-0"><Card.Header className="bg-white fw-bold">TẠI SAO CHỌN LILY SHOES?</Card.Header><ListGroup variant="flush">{["Giao hàng toàn quốc", "Thanh toán khi nhận hàng", "Đổi trả miễn phí trong 7 ngày", "Bảo hành chính hãng 12 tháng"].map((t, i) => (<ListGroup.Item key={i} className="d-flex align-items-start"><FiCheckCircle className="me-2 text-success mt-1" /><span>{t}</span></ListGroup.Item>))}</ListGroup></Card>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <Tabs defaultActiveKey="desc" className="mb-3">
                                <Tab eventKey="desc" title="Mô tả">
                                    <div className="text-secondary" dangerouslySetInnerHTML={{ __html: product?.Description || "" }} />
                                </Tab>
                                <Tab eventKey="spec" title="Thông số">
                                    <ListGroup variant="flush">
                                        {product?.SKU && <ListGroup.Item><strong>Mã sản phẩm:</strong> {product.SKU}</ListGroup.Item>}
                                        <ListGroup.Item><strong>Màu sắc có sẵn:</strong> {uniqueColors.join(", ")}</ListGroup.Item>
                                        <ListGroup.Item><strong>Kích thước có sẵn:</strong> {uniqueSizes.join(", ")}</ListGroup.Item>
                                    </ListGroup>
                                </Tab>
                                
                                {/* === TAB ĐÁNH GIÁ (ĐÃ XÓA NÚT "VIẾT ĐÁNH GIÁ") === */}
                                <Tab eventKey="reviews" title={`Đánh giá (${reviewStats.totalReviews})`}>
                                    <Row>
                                        <Col md={4} className="border-end">
                                            <h5 className="mb-0">Tổng quan</h5>
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <span className="fs-1 fw-bold">{reviewStats.averageRating.toFixed(1)}</span>
                                                <div>
                                                    <Stars value={reviewStats.averageRating} size={20} />
                                                    <div className="text-muted small">{reviewStats.totalReviews} lượt đánh giá</div>
                                                </div>
                                            </div>
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = reviewStats.ratingSummary[star] || 0;
                                                const percent = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={star} className="d-flex align-items-center gap-2 mb-1">
                                                        <span className="text-muted small">{star} sao</span>
                                                        <ProgressBar variant="warning" now={percent} style={{ height: 10 }} className="flex-grow-1" />
                                                        <span className="text-muted small" style={{ width: 40, textAlign: 'right' }}>{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </Col>
                                        <Col md={8}>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="mb-0">Khách hàng đánh giá ({reviewStats.totalReviews})</h5>
                                                {/* (ĐÃ XÓA NÚT "VIẾT ĐÁNH GIÁ" Ở ĐÂY) */}
                                            </div>
                                            
                                            {reviews.length > 0 ? (
                                                <>
                                                    {reviews.map((r) => (
                                                        <div key={r.ReviewID} className="border-bottom mb-3 pb-3">
                                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                                {r.user?.AvatarURL ? (
                                                                    <Image src={r.user.AvatarURL} roundedCircle style={{ width: 40, height: 40, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <FaUserCircle size={40} className="text-muted" />
                                                                )}
                                                                <div>
                                                                    <div className="fw-semibold">{r.user?.FullName || 'Người dùng'}</div>
                                                                    <div className="small text-muted">{new Date(r.CreatedAt).toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                            <div className="mb-2"><Stars value={r.Rating} size={14} /></div>
                                                            <p className="text-secondary mb-2">{r.Comment}</p>
                                                            {r.media && r.media.length > 0 && (
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    {r.media.map(m => (
                                                                        m.IsVideo ? (
                                                                            <video key={m.MediaURL} src={m.MediaURL} controls style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} />
                                                                        ) : (
                                                                            <Image key={m.MediaURL} src={m.MediaURL} style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} />
                                                                        )
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {reviewStats.totalPages > 1 && (
                                                        <Pagination size="sm" className="justify-content-center">
                                                            {[...Array(reviewStats.totalPages).keys()].map(page => (
                                                                <Pagination.Item
                                                                    key={page + 1}
                                                                    active={page + 1 === reviewStats.page}
                                                                    onClick={() => handleReviewPageChange(page)}
                                                                >
                                                                    {page + 1}
                                                                </Pagination.Item>
                                                            ))}
                                                        </Pagination>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này.</p>
                                            )}
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ... (Phần Sản phẩm tương tự, giữ nguyên) ... */}
            <section className="mt-5">
                <div className="d-flex align-items-center justify-content-between mb-3"><h4 className="fw-bold mb-0">SẢN PHẨM TƯƠNG TỰ</h4><Button as={Link} to={listAllUrl} variant="outline-primary" size="sm">Xem tất cả</Button></div>
                {relatedProducts.length > 0 && (
                    <div className="position-relative">
                        <Button variant="light" className="position-absolute top-50 start-0 translate-middle-y z-1 shadow-sm rounded-circle p-2" onClick={() => scroll(-300)} style={{ left: -20 }} aria-label="Cuộn trái"><FaChevronLeft /></Button>
                        <Row className="g-4 flex-nowrap overflow-auto pb-3" ref={carouselRef} style={{ scrollSnapType: "x mandatory" }}>
                            {relatedProducts.map(p => (<Col key={p.ProductID} xs={6} md={4} lg={3} className="flex-shrink-0" style={{ minWidth: 250 }}><ProductCardItem p={p} /></Col>))}
                        </Row>
                        <Button variant="light" className="position-absolute top-50 end-0 translate-middle-y z-1 shadow-sm rounded-circle p-2" onClick={() => scroll(300)} style={{ right: -20 }} aria-label="Cuộn phải"><FaChevronRight /></Button>
                    </div>
                )}
            </section>

            {/* ... (Modal Size Guide, giữ nguyên) ... */}
            <Modal show={showSizeGuide} onHide={() => setShowSizeGuide(false)} centered>
                <Modal.Header closeButton><Modal.Title>Hướng dẫn chọn size</Modal.Title></Modal.Header>
                <Modal.Body><img src={`${process.env.PUBLIC_URL}/images/lilysize.jpg`} alt="Hướng dẫn size" style={{ width: "100%" }} /></Modal.Body>
            </Modal>

            {/* (ĐÃ XÓA REVIEW MODAL KHỎI ĐÂY) */}
        </div>
    );
}