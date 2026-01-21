"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Search, Plus, MoreHorizontal } from "lucide-react";

interface Account {
  id: string;
  name: string;
  accountNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    premises: number;
    jobs: number;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      {/* Page Header */}
      <div className="bg-white border-b border-[#dddbda] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7f8de1] rounded flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#3e3e3c]">Accounts</h1>
              <p className="text-sm text-[#706e6b]">{accounts.length} items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-[#dddbda] overflow-hidden">
          {/* Search/Filter Bar */}
          <div className="px-4 py-3 border-b border-[#dddbda] flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#706e6b]" />
              <input
                type="text"
                placeholder="Search this list..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
              />
            </div>
            <button className="px-3 py-2 text-sm text-[#706e6b] border border-[#dddbda] rounded hover:bg-[#f3f3f3] flex items-center gap-1">
              All Accounts
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0176d3]"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Building2 className="w-12 h-12 text-[#c9c9c9] mb-4" />
              <h3 className="text-lg font-medium text-[#3e3e3c] mb-2">No accounts yet</h3>
              <p className="text-sm text-[#706e6b] mb-4">Get started by creating your first account</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486]"
              >
                New Account
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#706e6b] uppercase tracking-wide">Account Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#706e6b] uppercase tracking-wide">Account Number</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#706e6b] uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#706e6b] uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#706e6b] uppercase tracking-wide">Premises</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-t border-[#dddbda] hover:bg-[#f3f3f3]">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/${account.id}`} className="text-sm text-[#0176d3] hover:underline font-medium">
                        {account.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#3e3e3c]">{account.accountNumber || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#3e3e3c]">{account.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#3e3e3c]">{account.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[#3e3e3c]">{account._count?.premises || 0}</td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <MoreHorizontal className="w-4 h-4 text-[#706e6b]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Account Modal */}
      {showNewModal && (
        <NewAccountModal onClose={() => setShowNewModal(false)} onCreated={fetchAccounts} />
      )}
    </div>
  );
}

function NewAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accountNumber, phone, email }),
      });
      if (response.ok) {
        onCreated();
        onClose();
      }
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#dddbda]">
            <h2 className="text-lg font-semibold text-[#3e3e3c]">New Account</h2>
            <button onClick={onClose} className="text-[#706e6b] hover:text-[#3e3e3c]">×</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Account Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
                placeholder="Enter account name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3e3e3c] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#dddbda] rounded focus:outline-none focus:ring-2 focus:ring-[#0176d3]"
                placeholder="Enter email"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#dddbda]">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#3e3e3c] bg-white border border-[#dddbda] rounded hover:bg-[#f3f3f3]">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0176d3] rounded hover:bg-[#014486] disabled:bg-[#c9c9c9] disabled:cursor-not-allowed"
            >
              {isCreating ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
