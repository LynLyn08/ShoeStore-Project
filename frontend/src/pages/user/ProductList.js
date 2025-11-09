import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Form, Button, Breadcrumb, InputGroup, Spinner, FloatingLabel, Alert } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import action và selectors từ Redux
import { fetchProducts, selectAllProducts, selectProductsPagination, selectProductsStatus, selectProductsError } from '../../redux/productSlice';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER = '/placeholder.jpg';
const LIMIT = 8; // Số sản phẩm trên mỗi trang

// --- Các hằng số cho UI ---
const CATEGORIES = [ { key: 'sport', label: 'Giày thể thao' }, { key: 'office', label: 'Giày công sở' }, { key: 'sandal', label: 'Sandal' }, { key: 'sneaker', label: 'Sneaker' }];
const GROUPS = [{ key: 'Men', label: 'Nam' }, { key: 'Women', label: 'Nữ' }, { key: 'Unisex', label: 'Unisex' }];
const SORTS = [{ key: '', label: 'Mặc định' }, { key: 'name_asc', label: 'Tên A → Z' }, { key: 'name_desc', label: 'Tên Z → A' }, { key: 'price_asc', label: 'Giá tăng dần' }, { key: 'price_desc', label: 'Giá giảm dần' }];
const fmtVND = (n) => typeof n === 'number' ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '';

function ProductCardItem({ p }) {
    const navigate = useNavigate();
    const hasDiscount = p.DiscountPercent > 0;
    const imageUrl = p.DefaultImage ? `${API_BASE_URL}${p.DefaultImage}` : PLACEHOLDER;

    return (
        <Card className="product-card h-100" onClick={() => navigate(`/product/${p.ProductID}`)} style={{ cursor: 'pointer' }}>
            {hasDiscount && <div className="ribbon">-{p.DiscountPercent}%</div>}
            <Card.Img variant="top" src={imageUrl} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} className="product-img-wrapper" />
            <Card.Body>
                <Card.Title as="h6" title={p.Name} className="product-card-title">{p.Name}</Card.Title>
                <div className="price-section">
                    <span className="price">{fmtVND(p.DiscountedPrice)}</span>
                    {hasDiscount && <span className="price-old">{fmtVND(p.Price)}</span>}
                </div>
                <Button variant="dark" className="mt-auto w-100">Xem chi tiết</Button>
            </Card.Body>
        </Card>
    );
}

function ProductList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();

    // Lấy state từ Redux
    const products = useSelector(selectAllProducts);
    const { total, page, totalPages } = useSelector(selectProductsPagination);
    const status = useSelector(selectProductsStatus);
    const error = useSelector(selectProductsError);
    
    const [currentKeyword, setCurrentKeyword] = useState(searchParams.get('keyword') || '');

    // Effect để fetch dữ liệu khi các tham số trên URL thay đổi
    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries());
        dispatch(fetchProducts({ limit: LIMIT, ...params }));
    }, [searchParams, dispatch]);

    // Hàm cập nhật query string trên URL
    const setQS = (patch) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(patch).forEach(([k, v]) => {
            if (v === '' || v === null || v === undefined) next.delete(k);
            else next.set(k, String(v));
        });
        if (!('page' in patch)) next.set('page', '1'); // Reset về trang 1 khi filter
        setSearchParams(next);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setQS({ keyword: currentKeyword.trim() });
    };

    const handleClearAllFilters = () => setSearchParams({ page: '1' });
    
    return (
        <div className="container py-4">
            <style>{`
        :root {
          --ink: #111;
          --ink-2: #495057;
          --muted: #6c757d;
          --line: #e9ecef;
          --card: #ffffff;
          --shadow: 0 6px 24px rgba(0,0,0,.08);
          --danger: #e53935;
        }
        body { background: #f6f7f9; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif; }
        .container { max-width: 1200px; }
        a { text-decoration: none; }

        .custom-breadcrumb .breadcrumb-item a { color: var(--muted); }
        .custom-breadcrumb .breadcrumb-item.active { color: var(--ink); font-weight: 600; }

        .search-sort-area {
          background: var(--card);
          padding: 1.25rem;
          border-radius: 14px;
          box-shadow: var(--shadow);
          margin-bottom: 1.5rem;
          border: 1px solid var(--line);
        }
        .search-sort-area .form-control,
        .search-sort-area .form-select {
          border-radius: 10px;
          border-color: var(--line);
          transition: box-shadow .2s ease, border-color .2s ease;
        }
        .search-sort-area .form-control:focus,
        .search-sort-area .form-select:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 .25rem rgba(0,0,0,.08);
        }
        .search-sort-area .input-group-text {
          border-radius: 10px 0 0 10px;
          background: #f1f3f5;
          border-color: var(--line);
        }
        .btn-dark { border-radius: 10px; background:#000; border-color:#000; font-weight:700; }
        .btn-dark:hover { background:#1b1b1b; border-color:#1b1b1b; }

        .filter-sidebar {
          position: sticky; top: 16px;
          background: var(--card);
          padding: 1.25rem;
          border-radius: 14px;
          box-shadow: var(--shadow);
          border: 1px solid var(--line);
        }
        .filter-sidebar .card-title { font-weight: 700; color: var(--ink); margin-bottom: .75rem; }
        .filter-sidebar .form-check { margin-bottom: .6rem; }
        .filter-sidebar .form-check-input { width: 1.1rem; height: 1.1rem; border-color: #ced4da; }
        .filter-sidebar .form-check-input:checked { background-color: var(--ink); border-color: var(--ink); }
        .filter-sidebar .form-check-label { color: var(--ink-2); }

        .product-card {
          border: 1px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          background: var(--card);
          height: 100%;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 32px rgba(0,0,0,.12);
          border-color: #dfe3e6;
        }
        .product-img-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          cursor: pointer;
          background: #fafafa;
        }
        .product-img-wrapper img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: opacity .25s ease, transform .25s ease;
        }
        .product-img-wrapper:hover img { transform: scale(1.02); }

        .card-body { padding: .9rem .95rem 1rem; display:flex; flex-direction:column; }
        .product-card .card-title {
          font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: .35rem;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height: 42px;
        }
        .product-card .product-meta { font-size: .85rem; color: var(--muted); margin-bottom: .6rem; }

        .price-section { display:flex; align-items:baseline; gap:.5rem; margin-bottom: .8rem; }
        .price { font-size: 1.15rem; font-weight: 800; color: var(--danger); }
        .price-old { font-size: .9rem; text-decoration: line-through; color: #9aa0a6; }

        .ribbon {
          position: absolute; top: 10px; right: 10px;
          background: var(--danger); color: #fff; padding: 4px 10px;
          font-size: .75rem; font-weight: 700; border-radius: 999px; z-index: 10;
          box-shadow: 0 2px 10px rgba(229,57,53,.25);
        }
        .ribbon::before {
          content: "";
          position: absolute;
          top: 0;
          right: -6px;
          border-top: 14px solid transparent;
          border-bottom: 14px solid transparent;
          border-left: 6px solid var(--danger);
        }

        .pagination-container { padding: 1rem 0; border-top: 1px solid var(--line); margin-top: 1.25rem; }
        .pagination { gap: .5rem; justify-content: center; }
        .pagination .page-item .page-link {
          border-radius: 10px; min-width: 40px; text-align:center; color: var(--ink);
          border: 1px solid var(--line); background:#fff;
        }
        .pagination .page-item .page-link:hover { background:#f1f3f5; }
        .pagination .page-item.active .page-link { background:#000; border-color:#000; color:#fff; }
        .pagination .page-item.disabled .page-link { color:#adb5bd; background:#fff; border-color:var(--line); }
      `}</style>
            
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
                <Breadcrumb.Item active>Sản phẩm</Breadcrumb.Item>
            </Breadcrumb>
            
            <div className="search-sort-area">
                <Row className="g-3 align-items-center">
                    <Col md={7} lg={6}>
                        <Form onSubmit={handleSearchSubmit}>
                            <InputGroup>
                                <InputGroup.Text><FaSearch /></InputGroup.Text>
                                <Form.Control placeholder="Tìm theo tên sản phẩm…" value={currentKeyword} onChange={(e) => setCurrentKeyword(e.target.value)} />
                                <Button type="submit" variant="dark">Tìm kiếm</Button>
                            </InputGroup>
                        </Form>
                    </Col>
                    <Col md={5} lg={3}>
                        <FloatingLabel label="Sắp xếp theo">
                            <Form.Select value={searchParams.get('sort') || ''} onChange={(e) => setQS({ sort: e.target.value })}>
                                {SORTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Form.Select>
                        </FloatingLabel>
                    </Col>
                </Row>
            </div>

            <Row className="g-4">
                <Col lg={3}>
                    <div className="filter-sidebar">
                        <Card.Title className="mb-3">Bộ lọc</Card.Title>
                        <div className="mb-4">
                            <h6 className="mb-2 text-muted">Danh mục</h6>
                            {CATEGORIES.map(c => (
                                <Form.Check key={c.key} type="checkbox" id={`cat-${c.key}`} label={c.label} checked={searchParams.get('category') === c.key} onChange={() => setQS({ category: searchParams.get('category') === c.key ? '' : c.key })} />
                            ))}
                        </div>
                        <div>
                            <h6 className="mb-2 text-muted">Giới tính</h6>
                            {GROUPS.map(g => (
                                <Form.Check key={g.key} type="radio" id={`grp-${g.key}`} label={g.label} name="targetGroupFilter" checked={searchParams.get('targetGroup') === g.key} onChange={() => setQS({ targetGroup: searchParams.get('targetGroup') === g.key ? '' : g.key })} />
                            ))}
                        </div>
                        <Button variant="outline-secondary" size="sm" className="mt-3 w-100" onClick={handleClearAllFilters}>Xóa tất cả bộ lọc</Button>
                    </div>
                </Col>

                <Col lg={9}>
                    {status === 'failed' && <Alert variant="danger">{error}</Alert>}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-semibold">Tìm thấy {total} sản phẩm</span>
                    </div>

                    {status === 'loading' ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : products.length === 0 ? (
                        <div className="text-center text-muted py-5"><p className="fs-5">Không có sản phẩm phù hợp.</p></div>
                    ) : (
                        <Row xs={1} sm={2} md={3} className="g-4">
                            {products.map(p => (
                                <Col key={p.ProductID}><ProductCardItem p={p} /></Col>
                            ))}
                        </Row>
                    )}

                    {products.length > 0 && (
                        <div className="d-flex justify-content-center mt-4">
                            <ReactPaginate
                                previousLabel={<FaChevronLeft />}
                                nextLabel={<FaChevronRight />}
                                breakLabel="..."
                                forcePage={page - 1}
                                pageCount={totalPages}
                                onPageChange={(ev) => setQS({ page: ev.selected + 1 })}
                                containerClassName="pagination"
                                pageClassName="page-item"
                                pageLinkClassName="page-link"
                                previousClassName="page-item"
                                previousLinkClassName="page-link"
                                nextClassName="page-item"
                                nextLinkClassName="page-link"
                                breakClassName="page-item"
                                breakLinkClassName="page-link"
                                activeClassName="active"
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
}
export default ProductList;