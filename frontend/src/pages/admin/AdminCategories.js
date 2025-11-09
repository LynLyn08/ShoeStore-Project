import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Modal, Form, InputGroup, Spinner, Alert, Container, Pagination, Row, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { 
    fetchAdminCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../../redux/adminCategoriesSlice';

export default function AdminCategories() {
    const dispatch = useDispatch();
    const { categories, pagination, status, error } = useSelector((state) => state.adminCategories);
    
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [targetGroup, setTargetGroup] = useState(''); // SỬA: Thêm state cho bộ lọc
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        // SỬA: Gửi cả targetGroup đi
        dispatch(fetchAdminCategories({ page, limit: 10, keyword, targetGroup }));
    }, [page, keyword, targetGroup, dispatch]); // SỬA: Thêm targetGroup vào dependency

    const formik = useFormik({
        initialValues: { Name: '', TargetGroup: '', Description: '' },
        enableReinitialize: true,
        validationSchema: Yup.object({
            Name: Yup.string().required('Tên danh mục là bắt buộc.'),
            TargetGroup: Yup.string().required('Nhóm mục tiêu là bắt buộc.'),
            Description: Yup.string().optional().max(255, 'Tối đa 255 ký tự.'),
        }),
        onSubmit: async (values) => {
            const action = isEdit 
                ? updateCategory({ id: editingCategory.CategoryID, categoryData: values })
                : createCategory(values);
            
            const resultAction = await dispatch(action);

            if (createCategory.fulfilled.match(resultAction) || updateCategory.fulfilled.match(resultAction)) {
                setShowModal(false);
                // Slice đã tự cập nhật, không cần fetch lại
            }
        }
    });

    const handleAdd = () => {
        setIsEdit(false);
        setEditingCategory(null);
        formik.resetForm();
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setIsEdit(true);
        setEditingCategory(category);
        formik.setValues({
            Name: category.Name,
            TargetGroup: category.TargetGroup,
            Description: category.Description || ''
        });
        setShowModal(true);
    };
    
    const handleDelete = (id, name) => {
        if (window.confirm(`Xác nhận xóa danh mục "${name}"? Thao tác này sẽ thất bại nếu danh mục có sản phẩm liên quan.`)) {
            dispatch(deleteCategory(id));
        }
    };
    
    // Đã xóa handleToggle

    return (
        <Container fluid>
            <h2 className="my-3">Quản lý Danh mục</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* SỬA: Thêm Row/Col và Dropdown lọc */}
            <Row className="mb-3">
                <Col md={5}>
                    <InputGroup>
                        <Form.Control 
                            value={keyword} 
                            onChange={e => setKeyword(e.target.value)} 
                            placeholder="Tìm theo tên hoặc mô tả..." 
                            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                        />
                        <Button onClick={() => setPage(1)}>Tìm</Button>
                    </InputGroup>
                </Col>
                <Col md={4}>
                    <Form.Select 
                        value={targetGroup} 
                        onChange={e => { setTargetGroup(e.target.value); setPage(1); }}
                    >
                        <option value="">Tất cả các nhóm</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Unisex">Unisex</option>
                    </Form.Select>
                </Col>
            </Row>
            
            <Button variant="success" onClick={handleAdd} className="mb-3">Thêm danh mục</Button>

            {status === 'loading' ? <div className="text-center p-5"><Spinner /></div> : (
                <Table striped bordered hover responsive>
                    {/* SỬA: Bỏ cột Trạng thái */}
                    <thead><tr><th>ID</th><th>Tên</th><th>Nhóm</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c.CategoryID}>
                                <td>{c.CategoryID}</td>
                                <td>{c.Name}</td>
                                <td>{c.TargetGroup}</td>
                                {/* SỬA: Bỏ cột Trạng thái */}
                                <td>
                                    <Button variant="outline-warning" size="sm" onClick={() => handleEdit(c)} className="me-2">Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c.CategoryID, c.Name)} className="me-2">Xóa</Button>
                                    {/* SỬA: Bỏ nút Toggle */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Phân trang (Đã có sẵn và đúng) */}
            {pagination.totalPages > 1 && (
                <Pagination>
                    {[...Array(pagination.totalPages).keys()].map(num => (
                        <Pagination.Item key={num + 1} active={num + 1 === page} onClick={() => setPage(num + 1)}>{num + 1}</Pagination.Item>
                    ))}
                </Pagination>
            )}
            
            {/* Modal (Giữ nguyên) */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>{isEdit ? 'Sửa' : 'Thêm'} danh mục</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên danh mục*</Form.Label>
                            <Form.Control name="Name" {...formik.getFieldProps('Name')} isInvalid={formik.touched.Name && formik.errors.Name} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Name}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nhóm mục tiêu*</Form.Label>
                            <Form.Select name="TargetGroup" {...formik.getFieldProps('TargetGroup')} isInvalid={formik.touched.TargetGroup && formik.errors.TargetGroup}>
                                <option value="">Chọn</option>
                                <option value="Men">Men</option><option value="Women">Women</option>
                                <option value="Kids">Kids</option><option value="Unisex">Unisex</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formik.errors.TargetGroup}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control as="textarea" rows={3} name="Description" {...formik.getFieldProps('Description')} isInvalid={formik.touched.Description && formik.errors.Description} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Description}</Form.Control.Feedback>
                        </Form.Group>
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">Hủy</Button>
                        <Button variant="primary" type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? <Spinner size="sm"/> : 'Lưu'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}