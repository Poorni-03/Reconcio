import { useEffect, useState, useRef } from "react";
import apiClient from "../api/client";
import Layout from "../components/Layout";

function fmt(val) {
  if (val == null) return "0";
  const num = typeof val === "object" ? val.$numberDecimal : val;
  return parseFloat(num).toLocaleString();
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function loadInvoices() {
    const res = await apiClient.get("/invoices", {
      params: statusFilter ? { status: statusFilter } : {},
    });
    setInvoices(res.data);
  }

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  async function handleFileSelected(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setUploading(true);
    setUploadMsg("Uploading...");
    const formData = new FormData();
    formData.append("file", selected);
    try {
      const res = await apiClient.post("/invoices/upload", formData);
      setUploadMsg(`Created: ${res.data.created}, Skipped: ${res.data.skipped}`);
      loadInvoices();
    } catch (err) {
      setUploadMsg(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCancel() {
    setUploading(false);
    setActionMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id) {
    if (!confirm("Delete this invoice?")) return;
    await apiClient.delete(`/invoices/${id}`);
    loadInvoices();
  }

  const statusColors = {
    OPEN: "bg-blue-100 text-blue-700",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
    DISPUTED: "bg-red-100 text-red-700",
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="DISPUTED">Disputed</option>
        </select>
      </div>

    <div className="bg-white p-4 rounded-lg shadow border mb-4 flex items-center gap-3">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button
          onClick={handleCancel}
          className="border border-gray-300 px-4 py-1.5 rounded text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        {actionMsg && <span className="text-sm text-gray-600">{actionMsg}</span>}
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Due (₹)</th>
              <th className="px-4 py-2">Balance (₹)</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="border-t">
                <td className="px-4 py-2 font-medium">{inv.invoiceNumber}</td>
                <td className="px-4 py-2">{inv.customerName}</td>
                <td className="px-4 py-2">₹{fmt(inv.amountDueInr)}</td>
                <td className="px-4 py-2">₹{fmt(inv.balanceInr)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${statusColors[inv.status] || ""}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {new Date(inv.dueDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
