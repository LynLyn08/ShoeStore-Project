import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from 'react-toastify';

// Import action và selectors đã được tái cấu trúc từ userSlice
import { loadUserFromToken, selectIsAuthenticated, selectUser,selectUserStatus } from "./redux/userSlice";

// Layouts
import UserLayout from "./components/layout/user/UserLayout";
import AdminLayout from "./components/layout/admin/AdminLayout";

// User Pages
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";
import ProductList from "./pages/user/ProductList";
import ProductDetail from "./pages/user/ProductDetail";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Profile from "./pages/user/Profile";
import BlogList from "./pages/user/BlogList";
import BlogDetail from "./pages/user/BlogDetail";
import About from "./pages/user/About";
import Contact from "./pages/user/Contact";
import OrderLookup from "./pages/user/OrderLookup";
import PaymentResult from './pages/user/PaymentResult';
// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminCoupon from "./pages/admin/AdminCoupon";
import PaymentMethods from "./pages/admin/PaymentMethods";

// Component để bảo vệ các route
const PrivateRoute = ({ children, isAdmin = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const location = useLocation();
// 2. Đọc trạng thái loading
  const userStatus = useSelector(selectUserStatus);
 // 3. Thêm logic chờ
  // Nếu app đang ở trạng thái ban đầu hoặc đang tải user, hãy chờ
  if (userStatus === 'idle' || userStatus === 'loading') {
    // Bạn có thể return một component Spinner đẹp hơn ở đây
    return <div>Đang tải...</div>; 
  }
  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang login và lưu lại trang hiện tại
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (isAdmin && user?.role !== "admin") {
    // Nếu route yêu cầu quyền admin nhưng user không phải admin, chuyển về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();

  // useEffect này chỉ chạy một lần khi ứng dụng khởi động
  // Nó sẽ kiểm tra localStorage và tự động nạp lại thông tin user nếu có token hợp lệ
  useEffect(() => {
    dispatch(loadUserFromToken());
  }, [dispatch]);

  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* User routes (sử dụng layout chung) */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="payment-result" element={<PaymentResult />}/>
          <Route path="order-lookup" element={<OrderLookup />} />
          <Route path="blogs" element={<BlogList />} />
          <Route path="blog/:id" element={<BlogDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          
          {/* Route cần đăng nhập */}
          <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Route>

        {/* Admin routes (yêu cầu đăng nhập và có quyền admin) */}
        <Route path="/admin" element={<PrivateRoute isAdmin={true}><AdminLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="coupons" element={<AdminCoupon />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          {/* Route mặc định cho /admin là dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Fallback route - Chuyển hướng về trang chủ nếu không tìm thấy route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Component để hiển thị thông báo toast trên toàn ứng dụng */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;