import { useEffect, useState } from "react";
import { Form, Button, Alert, Spinner, InputGroup } from "react-bootstrap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BsEnvelope, BsKey, BsLock, BsEye, BsEyeSlash } from "react-icons/bs";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from "react-toastify";

import { resetPassword, requestPasswordReset, selectUserStatus, selectUserError, clearStatus } from "../../redux/userSlice";

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const status = useSelector(selectUserStatus);
    const error = useSelector(selectUserError);

    // Lấy email từ trang trước đó
    const [email] = useState(() => {
        const emailFromState = location.state?.email;
        const emailFromParams = new URLSearchParams(location.search).get('email');
        return emailFromState || emailFromParams || "";
    });

    const [showPwd1, setShowPwd1] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (!email) {
            toast.warn("Không tìm thấy email, vui lòng quay lại bước trước.");
            navigate('/forgot-password');
        }
        return () => { dispatch(clearStatus()) };
    }, [email, navigate, dispatch]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => setCooldown((s) => s - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const formik = useFormik({
        initialValues: { otp: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            otp: Yup.string().matches(/^\d{6}$/, 'OTP phải là 6 chữ số.').required('Vui lòng nhập OTP.'),
            newPassword: Yup.string().required('Vui lòng nhập mật khẩu mới.').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, 'Mật khẩu không đủ mạnh.'),
            confirmPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Mật khẩu xác nhận không khớp.').required('Vui lòng xác nhận mật khẩu mới.')
        }),
        onSubmit: async (values) => {
            const payload = { email, otp: values.otp, newPassword: values.newPassword };
            const resultAction = await dispatch(resetPassword(payload));
            if (resetPassword.fulfilled.match(resultAction)) {
                toast.success(resultAction.payload.message || "Đặt lại mật khẩu thành công!");
                setTimeout(() => navigate("/login"), 1500);
            }
        },
    });
    
    const handleResend = async () => {
        if (cooldown > 0) return;
        const resultAction = await dispatch(requestPasswordReset(email));
        if (requestPasswordReset.fulfilled.match(resultAction)) {
            toast.info("Đã gửi lại OTP.");
            setCooldown(60);
        }
    };

    const isLoading = status === 'loading';

    return (
        <div className="auth-bg d-flex align-items-center justify-content-center py-5">
            <style>{`
                .auth-bg { min-height: 100vh; background: #fce0ea; }
                .auth-card { max-width: 720px; width: 100%; background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,.08); }
                .auth-right { padding: 40px 36px; }
                .auth-title { color:#c71857; font-weight:700; font-size:22px; text-align:center; margin-bottom:8px; }
                .auth-sub { color:#777; text-align:center; margin-bottom:22px; font-size:14px; }
                .pill { height: 42px; border-radius: 10px; }
                .pill:focus { box-shadow: 0 0 0 .2rem rgba(199,24,87,.15); border-color:#f1b4c9; }
                .ig-text { background:#fff; border-right:0; display:flex; align-items:center; }
                .ig-text > svg { font-size:1rem; }
                .ig-control { border-left:0; }
                .form-control.is-invalid, .ig-control.is-invalid { background-image: none !important; }
                .btn-primary-auth { background:#28a745; border-color:#28a745; height:42px; border-radius:999px; font-weight:600; }
                .btn-outline-auth { border-color:#d81b60; color:#d81b60; height:38px; border-radius:999px; font-weight:600; background:#fff; }
                .btn-outline-auth:hover { background:#ffe2ec; }
                .email-tag { font-size:13px; color:#555; background:#f7f7f7; border:1px solid #eee; padding:6px 10px; border-radius:8px; display:inline-flex; gap:6px; align-items:center; }
                .helper { font-size:12px; color:#888; margin-top:6px; }
            `}</style>
            <div className="auth-card">
                <div className="auth-right">
                    <div className="auth-title">Đặt lại mật khẩu</div>
                    <div className="auth-sub">Nhập OTP và tạo mật khẩu mới để hoàn tất.</div>
                    <div className="mb-3 d-flex justify-content-center">
                        <span className="email-tag"><BsEnvelope /> {email || "Không có email"}</span>
                    </div>

                    {status === 'failed' && error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form noValidate onSubmit={formik.handleSubmit}>
                        <Form.Group className="mb-3">
                            <InputGroup hasValidation>
                                <InputGroup.Text className="ig-text pill"><BsKey /></InputGroup.Text>
                                <Form.Control name="otp" className="ig-control pill" placeholder="Nhập OTP (6 số)" {...formik.getFieldProps('otp')} isInvalid={formik.touched.otp && formik.errors.otp} autoFocus />
                                <Form.Control.Feedback type="invalid">{formik.errors.otp}</Form.Control.Feedback>
                            </InputGroup>
                            <div className="d-flex justify-content-end mt-2">
                                <Button type="button" className="btn-outline-auth" onClick={handleResend} disabled={!email || cooldown > 0 || isLoading}>
                                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại OTP"}
                                </Button>
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <InputGroup hasValidation>
                                <InputGroup.Text className="ig-text pill"><BsLock /></InputGroup.Text>
                                <Form.Control name="newPassword" type={showPwd1 ? "text" : "password"} className="ig-control pill" placeholder="Mật khẩu mới" {...formik.getFieldProps('newPassword')} isInvalid={formik.touched.newPassword && formik.errors.newPassword} />
                                <InputGroup.Text as="button" type="button" onClick={() => setShowPwd1(v => !v)} className="ig-text pill" style={{ cursor: "pointer" }}>
                                    {showPwd1 ? <BsEyeSlash /> : <BsEye />}
                                </InputGroup.Text>
                                <Form.Control.Feedback type="invalid">{formik.errors.newPassword}</Form.Control.Feedback>
                            </InputGroup>
                            <div className="helper">Yêu cầu: ≥8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <InputGroup hasValidation>
                                <InputGroup.Text className="ig-text pill"><BsLock /></InputGroup.Text>
                                <Form.Control name="confirmPassword" type={showPwd2 ? "text" : "password"} className="ig-control pill" placeholder="Nhập lại mật khẩu mới" {...formik.getFieldProps('confirmPassword')} isInvalid={formik.touched.confirmPassword && formik.errors.confirmPassword} />
                                <InputGroup.Text as="button" type="button" onClick={() => setShowPwd2(v => !v)} className="ig-text pill" style={{ cursor: "pointer" }}>
                                    {showPwd2 ? <BsEyeSlash /> : <BsEye />}
                                </InputGroup.Text>
                                <Form.Control.Feedback type="invalid">{formik.errors.confirmPassword}</Form.Control.Feedback>
                            </InputGroup>
                        </Form.Group>

                        <Button type="submit" className="w-100 btn-primary-auth" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : "Đặt lại mật khẩu"}
                        </Button>
                        <div className="text-center mt-3" style={{ fontSize: 13 }}><Link to="/login">Quay lại đăng nhập</Link></div>
                    </Form>
                </div>
            </div>
        </div>
    );
}