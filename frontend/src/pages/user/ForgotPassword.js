import { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { BsEnvelope } from "react-icons/bs";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from "react-toastify";

import { requestPasswordReset, selectUserStatus, selectUserError, clearStatus } from "../../redux/userSlice";

export default function ForgotPassword() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const status = useSelector(selectUserStatus);
    const error = useSelector(selectUserError);

    const [cooldown, setCooldown] = useState(0);

    // Đếm ngược cho nút "Gửi lại OTP"
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown((s) => s - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);
    
    // Dọn dẹp trạng thái Redux khi rời khỏi trang
    useEffect(() => {
        return () => { dispatch(clearStatus()) };
    }, [dispatch]);

    const formik = useFormik({
        initialValues: { email: '' },
        validationSchema: Yup.object({
            email: Yup.string().email('Email không hợp lệ.').required('Vui lòng nhập Email đã đăng ký.'),
        }),
        onSubmit: async (values) => {
            if (cooldown > 0) return;
            
            const resultAction = await dispatch(requestPasswordReset(values.email));
            
            if (requestPasswordReset.fulfilled.match(resultAction)) {
                toast.success(resultAction.payload.message || "OTP đã được gửi đến email của bạn!");
                setCooldown(60);
                setTimeout(() => {
                    navigate("/reset-password", { state: { email: values.email } });
                }, 1500);
            }
            // Lỗi sẽ tự động được hiển thị qua `userError`
        },
    });

    const isLoading = status === 'loading';
    return (
        <div className="auth-bg d-flex align-items-center justify-content-center py-5">
            <style>{`
        .auth-bg { min-height: 100vh; background: #fce0ea; }
        .auth-card { max-width: 980px; width: 100%; background: #ffffff; border-radius: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
        .auth-split { display: grid; grid-template-columns: 1fr 1fr; }
        .auth-left { display:flex; align-items:center; justify-content:center; padding: 48px 24px; position: relative; }
        .auth-left::after { content: ""; position: absolute; right: 0; top: 0; height: 100%; width: 1px; background: #eee; }
        .brand-box { text-align:center; }
        .brand-logo { width: 120px; height: 120px; display:block; margin: 0 auto 12px; object-fit: contain; }
        .brand-name { font-weight: 600; letter-spacing: 3px; }
        .auth-right { padding: 48px 42px; }
        .auth-title { color: #c71857; font-weight: 700; font-size: 22px; text-align:center; margin-bottom: 8px; }
        .auth-sub { color:#777; text-align:center; margin-bottom: 22px; font-size: 14px; }

        /* Ô input có icon: dùng InputGroup để icon luôn căn giữa dọc */
        .pill { height: 42px; border-radius: 10px; }
        .pill:focus { box-shadow: 0 0 0 0.2rem rgba(199,24,87,0.15); border-color: #f1b4c9; }
        .ig-text { background:#fff; border-right:0; display:flex; align-items:center; }
        .ig-text > svg { font-size: 1rem; } /* cỡ icon đồng nhất */
        .ig-control { border-left:0; }

        .form-control.is-invalid, .ig-control.is-invalid { background-image: none !important; }
        .btn-primary-auth { background: #d81b60; border-color: #d81b60; height: 42px; border-radius: 999px; font-weight: 600; }
        .btn-outline-auth { border-color:#d81b60; color:#d81b60; height:42px; border-radius:999px; font-weight:600; background:#fff; }
        .btn-outline-auth:hover { background:#ffe2ec; border-color:#d81b60; color:#c71857; }
        .small-links { display:flex; align-items:center; justify-content:space-between; margin-top: 8px; font-size: 13px; }
        .small-links a { color:#d81b60; text-decoration:none; }
        .back-line { text-align:center; margin-top: 14px; font-size: 13px; color:#666; }
        .back-line a { color:#d81b60; text-decoration:none; }

        @media (max-width: 768px) {
          .auth-split { grid-template-columns: 1fr; }
          .auth-left::after { display:none; }
          .auth-right { padding: 32px 22px; }
        }
      `}</style>
            <div className="auth-card">
                 <div className="auth-split">
          {/* Cột trái: Brand */}
          <div className="auth-left">
            <div className="brand-box">
              <img
                className="brand-logo"
                src="/logo-shoe.png"
                alt="Lily & Lage SHOES"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="brand-name">L I L Y &nbsp; &amp; &nbsp; L A G E</div>
              <div style={{ letterSpacing: 6, color: '#999', marginTop: 6 }}>S H O E S</div>
            </div>
          </div>
             {/* Cột phải: Form Forgot Password */}
                    <div className="auth-right">
                        <div className="auth-title">Forgot Password</div>
                        <div className="auth-sub">Nhập email đã đăng ký để nhận mã OTP.</div>

                        {status === 'failed' && error && <Alert variant="danger">{error}</Alert>}

                        <Form noValidate onSubmit={formik.handleSubmit}>
                            <Form.Group className="mb-3">
                                <InputGroup hasValidation>
                                    <InputGroup.Text className="ig-text pill"><BsEnvelope /></InputGroup.Text>
                                    <Form.Control
                                        name="email"
                                        type="email"
                                        placeholder="Email đã đăng ký"
                                        {...formik.getFieldProps('email')}
                                        isInvalid={formik.touched.email && formik.errors.email}
                                        autoFocus
                                    />
                                    <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            <Button type="submit" className="w-100 btn-primary-auth" disabled={isLoading || cooldown > 0}>
                                {isLoading ? <Spinner size="sm" /> : (cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi OTP")}
                            </Button>

                            <div className="small-links mt-2">
                                <span></span>
                                <Link to="/login">Quay lại đăng nhập</Link>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}