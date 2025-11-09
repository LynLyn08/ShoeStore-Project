import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Carousel, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from 'react-toastify';
import { fetchHomeData } from '../../redux/homeSlice';
import { addToCart } from '../../redux/cartSlice'; 
import { getProductVariantsAPI } from '../../api';
import VariantPickerModal from "../../components/VariantPickerModal";

// THÊM CÁC HẰNG SỐ CÒN THIẾU
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER_IMG = `/placeholder.jpg`;
const PLACEHOLDER_BLOG = `/blog-placeholder.jpg`; // Thêm placeholder cho blog
const API = API_BASE_URL; // Thêm biến API

// Thêm hàm còn thiếu
const getLocalBlogImagePath = (blog) => {
    // Logic này có thể tùy chỉnh, ở đây ta giả định không có local path
    return null; 
};

export default function Home() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { products, blogs, status, error } = useSelector((state) => state.home);
    
    const [showPicker, setShowPicker] = useState(false);
    const [pickerProduct, setPickerProduct] = useState(null);
    const [pickerAction, setPickerAction] = useState('add');

    useEffect(() => {
        dispatch(fetchHomeData());
    }, [dispatch]);

    const handleOpenPicker = (product, action) => {
        setPickerProduct(product);
        setPickerAction(action);
        setShowPicker(true);
    };

    const handleAddToCart = async (variant, quantity) => {
        try {
            await dispatch(addToCart({ variantId: variant.VariantID, quantity })).unwrap();
            toast.success("Đã thêm vào giỏ hàng!");
            setShowPicker(false);
        } catch (err) {
            toast.error(err.message || "Không thể thêm vào giỏ hàng.");
        }
    };
    
    const handleBuyNow = (variant, quantity, product) => {
        const item = {
            variantId: variant.VariantID,
            productId: product.ProductID,
            name: product.Name,
            image: variant.ImageURL ? `${API_BASE_URL}${variant.ImageURL}` : `${API_BASE_URL}${product.DefaultImage}`,
            color: variant.Color,
            size: variant.Size,
            price: variant.Price,
            quantity: quantity,
            stock: variant.StockQuantity,
        };
        setShowPicker(false);
        navigate("/checkout", { state: { buyNowItems: [item] } });
    };

    const banners = [
        { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80", title: "New Season Arrivals", subtitle: "Discover latest sneaker trends" },
        { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80", title: "Comfort & Style", subtitle: "Engineered for all-day comfort" },
    ];
    const FEATURED_CATEGORIES = [
        { key: "sneaker", label: "Sneaker", img: `${API_BASE_URL}/uploads/SNEAKER/UNISEX/sneaker10trang.jpg` },
        { key: "sandal", label: "Sandal", img: `${API_BASE_URL}/uploads/SANDAL/WOMEN/sandal2den.jpg` },
        { key: "office", label: "Công sở", img: `${API_BASE_URL}/uploads/OFFICE/MEN/office1den.jpg` },
        { key: "sport", label: "Thể thao", img: `${API_BASE_URL}/uploads/SPORT/MEN/sport10trang.jpg` },
    ];

    if (status === 'loading') {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}><Spinner animation="border" /></div>;
    }

    if (status === 'failed') {
        return <Alert variant="danger" className="m-3">{error}</Alert>;
    }

    return (
        <div className="home">
            <style>{`
                .home { background:#fff; color:#212529; }
                .banner-img { max-height: 380px; object-fit: cover; }
                @media (max-width: 768px){ .banner-img { max-height: 250px; } }
                .section{ margin-top:40px; }
                .section-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px; }
                .section-title{ font-weight:800; letter-spacing:.2px; }
                .section-sub{ color:#6c757d; margin:0; }
                .product-card{ border:none; border-radius:16px; overflow:hidden; box-shadow:0 10px 24px rgba(0,0,0,.06); transition:transform .25s ease, box-shadow .25s ease; position:relative; }
                .product-card:hover{ transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.10); }
                .pc-thumb{ position:relative; aspect-ratio:4/3; background:#f7f7f7; cursor:pointer; }
                .pc-thumb img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .35s ease; }
                .product-card:hover .pc-thumb img{ transform:scale(1.04); }
                .pc-badge{ position:absolute; top:10px; left:10px; border-radius:999px; padding:6px 10px; font-weight:700; }
                .pc-overlay{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,.45); opacity:0; visibility:hidden; transition:opacity .2s ease; }
                .product-card:hover .pc-overlay{ opacity:1; visibility:visible; }
                .pc-ov-actions{ display:flex; gap:10px; }
                .pc-ov-actions .btn{ min-width:132px; font-weight:700; }
                .pc-cat{ color:#9aa0a6; font-size:12px; text-transform:uppercase; letter-spacing:.6px; }
                .pc-name{ font-size:16px; margin:4px 0 8px; font-weight:700; }
                .pc-price{ font-weight:800; color:#dc3545; }
                .pc-origin{ color:#a0a0a0; text-decoration:line-through; font-size:13px; }
                .commit-wrap { background:#fff7fa; border-radius:20px; padding:22px 18px; box-shadow:0 10px 28px rgba(199,24,87,.08); }
                .commit-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
                .commit-col { display:flex; gap:14px; align-items:flex-start; padding:10px 14px; position:relative; }
                @media (max-width: 992px){ .commit-grid{ grid-template-columns: repeat(2,1fr);} }
                @media (max-width: 576px){ .commit-grid{ grid-template-columns: 1fr;} }
            `}</style>
            {/* 1) BANNER */}
            <section>
                <Carousel fade className="home-carousel">{banners.map((b, idx) => (
                    <Carousel.Item key={idx}>
                        <img className="d-block w-100 banner-img" src={b.src} alt={`banner-${idx}`} />
                        <Carousel.Caption><h2>{b.title}</h2><p>{b.subtitle}</p><Button as={Link} to="/products" variant="light" size="sm">Khám phá ngay</Button></Carousel.Caption>
                    </Carousel.Item>
                ))}</Carousel>
            </section>

            <Container>
               {/* 2) DANH MỤC NỔI BẬT */}
                <section className="section">
                    <div className="section-head">
                        <div><h2 className="section-title">Danh mục nổi bật</h2><p className="section-sub">Khám phá các dòng sản phẩm chính của chúng tôi.</p></div>
                        <Button as={Link} to="/products" variant="outline-dark" className="rounded-pill">Tất cả sản phẩm</Button>
                    </div>
                    <div className="d-flex flex-wrap gap-3 mb-2">{FEATURED_CATEGORIES.map(c => (
                        <Button key={c.key} variant="light" onClick={() => navigate(`/products?category=${c.key}`)} title={c.label} style={{ width: 110, height: 110, borderRadius: "50%", overflow: "hidden", border: "2px solid #eee", position: "relative" }}>
                            <img src={c.img} alt={c.label} onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <span style={{ position: "absolute", left: 8, right: 8, bottom: 8, background: "rgba(255,255,255,.92)", borderRadius: 999, padding: "3px 8px", fontSize: 12, fontWeight: 700 }}>{c.label}</span>
                        </Button>
                    ))}</div>
                </section>
                {/* 3) SẢN PHẨM MỚI NHẤT */}
                <section className="section">
                    <div className="section-head">
                        <div><h2 className="section-title">Sản phẩm mới</h2><p className="section-sub">Hàng mới cập bến – cập nhật liên tục.</p></div>
                        <Button as={Link} to="/products" variant="outline-dark" className="rounded-pill">Xem tất cả</Button>
                    </div>
                    <Row className="g-4">
                        {products.map((p) => {
                            const finalPrice = Number(p.DiscountedPrice || p.Price) || 0;
                            return (
                                <Col key={p.ProductID} xs={12} sm={6} md={4} lg={3}>
                                    <Card className="product-card h-100">
                                        <div className="pc-thumb" onClick={() => navigate(`/product/${p.ProductID}`)}>
                                            <img src={`${API_BASE_URL}${p.DefaultImage}`} alt={p.Name} onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
                                            {p.DiscountPercent > 0 && <Badge bg="danger" className="pc-badge">-{p.DiscountPercent}%</Badge>}
                                            <div className="pc-overlay">
                                                <div className="pc-ov-actions">
                                                    <Button variant="dark" onClick={(e) => { e.stopPropagation(); handleOpenPicker(p, 'add'); }}>Thêm vào giỏ</Button>
                                                    <Button variant="danger" onClick={(e) => { e.stopPropagation(); handleOpenPicker(p, 'buy'); }}>Mua ngay</Button>
                                                </div>
                                            </div>
                                        </div>
                                        <Card.Body>
                                            <div className="pc-cat">{p.category?.CategoryName || "Sản phẩm"}</div>
                                            <Card.Title as="h6" className="pc-name text-truncate">{p.Name}</Card.Title>
                                            <div className="d-flex align-items-end gap-2">
                                                <span className="pc-price">{finalPrice.toLocaleString('vi-VN')}₫</span>
                                                {p.DiscountPercent > 0 && <del className="pc-origin">{Number(p.Price).toLocaleString('vi-VN')}₫</del>}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </section>

              {/* 4) CAM KẾT */}
              <section className="section">
                <div className="commit-wrap">
                  <div className="commit-grid">
                    <div className="commit-col">
                      <div>✔️</div>
                      <div>
                        <h6 className="m-0 fw-bold">Chính hãng 100%</h6>
                        <div className="text-muted">Nguồn gốc minh bạch</div>
                      </div>
                    </div>
                    <div className="commit-col">
                      <div>🔄</div>
                      <div>
                        <h6 className="m-0 fw-bold">Đổi trả 7 ngày</h6>
                        <div className="text-muted">Miễn phí đổi size/lỗi NSX</div>
                      </div>
                    </div>
                    <div className="commit-col">
                      <div>🛠️</div>
                      <div>
                        <h6 className="m-0 fw-bold">Bảo hành 12 tháng</h6>
                        <div className="text-muted">Keo – chỉ – phụ kiện</div>
                      </div>
                    </div>
                    <div className="commit-col">
                      <div>🚚</div>
                      <div>
                        <h6 className="m-0 fw-bold">Freeship</h6>
                        <div className="text-muted">Đơn từ 499.000đ</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              {/* 5) BLOG */}
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Tin tức & Xu hướng</h2>
                    <p className="section-sub">Bài viết mới nhất từ Shoe Store</p>
                  </div>
                </div>
                <Row className="g-4 mt-2">
                  {blogs.map((blog) => {
                    const localPath = getLocalBlogImagePath(blog);
                    const fallbackNetwork = blog?.ImageURL?.startsWith("/")
                      ? `${API}${blog.ImageURL}`
                      : blog?.ImageURL || PLACEHOLDER_BLOG;
                    return (
                      <Col key={blog.BlogID || blog.Title} md={4}>
                        <Card className="h-100">
                          <div style={{ aspectRatio: "16/9", background: "#f2f2f2", overflow: 'hidden' }}>
                            <img
                              src={fallbackNetwork}
                              alt={blog.Title}
                              onError={(e) => { e.currentTarget.src = PLACEHOLDER_BLOG; }}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <Card.Body className="d-flex flex-column">
                            <small className="text-muted">{blog?.CreatedAt ? new Date(blog.CreatedAt).toLocaleDateString() : ""}</small>
                            <Card.Title className="fw-bold mt-1">{blog.Title}</Card.Title>
                            <Card.Text className="text-muted small">{blog.Excerpt}…</Card.Text>
                            <div className="mt-auto">
                              <Button
                                as={Link}
                                to={`/blog/${blog.BlogID}`}
                                variant="outline-secondary"
                                size="sm"
                                className="rounded-pill"
                              >
                                Đọc tiếp
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </section>
            </Container>
            {pickerProduct && (
                <VariantPickerModal
                    show={showPicker}
                    onHide={() => setShowPicker(false)}
                    product={pickerProduct}
                    action={pickerAction}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    fetchVariantsApi={() => getProductVariantsAPI(pickerProduct.ProductID)}
                />
            )}
        </div>
    );
}