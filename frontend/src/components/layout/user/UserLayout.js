// src/components/layout/user/UserLayout.js
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function UserLayout() {
  return (
    <div className="user-layout">
      <Navbar />
      <main className="content">
        <Outlet /> {/* ✅ render các route con như Home, Products,... */}
      </main>
      <Footer />
    </div>
  );
}
