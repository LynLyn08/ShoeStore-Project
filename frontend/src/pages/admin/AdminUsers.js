// frontend/src/pages/admin/AdminUsers.js (Đã xóa 2FA và Modal Reset Pass)
import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button, Modal, Form, InputGroup, Spinner, Alert, Row, Col, Container, Pagination, Image, Badge } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
// XÓA: FaShieldAlt
import { FaPen, FaTrashAlt, FaKey } from 'react-icons/fa'; 

import {
    fetchUsers,
    fetchUserDetail,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    // XÓA: toggleUser2FA
    selectAdminUsers,
    selectAdminUsersPagination,
    selectAdminUsersStatus,
    selectAdminUsersError,
    selectCurrentUserDetail
} from '../../redux/adminUsersSlice';
import { selectUser } from '../../redux/userSlice';

// --- CÁC HÀM HELPER ---
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const resolveAvatarUrl = (url) => {
    if (!url) {
        return '/default-avatar.png';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `${API_BASE_URL}${url}`;
};

const fmtVND = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
// --- KẾT THÚC HELPER ---

function AdminUsers() {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    
    const users = useSelector(selectAdminUsers);
    const { total, totalPages } = useSelector(selectAdminUsersPagination);
    const status = useSelector(selectAdminUsersStatus);
    const error = useSelector(selectAdminUsersError);
    const { details: detailUser, orders, status: detailStatus } = useSelector(selectCurrentUserDetail);
    const loggedInUser = useSelector(selectUser);

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    // XÓA: Không cần modal reset
    // const [showResetModal, setShowResetModal] = useState(false);
    // const [resetUserId, setResetUserId] = useState(null);

    useEffect(() => {
        dispatch(fetchUsers({ page, limit: 10, keyword }));
    }, [dispatch, page, keyword]);

    const handleSearch = (e) => {
        e.preventDefault();
        const searchKeyword = e.target.elements.search.value;
        setKeyword(searchKeyword);
        setPage(1);
    };

    const validationSchema = useMemo(() => Yup.object({
        Username: Yup.string().matches(/^[a-zA-Z0-9_]{4,20}$/, 'Tên đăng nhập 4-20 ký tự (chữ, số, _).').required('Bắt buộc'),
        Email: Yup.string().email('Email không hợp lệ').required('Bắt buộc'),
        Password: Yup.string().when('isEdit', {
            is: false,
            then: (schema) => schema.required('Mật khẩu là bắt buộc khi tạo mới').matches(passwordRegex, 'Mật khẩu yếu (8+ ký tự, Hoa, thường, số, đặc biệt)'),
            otherwise: (schema) => schema.nullable()
        }),
        Role: Yup.string().required('Bắt buộc'),
        FullName: Yup.string().nullable(),
        Phone: Yup.string().matches(/(^$)|(^(0|\+84)(3|5|7|8|9)[0-9]{8}$)/, 'Số điện thoại không hợp lệ.').nullable(),
        Address: Yup.string().nullable(),
        avatar: Yup.mixed().nullable()
    }), []);

    const formik = useFormik({
        initialValues: {
            UserID: null, Username: '', Email: '', Password: '', Role: 'user', FullName: '', Phone: '', Address: '', avatar: null, isEdit: false
        },
        validationSchema,
        onSubmit: async (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (key !== 'isEdit' && key !== 'avatar' && key !== 'UserID' && values[key] !== null && values[key] !== '') {
                    formData.append(key, values[key]);
                }
            });
            
            if (values.avatar) {
                formData.append('avatar', values.avatar);
            }

            let resultAction;
            if (isEdit) {
                resultAction = await dispatch(updateUser({ userId: values.UserID, formData }));
            } else {
                resultAction = await dispatch(createUser(formData));
            }
            
            if (createUser.fulfilled.match(resultAction) || updateUser.fulfilled.match(resultAction)) {
                 setShowModal(false);
            }
        },
    });

    // --- Handlers (Sử dụng Redux) ---
    const handleAdd = () => {
        setIsEdit(false);
        formik.resetForm({ values: { ...formik.initialValues, isEdit: false } });
        setAvatarPreview(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setIsEdit(true);
        formik.resetForm({ values: { ...user, Password: '', isEdit: true, avatar: null } }); 
        setAvatarPreview(resolveAvatarUrl(user.AvatarURL));
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (id === loggedInUser.userId) {
            toast.error('Không thể xóa tài khoản đang đăng nhập.');
            return;
        }
        if (window.confirm('Xác nhận xóa người dùng?')) {
            dispatch(deleteUser(id));
        }
    };

    // XÓA: Xóa hàm handleToggle2FA

    // SỬA: Logic hàm reset pass
    const handleResetPassword = (id) => {
        if (window.confirm('Bạn có chắc muốn gửi email reset mật khẩu cho người dùng này?')) {
            dispatch(resetUserPassword(id));
        }
    };

    const handleShowDetail = (id) => {
        dispatch(fetchUserDetail(id));
        setShowDetailModal(true);
    };

    const handleActionClick = (e, callback) => {
        e.stopPropagation();
        callback();
    };

    return (
        <Container fluid className="admin-user-container">
            <h2>Quản lý Người dùng</h2>
            {status === 'failed' && <Alert variant="danger">{error || 'Lỗi tải dữ liệu người dùng.'}</Alert>}
            
            <Form onSubmit={handleSearch} className="mb-3">
                <InputGroup>
                    <Form.Control name="search" placeholder="Tìm theo tên, email..." />
                    <Button variant="primary" type="submit">Tìm</Button>
                </InputGroup>
            </Form>
            
            <Button variant="success" onClick={handleAdd} className="mb-3">Thêm người dùng</Button>

            {status === 'loading' ? <Spinner /> : (
                <Table striped hover responsive className="admin-user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Avatar</th>
                            <th>Tên đăng nhập</th>
                            <th>Email</th>
                            <th>Quyền</th>
                            {/* XÓA: Cột 2FA */}
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.UserID} onClick={() => handleShowDetail(u.UserID)} style={{ cursor: 'pointer' }}>
                                <td>{u.UserID}</td>
                                <td><Image src={resolveAvatarUrl(u.AvatarURL)} alt="Avatar" width="40" roundedCircle /></td>
                                <td>{u.Username}</td>
                                <td>{u.Email}</td>
                                <td><Badge bg={u.Role === 'admin' ? 'danger' : 'secondary'}>{u.Role}</Badge></td>
                                {/* XÓA: Cột 2FA */}
                                <td className="admin-user-actions">
                                    <Button variant="outline-warning" size="sm" onClick={(e) => handleActionClick(e, () => handleEdit(u))} title="Sửa"><FaPen /></Button>
                                    <Button variant="outline-danger" size="sm" onClick={(e) => handleActionClick(e, () => handleDelete(u.UserID))} disabled={u.UserID === loggedInUser.userId} title="Xóa"><FaTrashAlt /></Button>
                                    {/* SỬA: Nút reset giờ gọi thẳng dispatch */}
                                    <Button variant="outline-primary" size="sm" onClick={(e) => handleActionClick(e, () => handleResetPassword(u.UserID))} title="Reset mật khẩu"><FaKey /></Button>
                                    {/* XÓA: Nút 2FA */}
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

            {/* Modal Thêm/Sửa */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                {/* ... (Giữ nguyên nội dung modal Thêm/Sửa) ... */}
                <Modal.Header closeButton>
                    <Modal.Title>{isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên đăng nhập</Form.Label>
                            <Form.Control name="Username" {...formik.getFieldProps('Username')} isInvalid={formik.touched.Username && formik.errors.Username} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Username}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control name="Email" {...formik.getFieldProps('Email')} isInvalid={formik.touched.Email && formik.errors.Email} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Email}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu {isEdit && '(Để trống nếu không đổi)'}</Form.Label>
                            <Form.Control name="Password" type="password" {...formik.getFieldProps('Password')} isInvalid={formik.touched.Password && formik.errors.Password} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Password}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Quyền</Form.Label>
                            <Form.Select name="Role" {...formik.getFieldProps('Role')} isInvalid={formik.touched.Role && formik.errors.Role}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formik.errors.Role}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên đầy đủ</Form.Label>
                            <Form.Control name="FullName" {...formik.getFieldProps('FullName')} isInvalid={formik.touched.FullName && formik.errors.FullName} />
                            <Form.Control.Feedback type="invalid">{formik.errors.FullName}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>SĐT</Form.Label>
                            <Form.Control name="Phone" {...formik.getFieldProps('Phone')} isInvalid={formik.touched.Phone && formik.errors.Phone} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Phone}</Form.Control.Feedback>
                        </Form.Group>
                         <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ</Form.Label>
                            <Form.Control name="Address" {...formik.getFieldProps('Address')} isInvalid={formik.touched.Address && formik.errors.Address} />
                            <Form.Control.Feedback type="invalid">{formik.errors.Address}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Avatar</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={(e) => {
                                const file = e.currentTarget.files[0];
                                if (file) {
                                    formik.setFieldValue('avatar', file);
                                    setAvatarPreview(URL.createObjectURL(file));
                                }
                            }} />
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="Preview" width="100" className="mt-2" rounded />
                            ) : (
                                isEdit && formik.values.AvatarURL && <Image src={resolveAvatarUrl(formik.values.AvatarURL)} alt="Current" width="100" className="mt-2" rounded />
                            )}
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? <Spinner size="sm" /> : (isEdit ? 'Cập nhật' : 'Thêm')}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal Chi tiết */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết: {detailUser?.Username}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detailStatus === 'loading' ? <Spinner /> : detailUser && (
                        <>
                            <Row>
                                <Col md={4}><Image src={resolveAvatarUrl(detailUser.AvatarURL)} alt="Avatar" fluid rounded /></Col>
                                <Col md={8}>
                                    <p><strong>Email:</strong> {detailUser.Email}</p>
                                    <p><strong>Quyền:</strong> {detailUser.Role}</p>
                                    <p><strong>Tên đầy đủ:</strong> {detailUser.FullName}</p>
                                    <p><strong>SĐT:</strong> {detailUser.Phone}</p>
                                    <p><strong>Địa chỉ:</strong> {detailUser.Address}</p>
                                    {/* XÓA: Dòng 2FA */}
                                </Col>
                            </Row>
                            <h4 className="mt-4">Đơn hàng gần đây</h4>
                            {/* ... (Giữ nguyên bảng đơn hàng) ... */}
                            <Table striped bordered hover>
                                <thead><tr><th>ID</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th></tr></thead>
                                <tbody>
                                    {orders && orders.length > 0 ? orders.map(o => (
                                        <tr key={o.OrderID}>
                                            <td>{o.OrderID}</td>
                                            <td>{fmtVND(o.TotalAmount)}</td>
                                            <td>{o.Status}</td>
                                            <td>{new Date(o.OrderDate).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    )) : <tr><td colSpan="4">Không có đơn hàng.</td></tr>}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* XÓA: Xóa Modal Reset Mật khẩu */}

        </Container>
    );
}

export default AdminUsers;