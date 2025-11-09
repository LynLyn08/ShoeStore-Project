import React, { useEffect, useMemo, useState } from "react";
import { Navbar, Nav, Container, NavDropdown, Form, FormControl, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaSearch, FaShoppingCart, FaUserCircle } from "react-icons/fa";

// Import các action và selector đã tái cấu trúc
import { logout as logoutAction, selectUser, selectIsAuthenticated } from "../../../redux/userSlice";
import { fetchCart, selectCartTotalItems } from "../../../redux/cartSlice";
import { resolveAvatarUrl } from "../../../utils/urlUtils"; 
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

/** Component avatar an toàn, có fallback chữ cái đầu */
function SafeAvatar({ avatar, username, size = 30 }) {
  const [imgError, setImgError] = useState(false);
  const src = useMemo(() => resolveAvatarUrl(avatar), [avatar]);
  useEffect(() => { setImgError(false); }, [src]);

  if (!src || imgError) {
    if (username) {
      return (
        <div
          aria-label="avatar initials"
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: "#666",
            color: "#fff",
            fontSize: Math.max(12, Math.floor(size * 0.46)),
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
          }}
          title={username}
        >
          {String(username).trim().charAt(0).toUpperCase()}
        </div>
      );
    }
    return <FaUserCircle size={size} className="text-light" />;
  }

  return (
    <img
      src={src}
      alt="User avatar"
      className="rounded-circle"
      style={{ width: size, height: size, objectFit: "cover" }}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

export default function UserNavbar({ brandText = "LilyShoes" }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Lấy state trực tiếp từ Redux store
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser);
    const totalCartItems = useSelector(selectCartTotalItems);

    const [navKeyword, setNavKeyword] = useState(searchParams.get("keyword") || "");

    // Đồng bộ giỏ hàng khi người dùng thay đổi (đăng nhập/đăng xuất)
    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch, isAuthenticated]);

    // Đồng bộ ô tìm kiếm với URL
    useEffect(() => {
        setNavKeyword(searchParams.get("keyword") || "");
    }, [searchParams]);

    const handleLogout = () => {
        dispatch(logoutAction());
        navigate("/", { replace: true });
    };

    const submitSearch = (e) => {
        e.preventDefault();
        const kw = navKeyword.trim();
        const nextParams = new URLSearchParams(location.search);
        if (kw) {
            nextParams.set("keyword", kw);
        } else {
            nextParams.delete("keyword");
        }
        nextParams.set("page", "1");
        navigate(`/products?${nextParams.toString()}`);
    };
 const styles = `
  .custom-navbar{background:#111!important;border-bottom:1px solid rgba(255,255,255,.08)}
  .brand-text{color:#fff!important;letter-spacing:.5px;font-weight:700}
  .custom-nav-link{color:#e9ecef!important;font-weight:500;position:relative}
  .custom-nav-link:hover{color:#fff!important}
  .custom-nav-dropdown .dropdown-menu{
    background:#1a1a1a;border:1px solid rgba(255,255,255,.08);
    box-shadow:0 10px 30px rgba(0,0,0,.35);
    display:grid!important;grid-template-columns:repeat(4,1fr);
    gap:1.5rem 2rem;padding:1.5rem 2rem;min-width:800px;border-radius:.5rem;
    left:50%;transform:translateX(-50%);z-index:1050}
  .dropdown-group{display:flex;flex-direction:column}
  .dropdown-header-custom{color:#ccc;font-weight:700;text-transform:uppercase;font-size:.85rem;letter-spacing:.08em;margin-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:.4rem}
  .dropdown-item-custom{color:#f1f3f5;padding:.35rem 0;font-size:.9rem;transition:all .2s ease}
  .dropdown-item-custom:hover{color:#fff;transform:translateX(4px)}
  @media (max-width:991.98px){
    .custom-nav-dropdown .dropdown-menu{min-width:auto;flex-direction:column;gap:.5rem;left:auto;transform:none;padding:.5rem .75rem}}
  .custom-badge{position:absolute;top:0;right:0;transform:translate(45%,-45%);font-size:.72em;padding:.28em .52em;border-radius:999px;background:#dc3545;color:#fff;line-height:1;min-width:1.3rem;text-align:center}
  .custom-search-input{background:#1f1f1f;border:1px solid rgba(255,255,255,.14);color:#fff;height:40px;border-radius:.5rem 0 0 .5rem}
  .custom-search-button{background:#fff;border-color:#fff;color:#000;height:40px;border-radius:0 .5rem .5rem 0}
  .custom-clear-button{background:#2a2a2a;border:1px solid rgba(255,255,255,.14);color:#e9ecef;height:40px;border-radius:0}
  .custom-search-input::-webkit-search-cancel-button {-webkit-appearance:none;appearance:none;display:none;}
  .custom-search-input::-ms-clear{display:none;width:0;height:0;}
  `;
    return (
        <>
            <style>{styles}</style>
            <Navbar expand="lg" className="shadow-sm py-3 custom-navbar" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                        <span className="brand-text fs-5">{brandText}</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="main-navbar" />
                    <Navbar.Collapse id="main-navbar">
                        <Nav className="ms-auto me-auto">
                            <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
                            <Nav.Link as={Link} to="/products">Sản phẩm</Nav.Link>
                            <Nav.Link as={Link} to="/blogs">Blog</Nav.Link>
                            <Nav.Link as={Link} to="/about">Giới thiệu</Nav.Link>
                            <Nav.Link as={Link} to="/contact">Liên hệ</Nav.Link>
                            {!isAuthenticated && <Nav.Link as={Link} to="/order-lookup">Tra cứu đơn hàng</Nav.Link>}
                        </Nav>
                        <Nav className="d-flex align-items-center">
                            <Form className="d-flex me-2" onSubmit={submitSearch}>
                                <FormControl type="search" placeholder="Tìm kiếm..." className="custom-search-input" value={navKeyword} onChange={(e) => setNavKeyword(e.target.value)} />
                                <Button type="submit" className="custom-search-button"><FaSearch /></Button>
                            </Form>
                            <Nav.Link as={Link} to="/cart" className="position-relative ms-3">
                                <FaShoppingCart size={20} />
                                {totalCartItems > 0 && <span className="custom-badge">{totalCartItems}</span>}
                            </Nav.Link>
                            <NavDropdown
                                title={
                                    <span className="d-flex align-items-center gap-2">
                                        <SafeAvatar avatar={user?.avatar} username={user?.username} size={30} />
                                        {isAuthenticated && <span>{user?.username}</span>}
                                    </span>
                                }
                                id="user-dropdown"
                                align="end"
                                className="ms-3"
                            >
                                {isAuthenticated ? (
                                    <>
                                        <NavDropdown.Item as={Link} to="/profile">Hồ sơ của tôi</NavDropdown.Item>
                                        {user?.role === 'admin' && <NavDropdown.Item as={Link} to="/admin/dashboard">Trang quản trị</NavDropdown.Item>}
                                        <NavDropdown.Divider />
                                        <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
                                    </>
                                ) : (
                                    <>
                                        <NavDropdown.Item as={Link} to="/login">Đăng nhập</NavDropdown.Item>
                                        <NavDropdown.Item as={Link} to="/register">Đăng ký</NavDropdown.Item>
                                    </>
                                )}
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    );
}