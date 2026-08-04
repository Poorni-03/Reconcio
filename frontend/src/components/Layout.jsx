import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/invoices", label: "Invoices" },
    { to: "/payments", label: "Payments" },
    { to: "/exceptions", label: "Exception Queue" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">Reconcio</span>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="text-sm text-gray-300 hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-300">{user?.email}</span>
          <button onClick={handleLogout} className="bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}