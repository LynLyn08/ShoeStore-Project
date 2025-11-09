import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Form, Button, Breadcrumb, InputGroup, Spinner, Badge, FloatingLabel, Alert } from 'react-bootstrap';
import ReactPaginate from 'react-paginate';
import { FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight, FaClock, FaFolderOpen, FaTag } from 'react-icons/fa';

import {
    fetchBlogs,
    fetchBlogFilters,
    selectAllBlogs,
    selectBlogPagination,
    selectBlogStatus,
    selectBlogError,
    selectBlogCategories,
    selectBlogTags,
} from '../../redux/blogSlice';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PLACEHOLDER = '/blog-placeholder.jpg';
const LIMIT = 9;

export default function BlogList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();

    const posts = useSelector(selectAllBlogs);
    const { total, page, totalPages } = useSelector(selectBlogPagination);
    const status = useSelector(selectBlogStatus);
    const error = useSelector(selectBlogError);
    const categories = useSelector(selectBlogCategories);
    const tags = useSelector(selectBlogTags);
    
    const [kwInput, setKwInput] = useState(searchParams.get('keyword') || '');

    useEffect(() => {
        dispatch(fetchBlogFilters());
    }, [dispatch]);
    
    useEffect(() => {
        const params = Object.fromEntries(searchParams.entries());
        dispatch(fetchBlogs({ limit: LIMIT, ...params }));
    }, [searchParams, dispatch]);

    const setQS = (patch) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(patch).forEach(([k, v]) => {
            if (v === '' || v === null) next.delete(k); else next.set(k, String(v));
        });
        if (!('page' in patch)) next.set('page', '1');
        setSearchParams(next);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setQS({ keyword: kwInput.trim() });
    };

    const [featured, others] = posts.length ? [posts[0], posts.slice(1)] : [null, []];
    
    return (
        <div className="container py-4">
             <style>{`
        :root {
          --ink: #111;
          --ink-2: #495057;
          --muted: #6c757d;
          --line: #e9ecef;
          --card: #ffffff;
          --shadow: 0 8px 30px rgba(0,0,0,.08);
          --primary: #000;
          --chip: #f1f3f5;
        }
        body { background:#f6f7f9; }

        .hero {
          background: radial-gradient(1200px 200px at 10% -20%, rgba(0,0,0,.08), transparent),
                      radial-gradient(800px 160px at 90% -10%, rgba(0,0,0,.06), transparent),
                      #fff;
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          border-radius: 18px;
          padding: 28px 28px;
          margin-bottom: 18px;
        }
        .hero h1 { font-weight: 800; letter-spacing:-.3px; }
        .hero p  { color: var(--ink-2); margin: 0; }

        .sidebar {
          position: sticky; top: 16px;
          background: var(--card); border:1px solid var(--line); border-radius:14px; box-shadow: var(--shadow);
          padding: 1.1rem 1.1rem;
        }
        .chip {
          display:inline-flex; align-items:center; gap:.4rem;
          background: var(--chip); border:1px solid #e7eaee; border-radius:999px;
          padding:.35rem .7rem; font-size:.85rem; color:#222; cursor:pointer; margin:0 .45rem .45rem 0;
          transition: transform .15s ease, background .15s ease;
        }
        .chip:hover { transform: translateY(-1px); background:#e9ecef; }
        .chip.active { background:#111; color:#fff; border-color:#111; }

        .post-card { border:1px solid var(--line); border-radius:14px; overflow:hidden; background:#fff; height:100%;
          transition: transform .2s ease, box-shadow .2s ease; }
        .post-card:hover { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(0,0,0,.10); }
        .cover-wrap { position:relative; padding-bottom:56.5%; background:#fafafa; }
        .cover-wrap img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

        .meta { color: var(--muted); font-size:.9rem; display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
        .meta svg { opacity:.8; }

        .featured { border-radius:16px; overflow:hidden; border:1px solid var(--line); background:#fff; box-shadow: var(--shadow); }
        .featured .cover-wrap { padding-bottom: 45%; }
        .featured .content { padding: 1rem 1.1rem 1.25rem; }
        .badge-cat { background:#000; }

        .paginate { gap:.5rem; justify-content:center; }
        .paginate .page-item .page-link { border-radius:10px; min-width:42px; text-align:center; color:#000; border:1px solid var(--line); }
        .paginate .page-item.active .page-link { background:#000; border-color:#000; color:#fff; }
      `}</style>
            <Breadcrumb className="mb-3"><Breadcrumb.Item as={Link} to="/">Trang chủ</Breadcrumb.Item><Breadcrumb.Item active>Blog</Breadcrumb.Item></Breadcrumb>
            <div className="hero"><h1>Blog & Cảm hứng</h1><p>Xu hướng, mẹo phối đồ và các bài viết mới nhất từ chúng tôi.</p></div>

            <Row className="g-4">
                <Col lg={3}>
                    <div className="sidebar">
                        <Form onSubmit={handleSearchSubmit} className="mb-3">
                            <InputGroup>
                                <Form.Control placeholder="Tìm bài viết…" value={kwInput} onChange={(e) => setKwInput(e.target.value)} />
                                <Button type="submit" variant="dark"><FaSearch /></Button>
                            </InputGroup>
                        </Form>
                        <div className="mb-3">
                            <h6 className="d-flex align-items-center mb-2"><FaFolderOpen className="me-2 text-muted" />Danh mục</h6>
                            <div>{categories.map(c => <button key={c.id} className={`chip ${searchParams.get('category') === c.slug ? 'active' : ''}`} onClick={() => setQS({ category: searchParams.get('category') === c.slug ? '' : c.slug })}>{c.name}</button>)}</div>
                        </div>
                        <div className="mb-2">
                            <h6 className="d-flex align-items-center mb-2"><FaTag className="me-2 text-muted" />Tags</h6>
                            <div>{tags.map(t => <button key={t.id} className={`chip ${searchParams.get('tag') === t.slug ? 'active' : ''}`} onClick={() => setQS({ tag: searchParams.get('tag') === t.slug ? '' : t.slug })}>#{t.name}</button>)}</div>
                        </div>
                    </div>
                </Col>
                <Col lg={9}>
                    {status === 'failed' && <Alert variant="danger">{error}</Alert>}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="fw-semibold">Tìm thấy {total} bài viết</span>
                        <div style={{ minWidth: 220 }}>
                            <FloatingLabel label="Sắp xếp">
                                <Form.Select value={searchParams.get('sort') || ''} onChange={(e) => setQS({ sort: e.target.value })}>
                                    <option value="">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                </Form.Select>
                            </FloatingLabel>
                        </div>
                    </div>
                    {status === 'loading' ? <div className="text-center py-5"><Spinner /></div> : 
                     posts.length === 0 ? <div className="text-center text-muted py-5"><p>Không tìm thấy bài viết nào.</p></div> :
                     <>
                        {featured && (
                            <Card className="featured mb-4">
                                <div className="cover-wrap"><img src={`${API_BASE_URL}${featured.ImageURL}`} alt={featured.Title} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} /></div>
                                <div className="content">
                                    <div className="meta mb-2"><span><FaClock className="me-1" />{new Date(featured.CreatedAt).toLocaleDateString('vi-VN')}</span></div>
                                    <h2 className="h5 mb-2"><Link to={`/blog/${featured.BlogID}`}>{featured.Title}</Link></h2>
                                    <p className="mb-3 text-muted">{featured.Excerpt}...</p>
                                    <Button as={Link} to={`/blog/${featured.BlogID}`} variant="dark">Đọc tiếp</Button>
                                </div>
                            </Card>
                        )}
                        <Row xs={1} sm={2} md={3} className="g-4">
                            {others.map((p) => (
                                <Col key={p.BlogID}>
                                    <Card className="post-card">
                                        <div className="cover-wrap"><img src={`${API_BASE_URL}${p.ImageURL}`} alt={p.Title} onError={(e) => (e.currentTarget.src = PLACEHOLDER)} /></div>
                                        <Card.Body>
                                            <div className="meta mb-2"><span><FaClock className="me-1" />{new Date(p.CreatedAt).toLocaleDateString('vi-VN')}</span></div>
                                            <Card.Title as="h6" style={{ minHeight: 48 }}><Link to={`/blog/${p.BlogID}`}>{p.Title}</Link></Card.Title>
                                            <Card.Text className="text-muted small">{p.Excerpt}...</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                        <div className="d-flex justify-content-center mt-4 pt-3 border-top">
                            <ReactPaginate
                                previousLabel={<FaChevronLeft />} nextLabel={<FaChevronRight />} breakLabel="..."
                                forcePage={page - 1} pageCount={totalPages} marginPagesDisplayed={2} pageRangeDisplayed={3}
                                onPageChange={(ev) => setQS({ page: ev.selected + 1 })}
                                containerClassName="pagination paginate" pageClassName="page-item" pageLinkClassName="page-link"
                                previousClassName="page-item" previousLinkClassName="page-link" nextClassName="page-item" nextLinkClassName="page-link"
                                breakClassName="page-item" breakLinkClassName="page-link" activeClassName="active"
                            />
                        </div>
                     </>
                    }
                </Col>
            </Row>
        </div>
    );
}