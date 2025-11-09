import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { BsPerson, BsEnvelope, BsLock, BsTelephone, BsGeoAlt, BsEye, BsEyeSlash } from 'react-icons/bs';

// Import action, selectors, và reducer mới
import { registerUser, selectUserStatus, selectUserError, clearStatus } from '../../redux/userSlice';

// Sử dụng Formik và Yup để validation chuyên nghiệp hơn
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Lấy trạng thái từ Redux store
    const authStatus = useSelector(selectUserStatus);
    const authError = useSelector(selectUserError);

    const [successMsg, setSuccessMsg] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    // Dọn dẹp status và error của Redux khi component unmount (rời khỏi trang)
    useEffect(() => {
        return () => {
            dispatch(clearStatus());
        };
    }, [dispatch]);

    // Cấu hình Formik để quản lý form và validation bằng Yup
    const formik = useFormik({
        initialValues: {
            Username: '',
            Email: '',
            Password: '',
            FullName: '',
            Phone: '',
            Address: '',
        },
        validationSchema: Yup.object({
            Username: Yup.string()
                .required('Vui lòng nhập Username.')
                .matches(/^[a-zA-Z0-9_.-]{3,30}$/, 'Username 3–30 ký tự, chỉ a-z, A-Z, 0-9, _ . -'),
            Email: Yup.string()
                .email('Email không đúng định dạng.')
                .required('Vui lòng nhập Email.'),
            Password: Yup.string()
                .required('Vui lòng nhập Mật khẩu.')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, 'Mật khẩu ≥8 ký tự, gồm chữ HOA, thường, số và ký tự đặc biệt.'),
           // Sửa ở đây: Xóa .required()
    FullName: Yup.string().min(2, 'Họ tên tối thiểu 2 ký tự.'),
    Phone: Yup.string().matches(/^0(3|5|7|8|9)\d{8}$/, 'SĐT phải 10 số, bắt đầu 03/05/07/08/09.'),
    Address: Yup.string().min(5, 'Địa chỉ tối thiểu 5 ký tự.'),
        }),
        onSubmit: async (values) => {
            // Khi form hợp lệ và được submit, dispatch action đăng ký
            const resultAction = await dispatch(registerUser(values));

            // Kiểm tra nếu action thành công
            if (registerUser.fulfilled.match(resultAction)) {
                setSuccessMsg('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
                setTimeout(() => navigate('/login', { replace: true }), 1500);
            }
            // Lỗi sẽ được Redux tự động xử lý và hiển thị qua `authError`
        },
    });

    const isLoading = authStatus === 'loading';

    const styles = (
        <style>{`
          .auth-bg { min-height: 100vh; background: #fce0ea; } .auth-card { max-width: 980px; width: 100%; background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,.08); overflow:hidden; } .auth-split { display:grid; grid-template-columns:1fr 1fr; } .auth-left { display:flex; align-items:center; justify-content:center; padding:48px 24px; position:relative; background:#fff; } .auth-left::after { content:""; position:absolute; right:0; top:0; height:100%; width:1px; background:#eee; } .brand-box { text-align:center; } .brand-logo { width:120px; height:120px; display:block; margin:0 auto 12px; object-fit:contain; } .brand-name { font-weight:600; letter-spacing:3px; } .auth-right { padding:48px 42px; background:#fff; } .auth-title { color:#c71857; font-weight:700; font-size:22px; text-align:center; margin-bottom:8px; } .auth-sub { color:#777; text-align:center; margin-bottom:22px; font-size:14px; } .pill { height: 42px; border-radius: 10px; } .pill:focus { box-shadow:0 0 0 .2rem rgba(199,24,87,.15); border-color:#f1b4c9; } .ig-text { background:#fff; border-right:0; display:flex; align-items:center; } .ig-text > svg { font-size:1rem; } .ig-control { border-left:0; } .form-control.is-invalid, .ig-control.is-invalid { background-image: none !important; } .btn-primary-auth { background:#d81b60; border-color:#d81b60; height:42px; border-radius:999px; font-weight:600; } @media (max-width:768px) { .auth-split{ grid-template-columns:1fr; } .auth-left::after{ display:none; } .auth-right{ padding:32px 22px; } }
        `}</style>
    );

    return (
        <div className="auth-bg d-flex align-items-center justify-content-center py-5">
            {styles}
            <div className="auth-card">
                <div className="auth-split">
                    <div className="auth-left">
                        <div className="brand-box">
                            <img className="brand-logo" src="/logo-shoe.png" alt="Lily & Lage SHOES" onError={(e)=>{ e.currentTarget.style.display='none'; }}/>
                            <div className="brand-name">L I L Y &nbsp; &amp; &nbsp; L A G E</div>
                            <div style={{ letterSpacing: 6, color: '#999', marginTop: 6 }}>S H O E S</div>
                        </div>
                    </div>

                    <div className="auth-right">
                        <div className="auth-title">Sign Up</div>
                        <div className="auth-sub">Create your account to continue</div>
                        
                        {authStatus === 'failed' && authError && <Alert variant="danger">{authError}</Alert>}
                        {successMsg && <Alert variant="success">{successMsg}</Alert>}
                        
                        <Form noValidate onSubmit={formik.handleSubmit}>
                            {/* Username */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsPerson /></InputGroup.Text>
                                    <Form.Control
                                        name="Username"
                                        className="ig-control pill"
                                        placeholder="Username"
                                        {...formik.getFieldProps('Username')}
                                        isInvalid={formik.touched.Username && formik.errors.Username}
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.Username}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            {/* Email */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsEnvelope /></InputGroup.Text>
                                    <Form.Control
                                        name="Email"
                                        type="email"
                                        className="ig-control pill"
                                        placeholder="Email"
                                        {...formik.getFieldProps('Email')}
                                        isInvalid={formik.touched.Email && formik.errors.Email}
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.Email}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            {/* Password */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsLock /></InputGroup.Text>
                                    <Form.Control
                                        name="Password"
                                        type={showPwd ? 'text' : 'password'}
                                        className="ig-control pill"
                                        placeholder="Password"
                                        {...formik.getFieldProps('Password')}
                                        isInvalid={formik.touched.Password && formik.errors.Password}
                                    />
                                    <InputGroup.Text as="button" type="button" onClick={() => setShowPwd(v => !v)} className="ig-text pill" style={{cursor:'pointer'}}>
                                        {showPwd ? <BsEyeSlash /> : <BsEye />}
                                    </InputGroup.Text>
                                    <Form.Control.Feedback type="invalid">{formik.errors.Password}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            {/* Full Name */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsPerson /></InputGroup.Text>
                                    <Form.Control
                                        name="FullName"
                                        className="ig-control pill"
                                        placeholder="Full Name"
                                        {...formik.getFieldProps('FullName')}
                                        isInvalid={formik.touched.FullName && formik.errors.FullName}
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.FullName}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            {/* Phone */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsTelephone /></InputGroup.Text>
                                    <Form.Control
                                        name="Phone"
                                        type="tel"
                                        className="ig-control pill"
                                        placeholder="Phone"
                                        {...formik.getFieldProps('Phone')}
                                        isInvalid={formik.touched.Phone && formik.errors.Phone}
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.Phone}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            {/* Address */}
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsGeoAlt /></InputGroup.Text>
                                    <Form.Control
                                        name="Address"
                                        className="ig-control pill"
                                        placeholder="Address"
                                        {...formik.getFieldProps('Address')}
                                        isInvalid={formik.touched.Address && formik.errors.Address}
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.Address}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            <Button type="submit" className="w-100 mt-2 btn-primary-auth" disabled={isLoading}>
                                {isLoading ? <Spinner size="sm" animation="border" /> : 'Sign Up'}
                            </Button>
                            
                            <div className="text-center mt-3" style={{ fontSize: 13, color: '#666' }}>
                                Already have an account? <Link to="/login">Login</Link>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}