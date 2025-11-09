// src/components/layout/admin/AdminLayout.js
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../../styles/components/AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Nội dung chính */}
      <div className="admin-main">
        {/* Header */}
        <Header />

        {/* Nội dung trang con */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
