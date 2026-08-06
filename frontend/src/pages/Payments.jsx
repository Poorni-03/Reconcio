import { useEffect, useState, useRef } from "react";
import apiClient from "../api/client";
import Layout from "../components/Layout";

function fmt(val) {
  if (val == null) return "0";
  const num = typeof val === "object" ? val.$numberDecimal : val;
  return parseFloat(num).toLocaleString();
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const fileInputRef = useRef(null);
  const remittanceInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function loadPayments() {
    const res = await apiClient.get("/payments");
    setPayments(res.data);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleFileSelected(e) {
    const selected = e.target.files[0];
    if (!selected) return;

    setUploading(true);
    setActionMsg("Uploading...");
    const formData = new FormData();
    formData.append("file", selected);

    try {
      const ext = selected.name.split(".").pop().toLowerCase();
      if (ext === "csv") {
        const res = await apiClient.post("/payments/upload", formData);
        setActionMsg(
          `Created: ${res.data.created}, Skipped: ${res.data.skipped}`,
        );
      } else {
        const res = await apiClient.post(
          "/payments/upload-remittance",
          formData,
        );
        setActionMsg(
          `✅ Remittance processed: ₹${res.data.payment.amountInr} from ${res.data.payment.payerName || "unknown"}`,
        );
      }
      loadPayments();
    } catch (err) {
      setActionMsg(err.response?.data?.error || "Upload failed");
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

  async function runTier1(id) {
    setActionMsg("Running Tier 1...");
    try {
      const res = await apiClient.post(`/matching/tier1/${id}`);
      setActionMsg(
        res.data.matched
          ? "✅ Tier 1 matched!"
          : `No Tier 1 match: ${res.data.reason}`,
      );
      loadPayments();
    } catch (err) {
      setActionMsg(err.response?.data?.error || "Error running Tier 1");
    }
  }

  async function runTier2(id) {
    setActionMsg("Running Tier 2 (AI matching, may take a few seconds)...");
    try {
      const res = await apiClient.post(`/matching/tier2/${id}`);
      if (res.data.matched) {
        setActionMsg("✅ Tier 2 auto-applied!");
      } else if (res.data.needsReview) {
        setActionMsg("⚠️ Sent to Exception Queue for review");
      } else {
        setActionMsg(res.data.reason || "No match found");
      }
      loadPayments();
    } catch (err) {
      setActionMsg(err.response?.data?.error || "Error running Tier 2");
    }
  }
  async function handleDelete(id) {
    if (!confirm("Delete this payment?")) return;
    try {
      await apiClient.delete(`/payments/${id}`);
      setActionMsg("Payment deleted");
      loadPayments();
    } catch (err) {
      setActionMsg(err.response?.data?.error || "Error deleting payment");
    }
  }

  const statusColors = {
    UNMATCHED: "bg-gray-100 text-gray-700",
    TIER1_MATCHED: "bg-green-100 text-green-700",
    TIER2_AUTO_MATCHED: "bg-green-100 text-green-700",
    NEEDS_REVIEW: "bg-orange-100 text-orange-700",
    PARTIALLY_MATCHED: "bg-yellow-100 text-yellow-700",
    UNAPPLIED: "bg-purple-100 text-purple-700",
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="bg-white p-4 rounded-lg shadow border mb-4 flex items-center gap-3">
        <input
          type="file"
          accept=".csv,.pdf,.txt"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="bg-slate-900 text-white px-4 py-1.5 rounded text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload (CSV / PDF / Email)"}
        </button>
        <button
          onClick={handleCancel}
          className="border border-gray-300 px-4 py-1.5 rounded text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        {actionMsg && (
          <span className="text-sm text-gray-600">{actionMsg}</span>
        )}
      </div>
      {actionMsg && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm">
          {actionMsg}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">UTR/RRN</th>
              <th className="px-4 py-2">Payer</th>
              <th className="px-4 py-2">Amount (₹)</th>
              <th className="px-4 py-2">Memo</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-4 py-2">{p.utrOrRrnNumber || "—"}</td>
                <td className="px-4 py-2">{p.payerName}</td>
                <td className="px-4 py-2">₹{fmt(p.amountInr)}</td>
                <td className="px-4 py-2 max-w-xs truncate">{p.rawMemoText}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${statusColors[p.status] || ""}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-2">
                  {p.status === "UNMATCHED" && (
                    <>
                      <button
                        onClick={() => runTier1(p._id)}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Run Tier 1
                      </button>
                      <button
                        onClick={() => runTier2(p._id)}
                        className="text-purple-600 text-xs hover:underline"
                      >
                        Run Tier 2
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
