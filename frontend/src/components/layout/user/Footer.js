import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-auto py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Lily Shoes</h5>
            <p className="text-white-50">Nâng tầm phong cách, khẳng định đẳng cấp. Khám phá thế giới giày thời trang và tiện lợi.</p>
          </Col>
          <Col md={2} xs={6}>
            <h5>Về chúng tôi</h5>
            <ul className="list-unstyled">
              <li><Link to="/about" className="text-white-50 text-decoration-none">Giới thiệu</Link></li>
              <li><Link to="/blogs" className="text-white-50 text-decoration-none">Blog</Link></li>
            </ul>
          </Col>
          <Col md={2} xs={6}>
            <h5>Hỗ trợ</h5>
            <ul className="list-unstyled">
              <li><Link to="/contact" className="text-white-50 text-decoration-none">Liên hệ</Link></li>
              <li><Link to="/faq" className="text-white-50 text-decoration-none">Câu hỏi</Link></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Liên hệ</h5>
            <p className="text-white-50 mb-1">Email: support@lilyshoes.com</p>
            <p className="text-white-50 mb-1">Điện thoại: 1800 0000</p>
          </Col>
        </Row>
        <hr className="my-3" />
        <div className="text-center text-white-50">
          <small>© {new Date().getFullYear()} Lily Shoes. All rights reserved.</small>
        </div>
      </Container>
    </footer>
  );
}