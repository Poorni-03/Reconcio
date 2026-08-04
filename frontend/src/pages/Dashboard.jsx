import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Layout from "../components/Layout";

export default function Dashboard() {
  const [stats, setStats] = useState({ invoices: 0, payments: 0, exceptions: 0, openBalance: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [invRes, payRes, excRes] = await Promise.all([
          apiClient.get("/invoices"),
          apiClient.get("/payments"),
          apiClient.get("/exceptions"),
        ]);
        const openBalance = invRes.data.reduce((sum, inv) => {
          const bal = parseFloat(inv.balanceInr?.$numberDecimal || inv.balanceInr || 0);
          return sum + bal;
        }, 0);
        setStats({
          invoices: invRes.data.length,
          payments: payRes.data.length,
          exceptions: excRes.data.length,
          openBalance,
        });
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const cards = [
    { label: "Total Invoices", value: stats.invoices },
    { label: "Total Payments", value: stats.payments },
    { label: "Needs Review", value: stats.exceptions, highlight: stats.exceptions > 0 },
    { label: "Total Open Balance", value: `₹${stats.openBalance.toLocaleString()}` },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white p-5 rounded-lg shadow border ${card.highlight ? "border-red-400" : "border-gray-200"}`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.highlight ? "text-red-600" : "text-slate-900"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  );
}