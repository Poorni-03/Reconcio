import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold mb-4">Reconcio</h1>
      <p className="text-gray-300 text-lg mb-8 text-center max-w-xl">
        AI-powered cash application automation. Match payments to invoices automatically,
        even when references are messy or incomplete.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="bg-white text-slate-900 px-6 py-2.5 rounded font-medium hover:bg-gray-100">
          Login
        </Link>
        <Link to="/register" className="border border-white px-6 py-2.5 rounded font-medium hover:bg-slate-800">
          Get Started
        </Link>
      </div>
    </div>
  );
}