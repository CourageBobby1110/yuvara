"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ShippingRate {
  _id: string;
  country: string;
  state: string;
  fee: number;
  isActive: boolean;
}

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
];

export default function AdminShippingPage() {
  const { data: session } = useSession();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState("Nigeria");
  const [newState, setNewState] = useState("");
  const [newFee, setNewFee] = useState("");

  useEffect(() => {
    fetchRates();
  }, [selectedCountry]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipping?country=${selectedCountry}`);
      const data = await res.json();
      setRates(data);
    } catch (error) {
      console.error("Failed to fetch rates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: ShippingRate) => {
    setEditingId(rate._id);
    setEditFee(rate.fee);
  };

  const handleSave = async (rate: ShippingRate) => {
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: rate.state,
          fee: editFee,
          country: selectedCountry,
        }),
      });

      if (res.ok) {
        setRates(
          rates.map((r) => (r._id === rate._id ? { ...r, fee: editFee } : r))
        );
        setEditingId(null);
      } else {
        alert("Failed to update rate");
      }
    } catch (error) {
      console.error("Update error", error);
      alert("Failed to update rate");
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newState || !newFee) return;

    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: newState,
          fee: Number(newFee),
          country: selectedCountry,
        }),
      });

      if (res.ok) {
        const newRate = await res.json();
        // Refresh list or append if it matches current view
        if (newRate.country === selectedCountry) {
          // Check if it exists in list (update) or new
          const exists = rates.find((r) => r.state === newRate.state);
          if (exists) {
            setRates(
              rates.map((r) => (r.state === newRate.state ? newRate : r))
            );
          } else {
            setRates(
              [...rates, newRate].sort((a, b) => a.state.localeCompare(b.state))
            );
          }
        }
        setNewState("");
        setNewFee("");
      } else {
        alert("Failed to add rate");
      }
    } catch (error) {
      console.error("Add error", error);
      alert("Failed to add rate");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Rates</h1>

        <div className="flex gap-4 items-center">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-lg border-gray-200 px-4 py-2 text-sm focus:border-black focus:ring-black"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              fetch("/api/admin/seed-shipping").then(() => fetchRates())
            }
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Seed Defaults (Nigeria)
          </button>
        </div>
      </div>

      {/* Add New Rate Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold mb-4">
          Add/Update Rate for {selectedCountry}
        </h3>
        <form onSubmit={handleAddRate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Region
            </label>
            <input
              type="text"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              placeholder="e.g. California"
              className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
              required
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee (NGN)
            </label>
            <input
              type="number"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm focus:border-black focus:ring-black"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Add Rate
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">
                  State/Region
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900">
                  Shipping Fee (NGN)
                </th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No rates found for {selectedCountry}. Add one above.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr key={rate._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-900">{rate.state}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {editingId === rate._id ? (
                        <input
                          type="number"
                          value={editFee}
                          onChange={(e) => setEditFee(Number(e.target.value))}
                          className="w-32 rounded-lg border-gray-200 px-3 py-1 text-sm focus:border-black focus:ring-black"
                        />
                      ) : (
                        `₦${rate.fee.toLocaleString()}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === rate._id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(rate)}
                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
