import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Layout from "../components/Layout";

function fmt(val) {
  if (val == null) return "0";
  const num = typeof val === "object" ? val.$numberDecimal : val;
  return parseFloat(num).toLocaleString();
}

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const [excRes, rcRes] = await Promise.all([
      apiClient.get("/exceptions"),
      apiClient.get("/reason-codes"),
    ]);
    setExceptions(excRes.data);
    setReasonCodes(rcRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmMatch(matchId) {
    try {
      await apiClient.post(`/matches/${matchId}/confirm`);
      setMsg("✅ Match confirmed");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error confirming match");
    }
  }

  async function partialPayment(matchId) {
    try {
      await apiClient.post(`/matches/${matchId}/partial`);
      setMsg("✅ Applied as partial payment");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  }

  async function adjustMatch(matchId, reasonId) {
    if (!reasonId) {
      setMsg("Please select a reason code first");
      return;
    }
    try {
      await apiClient.post(`/matches/${matchId}/adjust`, { deductionReasonId: reasonId });
      setMsg("✅ Adjustment applied, invoice settled");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  }

  async function unapplyPayment(paymentId) {
    try {
      await apiClient.post(`/matches/payments/${paymentId}/unapply`);
      setMsg("✅ Routed to customer credit balance");
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">Exception Queue</h1>
      <p className="text-gray-500 text-sm mb-6">Payments the AI couldn't confidently match — review and resolve.</p>

      {msg && <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm">{msg}</div>}

      {exceptions.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow border text-center text-gray-400">
          🎉 No exceptions — everything is matched or resolved.
        </div>
      )}

      <div className="space-y-4">
        {exceptions.map(({ payment, suggestedMatches }) => (
          <div key={payment._id} className="bg-white rounded-lg shadow border p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">{payment.payerName}</p>
                <p className="text-sm text-gray-500">
                  ₹{fmt(payment.amountInr)} • {payment.utrOrRrnNumber || "no reference"}
                </p>
                <p className="text-sm text-gray-400 italic mt-1">"{payment.rawMemoText}"</p>
              </div>
              <button
                onClick={() => unapplyPayment(payment._id)}
                className="text-purple-600 text-xs border border-purple-300 px-3 py-1 rounded hover:bg-purple-50"
              >
                Unmatched / Overpayment
              </button>
            </div>

            {suggestedMatches.map((sm) => (
              <div key={sm.matchLineItemId} className="bg-gray-50 rounded p-3 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-medium">
                      Suggested: {sm.invoiceNumber} — {sm.customerName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{sm.reasoning}</p>
                  </div>
                  <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {Math.round(sm.confidenceScore * 100)}% confidence
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    onClick={() => confirmMatch(sm.matchLineItemId)}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    Confirm Match
                  </button>
                  <button
                    onClick={() => partialPayment(sm.matchLineItemId)}
                    className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700"
                  >
                    Partial Payment
                  </button>
                  <select
                    onChange={(e) => adjustMatch(sm.matchLineItemId, e.target.value)}
                    defaultValue=""
                    className="text-xs border rounded px-2 py-1.5"
                  >
                    <option value="" disabled>
                      Adjust with reason...
                    </option>
                    {reasonCodes.map((rc) => (
                      <option key={rc._id} value={rc._id}>
                        {rc.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
}