import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from "react-toastify";

// Import các action và selector từ Redux
import { logout, selectUser, changePassword, selectUserStatus, selectUserError, clearStatus } from "../../../redux/userSlice";
import "../../../styles/components/Header.css";

export default function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Lấy state từ Redux
    const user = useSelector(selectUser);
    const userStatus = useSelector(selectUserStatus);
    const userError = useSelector(selectUserError);

    // State cục bộ cho UI
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };
    
    // Formik cho form đổi mật khẩu
    const passwordFormik = useFormik({
        initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            oldPassword: Yup.string().required('Vui lòng nhập mật khẩu cũ.'),
            newPassword: Yup.string().required('Vui lòng nhập mật khẩu mới.').matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/, 'Mật khẩu yếu.'),
            confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu mới.')
        }),
        onSubmit: async (values, { resetForm }) => {
            const resultAction = await dispatch(changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword }));
            if (changePassword.fulfilled.match(resultAction)) {
                toast.success("Đổi mật khẩu thành công!");
                resetForm();
                setShowChangePassword(false);
            }
        }
    });

    const isLoading = userStatus === 'loading';
    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    const avatarUrl = user?.avatar || defaultAvatar;

    return (
        <header className="admin-header">
            <h3 className="logo">LilyShoe</h3>

            <div className="dropdown-wrapper" ref={dropdownRef}>
                <div className="user-info" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <img src={avatarUrl} alt="avatar" className="avatar" onError={(e) => { e.target.src = defaultAvatar; }} />
                    <span className="username">{user?.username || "Admin"}</span>
                </div>

                <ul className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
                    <li onClick={() => { setShowChangePassword(true); setDropdownOpen(false); }}>Đổi mật khẩu</li>
                    <li onClick={handleLogout}>Đăng xuất</li>
                </ul>
            </div>

            {/* Modal đổi mật khẩu */}
            <Modal show={showChangePassword} onHide={() => setShowChangePassword(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Đổi mật khẩu</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {userStatus === 'failed' && userError && <Alert variant="danger">{userError}</Alert>}
                    <Form noValidate onSubmit={passwordFormik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu cũ</Form.Label>
                            <Form.Control type="password" name="oldPassword" {...passwordFormik.getFieldProps('oldPassword')} isInvalid={passwordFormik.touched.oldPassword && passwordFormik.errors.oldPassword} />
                            <Form.Control.Feedback type="invalid">{passwordFormik.errors.oldPassword}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mật khẩu mới</Form.Label>
                            <Form.Control type="password" name="newPassword" {...passwordFormik.getFieldProps('newPassword')} isInvalid={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword} />
                            <Form.Control.Feedback type="invalid">{passwordFormik.errors.newPassword}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                            <Form.Control type="password" name="confirmPassword" {...passwordFormik.getFieldProps('confirmPassword')} isInvalid={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword} />
                            <Form.Control.Feedback type="invalid">{passwordFormik.errors.confirmPassword}</Form.Control.Feedback>
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => setShowChangePassword(false)} className="me-2">Hủy</Button>
                            <Button variant="primary" type="submit" disabled={isLoading}>
                                {isLoading ? <Spinner size="sm" /> : 'Xác nhận'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </header>
    );
}