import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Spinner, Button, Alert, Table, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    LineChart, Line, Legend, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { toast } from 'react-toastify';
import { 
    Users, ShoppingCart, DollarSign, Package, 
    TrendingUp, AlertCircle 
} from 'react-feather';

// Import action và selectors
import { 
    fetchDashboardStats, 
    selectDashboardStats, 
    selectDashboardStatus, 
    selectDashboardError 
} from '../../redux/dashboardSlice';

// SỬA: Import các hàm API mới cho bảng
import { getPaginatedTopProductsAPI, getPaginatedLowStockAPI } from '../../api';

import "../../styles/pages/AdminDashboard.css";

// --- Helper Functions ---
const fmtVND = (n) => typeof n === 'number' ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0 ₫';
const fmtNum = (n) => typeof n === 'number' ? n.toLocaleString('vi-VN') : '0';
const fmtDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : '';
const PIE_COLORS = { Pending: '#ffc107', Confirmed: '#198754', Shipped: '#0dcaf0', Delivered: '#0d6efd', Cancelled: '#dc3545' };
const DEFAULT_COLOR = '#6c757d';

// ===============================================
// === COMPONENT BẢNG TOP SẢN PHẨM (CÓ PHÂN TRANG)
// ===============================================
const TopProductsTable = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await getPaginatedTopProductsAPI({ page: pagination.page, limit: 5 });
                setData(data.data);
                setPagination({ page: data.page, totalPages: data.totalPages });
            } catch (err) {
                toast.error("Lỗi tải Top Sản Phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pagination.page]);

    const handleNav = (id) => navigate(`/admin/products?edit=${id}`);

    return (
        <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0"><TrendingUp size={20} className="me-2" /> Top sản phẩm bán chạy (theo biến thể)</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
                {loading && <div className="text-center p-5"><Spinner /></div>}
                {!loading && (
                    <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Phân loại (Size - Màu)</th>
                                <th className="text-end">Đã bán</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(p => (
                                <tr key={p.VariantID} onClick={() => handleNav(p.ProductID)} style={{cursor: 'pointer'}}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <img src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${p.DefaultImage}`} alt={p.Name} className="me-2" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />
                                            <span className="fw-bold">{p.Name}</span>
                                        </div>
                                    </td>
                                    <td><strong>{p.Size}</strong> - {p.Color}</td>
                                    <td className="text-end fw-bold">{fmtNum(p.sold)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
            <Card.Footer className="bg-white border-0">
                <Pagination size="sm" className="mb-0 d-flex justify-content-end">
                    {[...Array(pagination.totalPages).keys()].map(num => (
                        <Pagination.Item 
                            key={num + 1} 
                            active={num + 1 === pagination.page} 
                            onClick={() => setPagination(p => ({...p, page: num + 1}))}
                        >
                            {num + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </Card.Footer>
        </Card>
    );
};

// ===============================================
// === COMPONENT BẢNG SẮP HẾT HÀNG (CÓ PHÂN TRANG)
// ===============================================
const LowStockTable = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await getPaginatedLowStockAPI({ page: pagination.page, limit: 5 });
                setData(data.data);
                setPagination({ page: data.page, totalPages: data.totalPages });
            } catch (err) {
                toast.error("Lỗi tải sản phẩm sắp hết hàng");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pagination.page]);
    
    const handleNav = (id) => navigate(`/admin/products?edit=${id}`);

    return (
         <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <Card.Title className="mb-0 text-danger"><AlertCircle size={20} className="me-2" /> Sản phẩm sắp hết hàng (Tồn {"<"} 5)</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
                 {loading && <div className="text-center p-5"><Spinner /></div>}
                 {!loading && (
                    <Table hover responsive className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Phân loại (Size - Màu)</th>
                                <th className="text-end">Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(v => (
                                <tr key={v.VariantID} onClick={() => handleNav(v.ProductID)} style={{cursor: 'pointer'}}>
                                    <td>
                                        <span className="fw-bold">{v.product?.Name || 'Sản phẩm không rõ'}</span>
                                    </td>
                                    <td><strong>{v.Size}</strong> - {v.Color}</td>
                                    <td className="text-end fw-bold text-danger">{v.StockQuantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                 )}
            </Card.Body>
            <Card.Footer className="bg-white border-0">
                 <Pagination size="sm" className="mb-0 d-flex justify-content-end">
                    {[...Array(pagination.totalPages).keys()].map(num => (
                        <Pagination.Item 
                            key={num + 1} 
                            active={num + 1 === pagination.page} 
                            onClick={() => setPagination(p => ({...p, page: num + 1}))}
                        >
                            {num + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            </Card.Footer>
        </Card>
    );
};


// ===============================================
// === COMPONENT DASHBOARD CHÍNH
// ===============================================
export default function AdminDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy state từ Redux
    const stats = useSelector(selectDashboardStats);
    const status = useSelector(selectDashboardStatus);
    const error = useSelector(selectDashboardError);

    // Fetch dữ liệu chính (thẻ, biểu đồ)
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchDashboardStats());
        }
    }, [dispatch, status]);
    
    // Toast lỗi một lần
    useEffect(() => {
        if(error) toast.error(error);
    }, [error]);
    
    // --- Render Logic ---
    if (status === 'loading' || (status === 'idle' && !stats)) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" /><span className="ms-2">Đang tải dữ liệu tổng quan...</span>
            </div>
        );
    }
    
    if (status === 'failed' && !stats) {
        return (
            <Container className="text-center py-5">
                <Alert variant="danger">{error || "Bạn không có quyền truy cập hoặc đã có lỗi xảy ra."}</Alert>
                <Button onClick={() => navigate("/login")} variant="primary">Quay lại đăng nhập</Button>
            </Container>
        );
    }
    
    if (!stats) {
         return (
            <Container className="text-center py-5">
                <Alert variant="warning">Không thể tải dữ liệu dashboard.</Alert>
            </Container>
        );
    }

    const handleNav = (path) => () => navigate(`/admin/${path}`);

    // Đảm bảo dữ liệu cho chart không bị null/undefined
    const safeData = {
        totals: stats.totals || { totalUsers: 0, totalOrders: 0, totalRevenue: 0, totalProducts: 0 },
        charts: {
            revenue: stats.charts?.revenue || [],
        },
        orderStatus: stats.orderStatus || [],
    };

    return (
        <div className="admin-dashboard p-4" style={{ backgroundColor: '#f8f9fa' }}>
            <Container fluid>
                <h2 className="mb-4">Tổng quan</h2>
                
                {/* 4 THẺ TỔNG QUAN (ĐÃ SỬA LỖI ĐẾM) */}
                <Row className="g-4 mb-4">
                    <Col xl={3} md={6}>
                        <Card className="stat-card h-100 shadow-sm border-0" onClick={handleNav("orders")}>
                            <Card.Body>
                                <Row>
                                    <Col xs="auto"><div className="stat-icon bg-primary text-white"><DollarSign size={24} /></div></Col>
                                    <Col>
                                        <Card.Title className="text-muted mb-1">Tổng Doanh Thu (Thành công)</Card.Title>
                                        <Card.Text className="h4 mb-0">{fmtVND(safeData.totals.totalRevenue)}</Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="stat-card h-100 shadow-sm border-0" onClick={handleNav("orders")}>
                            <Card.Body>
                                <Row>
                                    <Col xs="auto"><div className="stat-icon bg-success text-white"><ShoppingCart size={24} /></div></Col>
                                    <Col>
                                        <Card.Title className="text-muted mb-1">Tổng Đơn Hàng (Tất cả)</Card.Title>
                                        <Card.Text className="h4 mb-0">{fmtNum(safeData.totals.totalOrders)}</Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="stat-card h-100 shadow-sm border-0" onClick={handleNav("users")}>
                            <Card.Body>
                                <Row>
                                    <Col xs="auto"><div className="stat-icon bg-info text-white"><Users size={24} /></div></Col>
                                    <Col>
                                        <Card.Title className="text-muted mb-1">Tổng Tài Khoản</Card.Title>
                                        <Card.Text className="h4 mb-0">{fmtNum(safeData.totals.totalUsers)}</Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="stat-card h-100 shadow-sm border-0" onClick={handleNav("products")}>
                            <Card.Body>
                                <Row>
                                    <Col xs="auto"><div className="stat-icon bg-warning text-white"><Package size={24} /></div></Col>
                                    <Col>
                                        <Card.Title className="text-muted mb-1">Tổng Sản Phẩm</Card.Title>
                                        <Card.Text className="h4 mb-0">{fmtNum(safeData.totals.totalProducts)}</Card.Text>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* BIỂU ĐỒ & TRẠNG THÁI ĐƠN HÀNG */}
                <Row className="g-4 mb-4">
                    <Col lg={8}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Header className="bg-white border-0 py-3"><Card.Title className="mb-0">Doanh thu 30 ngày qua (Chỉ tính đơn thành công)</Card.Title></Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={safeData.charts.revenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={12} />
                                        <YAxis tickFormatter={(v) => `${v/1000000}tr`} fontSize={12} />
                                        <Tooltip formatter={(value) => [fmtVND(value), "Doanh thu"]} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Header className="bg-white border-0 py-3"><Card.Title className="mb-0">Trạng thái đơn hàng (Tất cả)</Card.Title></Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={safeData.orderStatus}
                                            dataKey="count"
                                            nameKey="Status"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={120}
                                            fill="#8884d8"
                                            label={({ Status, percent }) => `${Status} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {safeData.orderStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.Status] || DEFAULT_COLOR} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [value, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* SỬA: Hai bảng bây giờ là component riêng biệt */}
                <Row className="g-4">
                    <Col lg={7}>
                        <TopProductsTable />
                    </Col>
                    <Col lg={5}>
                        <LowStockTable />
                    </Col>
                </Row>
                
            </Container>
        </div>
    );
}