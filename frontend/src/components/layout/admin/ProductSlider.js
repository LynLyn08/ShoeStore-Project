// src/components/layout/admin/ProductSlider.js
import { useState } from 'react';
import Slider from 'react-slick';
import { Card } from 'react-bootstrap';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../../../styles/components/ProductSlider.css";

const API = 'http://localhost:5000';
const PLACEHOLDER = '/placeholder.jpg';

const fmtVND = (n) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

function ProductCard({ p }) {
  const [imgSrc, setImgSrc] = useState(`${API}${p.DefaultImage || PLACEHOLDER}`);
  const handleMouseEnter = () => setImgSrc(`${API}${p.HoverImage || p.DefaultImage || PLACEHOLDER}`);
  const handleMouseLeave = () => setImgSrc(`${API}${p.DefaultImage || PLACEHOLDER}`);
  const hasDiscount = p.DiscountedPrice < p.Price;

  return (
    <Card className="product-card mx-2" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {hasDiscount && <div className="ribbon">-{p.DiscountPercent}%</div>}
      <Card.Img
        variant="top"
        src={imgSrc}
        alt={p.Name}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body>
        <Card.Title className="text-truncate text-dark">{p.Name}</Card.Title>
        <div className="price-section">
          <span className="price">{fmtVND(p.DiscountedPrice)}</span>
          {hasDiscount && <span className="price-old ms-2">{fmtVND(p.Price)}</span>}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function ProductSlider({ products }) {
  if (!products || products.length === 0) return <p className="text-dark">Không có dữ liệu.</p>;

  // Nếu ít hơn hoặc bằng 4 sản phẩm → hiển thị dạng grid, tránh kéo giãn xấu
  if (products.length <= 4) {
    return (
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.ProductID} p={p} />
        ))}
      </div>
    );
  }

  // Nếu nhiều hơn 4 sản phẩm → dùng slider
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <Slider {...settings}>
      {products.map((p) => (
        <ProductCard key={p.ProductID} p={p} />
      ))}
    </Slider>
  );
}
