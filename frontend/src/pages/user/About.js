import React from 'react';
import { Container, Row, Col, Card, Badge, Image, Button, Carousel, Accordion } from 'react-bootstrap';
import { FiAward, FiTruck, FiCheckCircle, FiShield, FiRotateCcw, FiPhoneCall } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

// =======================================================
// ===               CONSTANTS & HELPERS               ===
// =======================================================

// --- Hằng số hình ảnh ---
const HERO_IMG = '/images/lily-shop-hero.jpg';
const GALLERY_IMG = '/images/lily-shop-gallery.jpg';
const FALLBACK_DATA_URI = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ccc">Image Not Found</text></svg>`);

// --- Dữ liệu tĩnh ---
const TESTIMONIALS = [
    { name:'Minh Trang, Hà Nội', quote:'Showroom sang trọng, giày đi êm và bền. Đổi size nhanh – dịch vụ quá ổn.' },
    { name:'Quốc Huy, TP.HCM', quote:'Thiết kế tối giản nhưng tinh tế, lên chân đẹp. Da mềm, hoàn thiện rất kỹ.' },
    { name:'Thu Phương, Đà Nẵng', quote:'Mua 3 đôi rồi vẫn hài lòng. Phối đồ đi làm hay đi chơi đều rất ổn.' },
];

const FAQS = [
    { k:'0', q:'Chính sách đổi trả sản phẩm như thế nào?', a:'Bạn có thể đổi size hoặc đổi mẫu trong 7 ngày kể từ ngày nhận hàng, sản phẩm còn tem mác & chưa qua sử dụng.' },
    { k:'1', q:'Sản phẩm của Lily có được bảo hành không?', a:'Bảo hành keo & chỉ 6 tháng. Hỗ trợ sửa chữa trọn đời với mức phí ưu đãi.' },
    { k:'2', q:'Làm sao để chọn đúng size giày Lily?', a:'Tham khảo bảng size theo chiều dài bàn chân (cm). Tư vấn viên sẵn sàng hỗ trợ.' },
];

// =======================================================
// ===          COMPONENT CON (TRONG CÙNG FILE)        ===
// =======================================================

const Stars = () => (
    <div className="mb-2">
        {[...Array(5)].map((_, i) => (<FaStar key={i} color="#FFD700" size={18} style={{ marginRight: 3 }} />))}
    </div>
);

const LogoA = ({ h = 32 }) => ( <svg height={h} viewBox="0 0 160 40" role="img"><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stopColor="#b08a38" /><stop offset="1" stopColor="#d4af37" /></linearGradient></defs><rect rx="6" width="60" height="36" y="2" fill="url(#g1)" /><text x="32" y="26" textAnchor="middle" fontSize="16" fill="#fff" fontWeight="700">LS</text><text x="70" y="26" fontSize="16" fill="#444" fontWeight="600">Logistics</text></svg> );
const LogoB = ({ h = 32 }) => ( <svg height={h} viewBox="0 0 160 40" role="img"><circle cx="20" cy="20" r="16" fill="#444" /><circle cx="20" cy="20" r="12" fill="#f0e6cc" /><circle cx="20" cy="20" r="8" fill="#444" /><text x="44" y="26" fontSize="16" fill="#444" fontWeight="600">Retail Group</text></svg> );
const LogoC = ({ h = 32 }) => ( <svg height={h} viewBox="0 0 160 40" role="img"><rect x="4" y="8" width="52" height="24" rx="12" fill="#444" /><rect x="10" y="12" width="40" height="16" rx="8" fill="#f0e6cc" /><text x="76" y="26" fontSize="16" fill="#444" fontWeight="600">Fashion Co</text></svg> );
const LogoD = ({ h = 32 }) => ( <svg height={h} viewBox="0 0 160 40" role="img"><polygon points="8,32 24,8 40,32" fill="#444" /><rect x="46" y="10" width="4" height="20" fill="#444" /><text x="56" y="26" fontSize="16" fill="#444" fontWeight="600">Supply Hub</text></svg> );


// =======================================================
// ===              COMPONENT CHÍNH (ABOUT)            ===
// =======================================================

export default function About() {
    const onImgError = (e) => { e.currentTarget.src = FALLBACK_DATA_URI; };

    return (
        <>
            {/* ====== HERO SECTION ====== */}
            <section className="py-5 position-relative" style={{ background: 'linear-gradient(135deg, #f0e6cc 0%, #ffffff 100%)' }}>
                <div aria-hidden="true" style={{ position: 'absolute', right: -140, top: -140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ffd700, #f0e6cc 60%)', filter: 'blur(8px)', opacity: .5 }}/>
                <Container>
                    <Row className="align-items-center g-4">
                        <Col lg={6}>
                            <Button className="mb-3 px-4 py-2 fw-semibold" style={{ background:'#000', color:'#fff', border:'none', borderRadius:999, letterSpacing:'1px' }}>LILY SHOES</Button>
                            <h1 className="fw-bold mb-3" style={{letterSpacing:'0.5px', color:'#333', fontSize:'3rem'}}>Nâng tầm phong cách <br/>với giày da cao cấp</h1>
                            <p className="text-secondary fs-5 mb-4" style={{color:'#555'}}>Tinh gọn – êm ái – bền bỉ. Nghệ thuật thủ công gặp gỡ thiết kế hiện đại, mang đến vẻ đẹp tinh tế cho mỗi bước chân.</p>
                            <div className="d-flex flex-wrap gap-3">
                                <Button as="a" href="/products" style={{backgroundColor:'#d4af37', borderColor:'#d4af37', color:'#111'}} className="px-4 py-2 fw-bold shadow-sm">Khám phá bộ sưu tập</Button>
                                <Button as="a" href="/contact" variant="outline" className="px-4 py-2 fw-bold" style={{borderColor:'#d4af37', color:'#d4af37'}}>Liên hệ cửa hàng</Button>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <Card className="border-0 shadow-lg overflow-hidden" style={{borderTop:'5px solid #d4af37', borderRadius:10}}>
                                <Image src={HERO_IMG} alt="Không gian Shop Lily" fluid onError={onImgError} style={{objectFit:'cover', height: 420, width:'100%'}} />
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* ====== MISSION SECTION ====== */}
            <section className="py-5 bg-light">
                <Container>
                    <Row className="mb-4 justify-content-between align-items-center">
                        <Col lg={7}><h2 className="fw-bold mb-2">Về Lily Shoes</h2><p className="text-muted mb-0 fs-5">Tôn vinh vẻ đẹp Việt qua từng thiết kế tinh xảo.</p></Col>
                        <Col lg="auto" className="d-none d-lg-block"><Badge bg="warning" text="dark" className="border-0 px-3 py-2 fw-normal">Thành lập 2018 · 150.000+ khách hàng</Badge></Col>
                    </Row>
                    <Row className="g-4">
                        <Col md={4}><Card className="h-100 shadow-sm border-0"><Card.Body><div className="d-flex align-items-center mb-3"><FiCheckCircle className="me-3" size={28} color="#d4af37" /><h5 className="fw-bold mb-0">Sứ mệnh</h5></div><p className="mb-0 text-secondary">Kiến tạo những đôi giày cao cấp, mang lại sự tự tin và thoải mái tối đa cho khách hàng Việt.</p></Card.Body></Card></Col>
                        <Col md={4}><Card className="h-100 shadow-sm border-0"><Card.Body><div className="d-flex align-items-center mb-3"><FiAward className="me-3" size={28} color="#d4af37" /><h5 className="fw-bold mb-0">Tầm nhìn</h5></div><p className="mb-0 text-secondary">Trở thành thương hiệu giày da được yêu thích hàng đầu tại Việt Nam về thiết kế & dịch vụ.</p></Card.Body></Card></Col>
                        <Col md={4}><Card className="h-100 shadow-sm border-0"><Card.Body><div className="d-flex align-items-center mb-3"><FiShield className="me-3" size={28} color="#d4af37" /><h5 className="fw-bold mb-0">Giá trị cốt lõi</h5></div><ul className="mb-0 text-secondary ps-3"><li>Chất liệu cao cấp</li><li>Thiết kế tối giản</li><li>Lấy khách hàng làm trung tâm</li></ul></Card.Body></Card></Col>
                    </Row>
                </Container>
            </section>

            {/* ====== STATS & PARTNERS SECTION ====== */}
            <section className="py-5">
                <Container>
                    <Row className="text-center g-4">
                        <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>150k+</h3><small className="text-muted fs-6">Khách hàng tin yêu</small></Col>
                        <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>10+</h3><small className="text-muted fs-6">Cửa hàng toàn quốc</small></Col>
                        <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>4.9/5</h3><small className="text-muted fs-6">Đánh giá hài lòng</small></Col>
                        <Col md={3} xs={6}><h3 className="fw-bold mb-0" style={{color:'#d4af37'}}>24h</h3><small className="text-muted fs-6">Hỗ trợ khách hàng</small></Col>
                    </Row>
                    <Row className="mt-5 g-3 justify-content-center align-items-center text-center">
                        <Col xs="auto"><LogoA h={32} /></Col>
                        <Col xs="auto"><LogoB h={32} /></Col>
                        <Col xs="auto"><LogoC h={32} /></Col>
                        <Col xs="auto"><LogoD h={32} /></Col>
                    </Row>
                </Container>
            </section>

            {/* ====== TESTIMONIALS SECTION ====== */}
            <section className="py-5" style={{background:'linear-gradient(180deg,#f8f6ef 0%, #ffffff 60%)'}}>
                <Container>
                    <h2 className="fw-bold mb-4">Khách hàng nói về Lily</h2>
                    <Carousel indicators={false} interval={null}>
                        {TESTIMONIALS.map((t, idx) => (
                            <Carousel.Item key={idx}>
                                <Row className="g-4 p-4 align-items-center">
                                    <Col md={11} className="mx-auto">
                                        <Card className="border-0 rounded-4 shadow-sm">
                                            <Card.Body className="p-4 p-md-5">
                                                <div className="d-flex align-items-center mb-2">
                                                    <div>
                                                        <strong style={{color:'#333'}}>{t.name}</strong>
                                                        <Stars />
                                                    </div>
                                                </div>
                                                <p className="mb-0 fs-5 text-secondary">{t.quote}</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </Container>
            </section>

            {/* ====== FAQ SECTION ====== */}
            <section className="py-5 bg-light">
                <Container>
                    <h2 className="fw-bold mb-4">Câu hỏi thường gặp</h2>
                    <Accordion alwaysOpen className="border-0">
                        {FAQS.map((i) => (
                            <Accordion.Item eventKey={i.k} key={i.k} className="mb-3 rounded-4 border-0 shadow-sm">
                                <Accordion.Header><strong>{i.q}</strong></Accordion.Header>
                                <Accordion.Body className="text-secondary fs-6">{i.a}</Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Container>
            </section>

             {/* ====== CTA SECTION ====== */}
             <section className="py-5">
                <Container>
                    <Card className="border-0 rounded-4 overflow-hidden shadow" style={{background: 'linear-gradient(120deg,#111 0%, #1b1b1b 100%)'}}>
                        <Row className="g-0 align-items-center">
                            <Col lg={8} className="p-4 p-md-5">
                                <h3 className="fw-bold mb-2 text-white">Cần tư vấn phối đồ hoặc chọn size?</h3>
                                <p className="mb-0" style={{color:'rgba(255,255,255,.78)'}}>Stylist của Lily hỗ trợ 9:00–21:00 mỗi ngày.</p>
                            </Col>
                            <Col lg={4} className="p-4 p-md-5 text-lg-end">
                                <Button as="a" href="tel:18000000" className="px-4 py-3 fw-bold rounded-3" style={{background:'#d4af37', borderColor:'#d4af37', color:'#111'}}>
                                    <FiPhoneCall className="me-2" /> Gọi 1800 0000
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                </Container>
            </section>
        </>
    );
}