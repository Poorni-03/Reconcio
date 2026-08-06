import { Link } from "react-router-dom";

const features = [
  {
    title: "AI-Powered Matching",
    desc: "Automatically match messy bank payments to open invoices using semantic search — even when references don't line up exactly.",
  },
  {
    title: "TDS-Aware Reconciliation",
    desc: "Understands Indian tax deductions (194C, 194J, etc.) and reconciles short-payments against your configured TDS rates.",
  },
  {
    title: "Human-in-the-Loop Review",
    desc: "Low-confidence matches route to a clean Exception Queue for your team to confirm, adjust, or resolve — nothing gets silently misapplied.",
  },
  {
    title: "Remittance Advice Parsing",
    desc: "Upload PDF or email remittance text directly — AI extracts UTR numbers, amounts, and deduction reasons automatically.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <span className="text-xl font-bold text-slate-900">Remitpulse</span>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2">
            Login
          </Link>
          <Link to="/register" className="text-sm bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Cash application,<br />automated with AI.
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          Remitpulse matches incoming payments to open invoices automatically — reducing manual
          reconciliation and giving your finance team an accurate, real-time cash position.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-slate-900 text-white px-8 py-3 rounded font-medium hover:bg-slate-800">
            Start Free
          </Link>
          <Link to="/login" className="border border-slate-300 px-8 py-3 rounded font-medium hover:bg-slate-50">
            Sign In
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-sm text-slate-400 py-8">
        © 2026 Remitpulse. All rights reserved.
      </footer>
    </div>
  );
}