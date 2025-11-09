import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { BsPerson, BsLock, BsFacebook, BsGoogle } from 'react-icons/bs';

// Import action (thunk) và các selectors mới từ Redux slice
import { loginUser, selectUser, selectUserStatus, selectUserError, loadUserFromToken } from '../../redux/userSlice';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy trạng thái từ Redux store bằng selectors
  const user = useSelector(selectUser);
  const authStatus = useSelector(selectUserStatus);
  const authError = useSelector(selectUserError);

  // useEffect để xử lý các side effect: social login callback và điều hướng
// useEffect 1: Chỉ để xử lý token từ social login một lần duy nhất
useEffect(() => {
    // Tự điền username đã nhớ từ localStorage
    const rememberedIdentifier = localStorage.getItem('auth:rememberIdentifier');
    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
      setRemember(true);
    }
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    // Nếu có token trên URL, xử lý nó và xóa khỏi URL
    if (token) {
        localStorage.setItem('token', token);
        dispatch(loadUserFromToken()); // Nạp thông tin user từ token mới
        navigate('/', { replace: true }); // SỬA Ở ĐÂY: Chuyển hướng về trang chủ
    }
}, [dispatch, navigate, location.search]); // Chỉ phụ thuộc vào `location.search`

// useEffect 2: Chỉ để xử lý chuyển hướng sau khi đăng nhập thành công
useEffect(() => {
    // Nếu đăng nhập thành công (trạng thái 'succeeded' và có user), điều hướng
    if (authStatus === 'succeeded' && user) {
        const redirectPath = new URLSearchParams(location.search).get('redirect') || (user.role === 'admin' ? '/admin/dashboard' : '/');
        navigate(redirectPath, { replace: true });
    }
}, [authStatus, user, navigate, location.search]); // Phụ thuộc vào trạng thái đăng nhập
  const handleLogin = (e) => {
    e.preventDefault();
    setFormError(''); // Xóa lỗi form cũ

    // Validation cơ bản phía client
    if (!identifier || !password) {
      setFormError('Vui lòng nhập đầy đủ Username/Email và Mật khẩu.');
      return;
    }
    
    // Chỉ cần dispatch action, Redux Toolkit và thunk sẽ lo phần còn lại
    dispatch(loginUser({ 
        identifier: identifier.trim(), 
        password, 
        remember 
    }));
  };
  
  // Lấy trạng thái loading từ Redux
  const isLoading = authStatus === 'loading';

  // --- JSX giữ nguyên hoàn toàn so với file cũ của bạn ---
  const styles = (
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
      .pill { height: 42px; border-radius: 10px; }
      .pill:focus { box-shadow: 0 0 0 0.2rem rgba(199,24,87,0.15); border-color: #f1b4c9; }
      .ig-text { background:#fff; border-right:0; display:flex; align-items:center; }
      .ig-text > svg { font-size: 1rem; }
      .ig-control { border-left:0; }
      .form-control.is-invalid, .ig-control.is-invalid { background-image: none !important; }
      .btn-primary-auth { background: #d81b60; border-color: #d81b60; height: 42px; border-radius: 999px; font-weight: 600; }
      .btn-social { width: 100%; height: 42px; border-radius: 999px; font-weight: 600; }
      .btn-facebook { background: #3b5998; border-color: #3b5998; }
      .btn-google { background: #ea4335; border-color: #ea4335; }
      .or-line { position: relative; text-align: center; margin: 18px 0; color: #999; font-size: 13px; }
      .or-line::before, .or-line::after { content: ""; position: absolute; top: 50%; width: 40%; height: 1px; background: #eee; }
      .or-line::before { left: 0; } .or-line::after { right: 0; }
      .small-links { display:flex; align-items:center; justify-content:space-between; margin-top: 8px; font-size: 13px; }
      .small-links a { color:#d81b60; text-decoration:none; }
      .signup-line { text-align:center; margin-top: 14px; font-size: 13px; color:#666; }
      .signup-line a { color:#d81b60; text-decoration:none; }
      @media (max-width: 768px) {
        .auth-split { grid-template-columns: 1fr; }
        .auth-left::after { display:none; }
        .auth-right { padding: 32px 22px; }
      }
    `}</style>
  );

  return (
    <div className="auth-bg d-flex align-items-center justify-content-center py-5">
      {styles}

      <div className="auth-card">
        <div className="auth-split">
          {/* Cột trái: Brand */}
          <div className="auth-left">
            <div className="brand-box">
              <img
                className="brand-logo"
                src="/logo-shoe.png"
                alt="Lily & Lage SHOES"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="brand-name">L I L Y &nbsp; &amp; &nbsp; L A G E</div>
              <div style={{ letterSpacing: 6, color: '#999', marginTop: 6 }}>S H O E S</div>
            </div>
          </div>

          {/* Cột phải: Form */}
          <div className="auth-right">
            <div className="auth-title">Login</div>
            <div className="auth-sub">
              Welcome to Lily &amp; Lage SHOES!
              <br />
              Please login to continue.
            </div>

            {(authStatus === 'failed' && authError) && <Alert variant="danger">{authError}</Alert>}
            {formError && <Alert variant="danger">{formError}</Alert>}

            <Form onSubmit={handleLogin} noValidate>
              {/* Identifier */}
              <Form.Group className="mb-3" controlId="loginIdentifier">
                <InputGroup>
                  <InputGroup.Text className="ig-text pill">
                    <BsPerson aria-hidden="true" />
                  </InputGroup.Text>
                  <Form.Control
                    className="ig-control pill"
                    type="text"
                    placeholder="Username or Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                    isInvalid={!!formError}
                  />
                </InputGroup>
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-2" controlId="loginPassword">
                <InputGroup>
                  <InputGroup.Text className="ig-text pill">
                    <BsLock aria-hidden="true" />
                  </InputGroup.Text>
                  <Form.Control
                    className="ig-control pill"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isInvalid={!!formError || !!authError}
                  />
                </InputGroup>
              </Form.Group>

              <div className="small-links">
                <Form.Check
                  type="checkbox"
                  id="rememberMe"
                  label="Remember Me"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              <Button type="submit" className="w-100 mt-3 btn-primary-auth" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" animation="border" /> : 'Login'}
              </Button>

              <div className="signup-line">
                Don’t have an account? <Link to="/register">Signup</Link>
              </div>

              <div className="or-line">OR</div>

              <div className="d-grid gap-2">
                <Button
                  className="btn-social btn-facebook d-flex align-items-center justify-content-center gap-2"
                  as="a"
                  href="http://localhost:5000/auth/facebook"
                >
                  <BsFacebook /> Connect with Facebook
                </Button>
                <Button
                  className="btn-social btn-google d-flex align-items-center justify-content-center gap-2"
                  as="a"
                  href="http://localhost:5000/auth/google"
                >
                  <BsGoogle /> Connect with Google
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;