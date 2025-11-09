import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Modal, Form, Spinner, Alert, Container, Pagination, InputGroup, Image } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { 
    fetchAdminBlogs, 
    deleteBlog,
    selectAdminBlogs,
    selectAdminBlogsPagination,
    selectAdminBlogsStatus,
    selectAdminBlogsError
} from '../../redux/adminBlogsSlice';
import { createBlogAPI, updateBlogAPI, getBlogByIdAdminAPI } from '../../api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AdminBlogs() {
    const dispatch = useDispatch();
    const { blogs, pagination, status, error } = useSelector(state => state.adminBlogs);
    
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ keyword: '', status: 'all', date: null });
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        const params = { page, limit: 10, keyword: filters.keyword, status: filters.status };
        
        if (filters.date) {
            const date = filters.date; // Đây là đối tượng Date từ DatePicker
            
            // Lấy các giá trị theo giờ địa phương
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0'); // +1 vì tháng (month) bắt đầu từ 0
            const d = String(date.getDate()).padStart(2, '0');
            
            // Tạo chuỗi "YYYY-MM-DD" đúng
            params.date = `${y}-${m}-${d}`; // Sẽ gửi đi "2025-11-08"
        }
        
        dispatch(fetchAdminBlogs(params));
    }, [page, filters, dispatch]);
    
    const formik = useFormik({
        initialValues: { Title: '', Content: '', Author: '', IsActive: true },
        enableReinitialize: true,
        validationSchema: Yup.object({
            Title: Yup.string().required('Tiêu đề là bắt buộc.'),
            Content: Yup.string().required('Nội dung là bắt buộc.'),
            // SỬA LỖI: .allow('') không phải là hàm của Yup, dùng .nullable() để cho phép rỗng
            Author: Yup.string().nullable(),
            IsActive: Yup.boolean()
        }),
        onSubmit: async (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => formData.append(key, values[key]));
            if (imageFile) formData.append('image', imageFile);

            try {
                if (isEdit) {
                    await updateBlogAPI(editingBlog.BlogID, formData);
                    toast.success("Cập nhật bài viết thành công!");
                } else {
                    await createBlogAPI(formData);
                    toast.success("Tạo bài viết thành công!");
                }
                setShowModal(false);
                dispatch(fetchAdminBlogs({ page: 1, limit: 10, keyword: '', status: 'all', date: null })); // Reset filters
            } catch (err) {
                toast.error(err.response?.data?.errors?.[0]?.msg || 'Thao tác thất bại.');
            }
        }
    });

    const handleAdd = () => {
        setIsEdit(false);
        setEditingBlog(null);
        formik.resetForm();
        setImageFile(null);
        setShowModal(true);
    };

    const handleEdit = async (blog) => {
        try {
            const { data } = await getBlogByIdAdminAPI(blog.BlogID);
            setIsEdit(true);
            setEditingBlog(data);
            formik.setValues({
                Title: data.Title,
                Content: data.Content,
                Author: data.Author || '',
                IsActive: data.IsActive,
            });
            setImageFile(null);
            setShowModal(true);
        } catch (err) {
            toast.error("Không thể tải chi tiết bài viết.");
        }
    };
    
    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
            dispatch(deleteBlog(id));
        }
    };

    return (
        <Container fluid>
            <h2 className="my-3">Quản lý Blog</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <InputGroup className="mb-3">
                <Form.Control 
                    value={filters.keyword} 
                    onChange={e => setFilters({...filters, keyword: e.target.value})} 
                    placeholder="Tìm kiếm theo tiêu đề, tác giả..." 
                />
                <Form.Select 
                    style={{ maxWidth: '150px' }}
                    value={filters.status} 
                    onChange={e => setFilters({...filters, status: e.target.value})}
                >
                    <option value="all">Tất cả</option>
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                </Form.Select>
                <DatePicker 
                    selected={filters.date} 
                    onChange={date => setFilters({...filters, date})} 
                    className="form-control" 
                    placeholderText="Chọn ngày đăng" 
                    isClearable 
                    dateFormat="dd/MM/yyyy"
                />
                <Button variant="success" onClick={handleAdd}>Thêm Blog</Button>
            </InputGroup>

            {status === 'loading' ? <Spinner /> : (
                <Table striped bordered hover responsive>
                    <thead><tr><th>ID</th><th>Tiêu đề</th><th>Tác giả</th><th>Ngày đăng</th><th>Ảnh</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {blogs.map(blog => (
                            <tr key={blog.BlogID}>
                                <td>{blog.BlogID}</td><td>{blog.Title}</td><td>{blog.Author || 'N/A'}</td>
                                <td>{new Date(blog.CreatedAt).toLocaleDateString('vi-VN')}</td>
                                <td>{blog.ImageURL && <Image src={`${API_BASE_URL}${blog.ImageURL}`} width="50" thumbnail />}</td>
                                <td><span className={`badge ${blog.IsActive ? 'bg-success' : 'bg-secondary'}`}>{blog.IsActive ? 'Hiển thị' : 'Ẩn'}</span></td>
                                <td>
                                    <Button variant="outline-warning" size="sm" onClick={() => handleEdit(blog)} className="me-2">Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(blog.BlogID)}>Xóa</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            
            {pagination.totalPages > 1 && (
                <Pagination>
                    {[...Array(pagination.totalPages).keys()].map(num => <Pagination.Item key={num+1} active={num+1 === page} onClick={() => setPage(num+1)}>{num+1}</Pagination.Item>)}
                </Pagination>
            )}
            
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>{isEdit ? 'Sửa' : 'Thêm'} Blog</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3"><Form.Label>Tiêu đề*</Form.Label><Form.Control name="Title" {...formik.getFieldProps('Title')} isInvalid={formik.touched.Title && formik.errors.Title} /><Form.Control.Feedback type="invalid">{formik.errors.Title}</Form.Control.Feedback></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Nội dung*</Form.Label><Form.Control as="textarea" rows={10} name="Content" {...formik.getFieldProps('Content')} isInvalid={formik.touched.Content && formik.errors.Content} /><Form.Control.Feedback type="invalid">{formik.errors.Content}</Form.Control.Feedback></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Tác giả</Form.Label><Form.Control name="Author" {...formik.getFieldProps('Author')} isInvalid={formik.touched.Author && formik.errors.Author} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Hình ảnh</Form.Label><Form.Control type="file" onChange={(e) => setImageFile(e.target.files[0])} /></Form.Group>
                        {isEdit && editingBlog?.ImageURL && (
                            <Form.Group className="mb-3">
                                <Form.Label>Ảnh hiện tại:</Form.Label>
                                <div><Image src={`${API_BASE_URL}${editingBlog.ImageURL}`} width="100" thumbnail /></div>
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3"><Form.Label>Trạng thái</Form.Label><Form.Check type="switch" name="IsActive" label={formik.values.IsActive ? "Hiển thị" : "Ẩn"} checked={formik.values.IsActive} onChange={formik.handleChange} /></Form.Group>
                        <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">Hủy</Button>
                        <Button variant="primary" type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? <Spinner size="sm" /> : 'Lưu'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
}