// frontend/src/pages/admin/AdminOrders.js
// ĐÃ SỬA LỖI IMPORT TRÙNG VÀ LỖI CÚ PHÁP jsPDF

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Tab, Tabs, Table, Button, Modal, Form, InputGroup, Spinner, Alert, Container, Pagination, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Import Redux actions and selectors
import { 
    fetchAdminOrders, 
    updateOrderStatus,
    selectAdminUserOrders, 
    selectAdminGuestOrders, 
    selectAdminUserPagination, 
    selectAdminGuestPagination, 
    selectAdminOrdersStatus, 
    selectAdminOrdersError 
} from '../../redux/adminOrdersSlice';

// Import API functions
import { getAdminOrderDetailAPI, updateAdminTrackingAPI } from '../../api';

// Import PDF generation tools
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// SỬA: Chỉ import 1 lần
import { robotoBase64 } from '../../fonts/robotoBase64';
// --- Helper Functions ---
const fmtVND = (n) => typeof n === 'number' ? n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0 ₫';

export default function AdminOrders() {
    const dispatch = useDispatch();

    // Lấy state từ Redux
    const userOrders = useSelector(selectAdminUserOrders);
    const guestOrders = useSelector(selectAdminGuestOrders);
    const userPagination = useSelector(selectAdminUserPagination);
    const guestPagination = useSelector(selectAdminGuestPagination);
    const status = useSelector(selectAdminOrdersStatus);
    const error = useSelector(selectAdminOrdersError);

    // State cục bộ cho UI
    const [activeTab, setActiveTab] = useState('user');
    const [filters, setFilters] = useState({ user: { keyword: '', status: '' }, guest: { keyword: '', status: '' } });
    const [page, setPage] = useState({ user: 1, guest: 1 });

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null); // Lưu trữ chi tiết đơn hàng (đã chuẩn hóa)
    const [detailLoading, setDetailLoading] = useState(false);

    // Fetch dữ liệu khi các dependency thay đổi
    useEffect(() => {
        dispatch(fetchAdminOrders({ 
            page: page[activeTab], 
            limit: 10, 
            customerType: activeTab, 
            ...filters[activeTab] 
        }));
    }, [page, filters, activeTab, dispatch]);
    
    // --- Handlers ---
    const handleFilterChange = (type, field, value) => {
        setFilters(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
        setPage(prev => ({ ...prev, [type]: 1 })); // Reset về trang 1 khi filter
    };

    const handleViewDetail = async (type, id) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const { data } = await getAdminOrderDetailAPI(type, id);
            
            // SỬA: Chuẩn hóa dữ liệu trả về từ API trước khi lưu vào state
            const normalizedOrder = {
                type: type,
                id: (type === 'user') ? data.OrderID : data.GuestOrderID,
                ...data, // Giữ lại dữ liệu gốc
                // Chuẩn hóa thông tin khách hàng
                customerName: (type === 'user') ? data.user?.Username : data.FullName,
                customerEmail: (type === 'user') ? data.user?.Email : data.Email,
                customerPhone: (type === 'user') ? data.shippingAddress?.Phone : data.Phone,
                shippingAddressStr: (type === 'user') 
                    ? `${data.shippingAddress?.Street}, ${data.shippingAddress?.City}` 
                    : data.Address,
                // Chuẩn hóa danh sách item
                items: (data.items || []).map(item => ({
                    ...item,
                    productName: item.variant?.product?.Name || 'Sản phẩm không rõ',
                    size: item.variant?.Size || 'N/A',
                    color: item.variant?.Color || 'N/A'
                }))
            };
            
            setCurrentOrder(normalizedOrder); // Lưu dữ liệu đã chuẩn hóa

        } catch (err) {
            toast.error("Không thể tải chi tiết đơn hàng.");
            setShowDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };
    
    const handleStatusChange = (type, id, newStatus) => {
        dispatch(updateOrderStatus({ type, id, status: newStatus }));
    };

    const handlePrintPDF = () => {
        if (!currentOrder) return;
        const doc = new jsPDF();

        // 1. Thêm Font Tiếng Việt
        doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto', 'normal'); // Set làm font mặc định

        // 2. Thông tin tiêu đề
        doc.setFontSize(20);
        doc.text("LilyShoe Store", 14, 22);
        doc.setFontSize(12);
        doc.text("Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM", 14, 30);
        doc.text("Email: support@lilyshoe.com", 14, 36);
        
        // SỬA 1: Bỏ 'bold' và dùng font 'normal'
        doc.setFont('Roboto', 'normal'); 
        doc.setFontSize(22);
        doc.text(`HÓA ĐƠN`, 200, 22, { align: 'right' });
        
        doc.setFont('Roboto', 'normal'); // Quay lại font normal
        doc.setFontSize(12);
        doc.text(`Mã HĐ: #${currentOrder.id}`, 200, 30, { align: 'right' });
        doc.text(`Ngày: ${new Date(currentOrder.OrderDate).toLocaleDateString('vi-VN')}`, 200, 36, { align: 'right' });
        doc.setLineWidth(0.5);
        doc.line(14, 42, 200, 42);

        // 3. Thông tin khách hàng
        // SỬA 2: Bỏ 'bold' và dùng font 'normal'
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(14);
        doc.text("THÔNG TIN KHÁCH HÀNG", 14, 50);
        
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(12);
        doc.text(`Tên: ${currentOrder.customerName || 'N/A'}`, 14, 58);
        doc.text(`SĐT: ${currentOrder.customerPhone || 'N/A'}`, 14, 64);
        doc.text(`Email: ${currentOrder.customerEmail || 'N/A'}`, 14, 70);
        doc.text(`Địa chỉ: ${currentOrder.shippingAddressStr || 'N/A'}`, 14, 76);
        doc.text(`Vận chuyển: ${currentOrder.ShippingProvider || 'N/A'}`, 14, 82);
        doc.text(`TT Thanh toán: ${currentOrder.PaymentMethod || 'N/A'}`, 14, 88);

        // 4. Bảng sản phẩm
        const tableColumn = ["Tên sản phẩm", "Phân loại", "SL", "Đơn giá", "Thành tiền"];
        const tableRows = [];
        let subtotal = 0;

        currentOrder.items.forEach(item => {
            const itemTotal = item.Price * item.Quantity;
            subtotal += itemTotal;
            const itemData = [
                item.productName,
                `Size ${item.size} - ${item.color}`,
                item.Quantity,
                fmtVND(item.Price),
                fmtVND(itemTotal)
            ];
            tableRows.push(itemData);
        });

        let finalY = 96;

        if (tableRows.length > 0) {
            autoTable(doc, {
                startY: 96,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                styles: { font: 'Roboto', fontStyle: 'normal' },
                // SỬA 3: Đổi fontStyle của header (tiêu đề) thành 'normal'
                headStyles: { 
                    fillColor: [38, 38, 38], 
                    textColor: 255, 
                    fontStyle: 'normal' // <-- Đã sửa
                }
            });
            finalY = doc.lastAutoTable?.finalY || 96;
        } else {
            doc.setFontSize(12);
            doc.text("Không có sản phẩm trong đơn hàng này.", 14, 104);
            finalY = 110;
        }

        // 5. Bảng tổng kết
        const shippingFee = currentOrder.ShippingFee || 0;
        const totalAmount = currentOrder.TotalAmount;
        const discountAmount = (subtotal + shippingFee) - totalAmount;

        autoTable(doc, {
            startY: finalY + 10,
            body: [
                ['Tạm tính', fmtVND(subtotal)],
                ['Phí vận chuyển', fmtVND(shippingFee)],
                ['Giảm giá (Coupon)', fmtVND(discountAmount)],
                // SỬA 4: Đổi fontStyle của 'TỔNG CỘNG' thành 'normal'
                [{ content: 'TỔNG CỘNG', styles: { fontStyle: 'normal', fontSize: 14 } }, // <-- Đã sửa
                 { content: fmtVND(totalAmount), styles: { fontStyle: 'normal', fontSize: 14 } }] // <-- Đã sửa
            ],
            theme: 'plain',
            styles: { font: 'Roboto', fontStyle: 'normal' },
            tableWidth: 'wrap',
            margin: { left: 120 }
        });

        const summaryTableY = doc.lastAutoTable?.finalY || (finalY + 10);

        // 6. Footer
        doc.setFontSize(12);
        doc.text("Cảm ơn quý khách đã mua sắm tại LilyShoe Store!", 105, summaryTableY + 20, { align: 'center' });

        // 7. Lưu file
        doc.save(`hoadon_${currentOrder.id}.pdf`);
    };

    const trackingFormik = useFormik({
        initialValues: { TrackingCode: '', ShippingProvider: ''},
        enableReinitialize: true,
        validationSchema: Yup.object({
            TrackingCode: Yup.string().matches(/^[a-zA-Z0-9-]{5,50}$/, 'Mã không hợp lệ (5-50 ký tự, chữ, số, -)').optional().nullable(),
            ShippingProvider: Yup.string().min(2, 'Tối thiểu 2 ký tự').max(30, 'Tối đa 30 ký tự').optional().nullable(),
        }),
        onSubmit: async (values) => {
            try {
                // SỬA: Dùng type và id đã chuẩn hóa
                const type = currentOrder.type;
                const id = currentOrder.id;
                await updateAdminTrackingAPI(type, id, values);
                toast.success("Cập nhật tracking thành công!");
                setShowUpdateModal(false);
                // Fetch lại danh sách
                dispatch(fetchAdminOrders({ page: page[activeTab], limit: 10, customerType: activeTab, ...filters[activeTab] }));
            } catch (err) {
                 toast.error(err.response?.data?.errors?.[0]?.msg || 'Cập nhật thất bại.');
            }
        }
    });

    const renderTable = (orders, pagination, type) => (
        <>
            <Table striped bordered hover responsive>
                <thead><tr><th>ID</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
                <tbody>
                    {orders.map(o => {
                        // SỬA: Lấy ID và Thông tin KH đúng cách
                        const id = (type === 'user') ? o.OrderID : o.GuestOrderID;
                        const customerInfo = (type === 'user') ? o.user?.Username : o.FullName;
                        
                        return (
                            <tr key={`${type}-${id}`} onClick={() => handleViewDetail(type, id)} style={{ cursor: 'pointer' }}>
                                <td>#{id}</td>
                                <td>{customerInfo || 'N/A'}</td>
                                <td>{fmtVND(o.TotalAmount)}</td>
                                <td>
                                    <Form.Select 
                                        size="sm" 
                                        value={o.Status} 
                                        onChange={(e) => handleStatusChange(type, id, e.target.value)} 
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </Form.Select>
                                </td>
                                <td>{new Date(o.OrderDate).toLocaleDateString('vi-VN')}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
            {/* SỬA: Đảm bảo pagination.totalPages là số và > 1 */}
            {pagination.totalPages > 1 && (
                <Pagination>
                    {[...Array(pagination.totalPages).keys()].map(num => (
                        <Pagination.Item 
                            key={num + 1} 
                            active={num + 1 === pagination.page} 
                            onClick={() => setPage(p => ({...p, [type]: num + 1}))}
                        >
                            {num + 1}
                        </Pagination.Item>
                    ))}
                </Pagination>
            )}
        </>
    );
    
    return (
        <Container fluid>
            <h2 className="my-3">Quản lý Đơn hàng</h2>
            {status === 'failed' && error && <Alert variant="danger">{error}</Alert>}
            
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="user" title={`Khách hàng (${userPagination.total})`}>
                    <InputGroup className="mb-3">
                        <Form.Control value={filters.user.keyword} onChange={(e) => handleFilterChange('user', 'keyword', e.target.value)} placeholder="Tìm kiếm theo ID, Tên, Email..." />
                        <Form.Select value={filters.user.status} onChange={(e) => handleFilterChange('user', 'status', e.target.value)}><option value="">Tất cả</option><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option></Form.Select>
                    </InputGroup>
                    {status === 'loading' && activeTab === 'user' ? <Spinner /> : renderTable(userOrders, userPagination, 'user')}
                </Tab>
                <Tab eventKey="guest" title={`Khách vãng lai (${guestPagination.total})`}>
                     <InputGroup className="mb-3">
                        <Form.Control value={filters.guest.keyword} onChange={(e) => handleFilterChange('guest', 'keyword', e.target.value)} placeholder="Tìm kiếm theo ID, Tên, Email, SĐT..." />
                         <Form.Select value={filters.guest.status} onChange={(e) => handleFilterChange('guest', 'status', e.target.value)}><option value="">Tất cả</option><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option></Form.Select>
                    </InputGroup>
                    {status === 'loading' && activeTab === 'guest' ? <Spinner /> : renderTable(guestOrders, guestPagination, 'guest')}
                </Tab>
            </Tabs>

            {/* SỬA: Modal chi tiết giờ sẽ dùng dữ liệu đã chuẩn hóa `currentOrder` */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Chi tiết đơn hàng #{currentOrder?.id}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {detailLoading ? <div className="text-center p-5"><Spinner /></div> : !currentOrder ? <Alert variant="warning">Không có dữ liệu.</Alert> : (
                        <>
                            <h5>Thông tin khách hàng</h5>
                            <p><strong>Tên người nhận:</strong> {currentOrder.customerName || 'N/A'}</p>
                            <p><strong>Số điện thoại:</strong> {currentOrder.customerPhone || 'N/A'}</p>
                            <p><strong>Email:</strong> {currentOrder.customerEmail || 'N/A'}</p>
                            <p><strong>Địa chỉ giao hàng:</strong> {currentOrder.shippingAddressStr || 'N/A'}</p>
                            <hr />
                            <h5>Chi tiết đơn hàng</h5>
                            <p><strong>Tổng tiền:</strong> {fmtVND(currentOrder.TotalAmount)}</p>
                            <p><strong>Trạng thái:</strong> {currentOrder.Status}</p>
                            <p><strong>Ngày đặt:</strong> {new Date(currentOrder.OrderDate).toLocaleString('vi-VN')}</p>
                            <p><strong>Phương thức TT:</strong> {currentOrder.PaymentMethod || 'N/A'}</p>
                            <p><strong>Vận chuyển:</strong> {currentOrder.ShippingProvider || 'N/A'}</p>
                            <p><strong>Mã vận đơn:</strong> {currentOrder.TrackingCode || 'N/A'}</p>
                            <h5 className="mt-3">Sản phẩm</h5>
                            <Table striped bordered hover size="sm">
                                <thead><tr><th>Tên sản phẩm</th><th>Phân loại</th><th>Số lượng</th><th>Giá</th></tr></thead>
                                <tbody>
                                    {currentOrder.items?.map(item => (
                                        <tr key={item.OrderItemID || item.GuestOrderItemID}>
                                            <td>{item.productName}</td>
                                            <td>Size {item.size} - {item.color}</td>
                                            <td>{item.Quantity}</td>
                                            <td>{fmtVND(item.Price)}</td>
                                        </tr>
                                    )) || <tr><td colSpan="4">Không có sản phẩm.</td></tr>}
                                </tbody>
                            </Table>
                            <div className="mt-3">
                                <Button variant="primary" onClick={handlePrintPDF}>In hóa đơn (PDF)</Button>
                                {/* SỬA: Dùng `currentOrder.type` */}
                                {currentOrder.type === 'user' && (
                                    <Button variant="secondary" onClick={() => { trackingFormik.setValues({ TrackingCode: currentOrder.TrackingCode || '', ShippingProvider: currentOrder.ShippingProvider || '' }); setShowUpdateModal(true); }} className="ms-2">Cập nhật Tracking</Button>
                                )}
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal Cập nhật Tracking (Giữ nguyên) */}
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
                <Modal.Header closeButton><Modal.Title>Cập nhật Tracking cho #{currentOrder?.id}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={trackingFormik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tracking Code</Form.Label>
                            <Form.Control name="TrackingCode" {...trackingFormik.getFieldProps('TrackingCode')} isInvalid={trackingFormik.touched.TrackingCode && trackingFormik.errors.TrackingCode} />
                            <Form.Control.Feedback type="invalid">{trackingFormik.errors.TrackingCode}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nhà cung cấp vận chuyển</Form.Label>
                            <Form.Control name="ShippingProvider" {...trackingFormik.getFieldProps('ShippingProvider')} isInvalid={trackingFormik.touched.ShippingProvider && trackingFormik.errors.ShippingProvider} />
                            <Form.Control.Feedback type="invalid">{trackingFormik.errors.ShippingProvider}</Form.Control.Feedback>
                        </Form.Group>
                        <Button variant="secondary" onClick={() => setShowUpdateModal(false)} className="me-2">Hủy</Button>
                        <Button variant="primary" type="submit" disabled={trackingFormik.isSubmitting}>{trackingFormik.isSubmitting ? <Spinner size="sm" /> : 'Cập nhật'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}