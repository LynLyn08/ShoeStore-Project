import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Modal, Form, Spinner, Alert, Container, Pagination, InputGroup, Badge } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import { 
    fetchPaymentMethods,
    selectAllPaymentMethods,          
    selectPaymentMethodsPagination,   
    selectPaymentMethodsStatus,       
    selectPaymentMethodsError,
} from '../../redux/adminPaymentMethodsSlice';

import { 
    createPaymentMethodAPI, 
    updatePaymentMethodAPI, 
    deletePaymentMethodAPI 
} from '../../api';

export default function PaymentMethods() {
    const dispatch = useDispatch();

    const methods = useSelector(selectAllPaymentMethods);
    const { total, page: currentPage, totalPages } = useSelector(selectPaymentMethodsPagination);
    const status = useSelector(selectPaymentMethodsStatus);
    const error = useSelector(selectPaymentMethodsError);

    // SỬA: Đổi 'isActiveFilter' thành 'typeFilter'
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [typeFilter, setTypeFilter] = useState(''); // <-- ĐÃ SỬA
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);

    // SỬA: Fetch dữ liệu theo 'typeFilter'
    useEffect(() => {
        dispatch(fetchPaymentMethods({ page, limit: 10, keyword, type: typeFilter }));
    }, [page, keyword, typeFilter, dispatch]);
    
    const formik = useFormik({
        initialValues: {
            Code: '',
            Name: '',
            Type: 'OFFLINE',
            Provider: '',
            IsActive: true,
            ConfigJson: ''
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            Code: Yup.string().required('Mã là bắt buộc.'),
            Name: Yup.string().required('Tên là bắt buộc.'),
            Type: Yup.string().required('Loại là bắt buộc.'),
        }),
        onSubmit: async (values) => {
            try {
                if (isEdit) {
                    await updatePaymentMethodAPI(editingMethod.MethodID, values);
                    toast.success("Cập nhật thành công!");
                } else {
                    await createPaymentMethodAPI(values);
                    toast.success("Tạo mới thành công!");
                }
                setShowModal(false);
                setPage(1);
                // SỬA: Tải lại với filter 'type'
                dispatch(fetchPaymentMethods({ page: 1, limit: 10, keyword: '', type: typeFilter }));
            } catch (err) {
                toast.error(err.response?.data?.errors?.[0]?.msg || 'Thao tác thất bại.');
            }
        }
    });

    // --- Handlers ---
    const handleAdd = () => {
        setIsEdit(false);
        setEditingMethod(null);
        formik.resetForm();
        setShowModal(true);
    };

    const handleEdit = (method) => {
        setIsEdit(true);
        setEditingMethod(method);
        formik.setValues({
            Code: method.Code || '',
            Name: method.Name || '',
            Type: method.Type || 'OFFLINE',
            Provider: method.Provider || '',
            IsActive: method.IsActive,
            ConfigJson: method.ConfigJson || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa phương thức này?')) {
            try {
                await deletePaymentMethodAPI(id);
                toast.success("Đã xóa phương thức thanh toán.");

                if (methods.length === 1 && page > 1) {
                    setPage(page - 1); 
                } else {
                    // SỬA: Tải lại với filter 'type'
                    dispatch(fetchPaymentMethods({ page, limit: 10, keyword, type: typeFilter }));
                }
            } catch (err) {
                toast.error(err.response?.data?.errors?.[0]?.msg || 'Xóa thất bại.');
            }
        }
    };
    
    const handleSearch = () => {
        setPage(1);
        // useEffect sẽ tự fetch lại khi filter thay đổi
    };

    return (
        <Container fluid>
            <h2 className="my-3">Quản lý Phương thức Thanh toán</h2>
            {status === 'failed' && error && <Alert variant="danger">{error}</Alert>}

            <InputGroup className="mb-3">
                <Form.Control 
                    value={keyword} 
                    onChange={e => setKeyword(e.target.value)} 
                    placeholder="Tìm theo tên hoặc mã..." 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                {/* SỬA: Dropdown lọc theo Loại */}
                <Form.Select 
                    style={{ maxWidth: '200px' }} 
                    value={typeFilter} 
                    onChange={e => {
                        setTypeFilter(e.target.value);
                        setPage(1); // Reset về trang 1 khi đổi filter
                    }}
                >
                    <option value="">Tất cả loại</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ONLINE">ONLINE</option>
                </Form.Select>
                
                <Button onClick={handleSearch}>Tìm</Button>
                <Button variant="success" onClick={handleAdd} className="ms-2">Thêm mới</Button>
            </InputGroup>

            {status === 'loading' ? <div className="text-center p-5"><Spinner /></div> : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            {/* SỬA: Bỏ cột Trạng thái */}
                            <th>ID</th><th>Mã (Code)</th><th>Tên</th><th>Loại</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {methods.map(m => (
                            <tr key={m.MethodID}>
                                <td>{m.MethodID}</td>
                                <td><Badge bg="info">{m.Code}</Badge></td>
                                <td>{m.Name}</td>
                                <td>{m.Type}</td>
                                {/* SỬA: Bỏ cột Trạng thái */}
                                <td>
                                    <Button variant="outline-warning" size="sm" onClick={() => handleEdit(m)} className="me-2">Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m.MethodID)}>Xóa</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {totalPages > 1 && (
                <Pagination>
                    {[...Array(totalPages).keys()].map(num => (
                        <Pagination.Item key={num + 1} active={num + 1 === page} onClick={() => setPage(num + 1)}>{num + 1}</Pagination.Item>
                    ))}
                </Pagination>
            )}

            {/* Modal (Giữ nguyên) */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'Sửa' : 'Thêm'} Phương thức</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã (Code)*</Form.Label>
                            <Form.Control name="Code" {...formik.getFieldProps('Code')} isInvalid={formik.touched.Code && formik.errors.Code} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Code}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên*</Form.Label>
                            <Form.Control name="Name" {...formik.getFieldProps('Name')} isInvalid={formik.touched.Name && formik.errors.Name} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Name}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Loại*</Form.Label>
                            <Form.Select name="Type" {...formik.getFieldProps('Type')} isInvalid={formik.touched.Type && formik.errors.Type}>
                                <option value="OFFLINE">OFFLINE</option>
                                <option value="ONLINE">ONLINE</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formik.errors.Type}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nhà cung cấp (Provider)</Form.Label>
                            <Form.Control name="Provider" {...formik.getFieldProps('Provider')} isInvalid={formik.touched.Provider && formik.errors.Provider} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Config (JSON)</Form.Label>
                            <Form.Control as="textarea" rows={3} name="ConfigJson" {...formik.getFieldProps('ConfigJson')} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check type="switch" name="IsActive" label="Kích hoạt" checked={formik.values.IsActive} onChange={formik.handleChange} />
                        </Form.Group>
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">Hủy</Button>
                        <Button type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? <Spinner size="sm" /> : 'Lưu'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}