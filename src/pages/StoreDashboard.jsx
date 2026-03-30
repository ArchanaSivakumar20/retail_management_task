import { useState, useEffect } from "react";
import DomoApi from "../API/domoAPI";
import {
  Package, FileText, CheckCircle, ArrowLeft, Menu, Plus,
  Trash2, Edit, Save, X, Search, FileDown, CopyPlus, ChevronDown, Sparkles
} from "lucide-react";
import { StatusBadge } from "../components/dashboard/StatusBadge";
import { StockBar } from "../components/dashboard/StockBar";
import { RequestCard } from "../components/dashboard/RequestCard";
import { MetricCard } from "../components/dashboard/MetricCard";
import { AcknowledgementCard } from "../components/dashboard/AcknowledgementCard";

export default function StoreDashboard({ storeName, onBack, onSwitchStore, stores = [] }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  //Request Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("pullback");
  const [modalForm, setModalForm] = useState({ sku: "", quantity: 1, reason: "" });
  const [modalErrors, setModalErrors] = useState({});

//Inventory modal
  const [showInvModal, setShowInvModal] = useState(false);
  const [invModalMode, setInvModalMode] = useState("add");
  const [editingItem, setEditingItem] = useState(null);
  const [invForm, setInvForm] = useState({ sku: "", name: "", category: "Tops", stock: "", threshold: "" });
  const [invErrors, setInvErrors] = useState({});

  //popup message
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const prods = await DomoApi.ListDocuments("inventory");
      const uniqueProds = prods.map((d) => d.content).filter((p, i, arr) => arr.findIndex((q) => q.sku === p.sku) === i);
      setAllProducts(uniqueProds);
      const inv = await DomoApi.fetchInventory(storeName);
      setInventory(inv);
      const reqs = await DomoApi.fetchRequests();
      setRequests(reqs.filter((r) => r.store === storeName));
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [storeName]);

  const openModal = (mode) => {
    setModalMode(mode);
    setModalForm({ sku: "", quantity: 1, reason: "" });
    setModalErrors({});
    setShowModal(true);
    setMobileNavOpen(false);
  };

  // Validation 
  const validateRequest = () => {
    const errs = {};
    if (!modalForm.sku) errs.sku = "Please select a product.";
    if (!modalForm.quantity || Number(modalForm.quantity) < 1) errs.quantity = "Quantity must be at least 1.";
    if (!modalForm.reason.trim()) errs.reason = "Please provide a reason.";
    setModalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateInv = () => {
    const errs = {};
    if (!invForm.sku.trim()) errs.sku = "SKU is required.";
    if (!invForm.name.trim()) errs.name = "Product name is required.";
    if (invForm.stock === "" || isNaN(invForm.stock)) errs.stock = "Valid stock number required.";
    if (invForm.threshold === "" || isNaN(invForm.threshold)) errs.threshold = "Valid threshold required.";
    setInvErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers 
  const handleCreateRequest = async () => {
    if (!validateRequest()) return;
    const currentItem = inventory.find((i) => i.sku === modalForm.sku);
    let productName = currentItem?.name || "Unknown Product";
    if (!currentItem) {
      const fallback = allProducts.find((p) => p.sku === modalForm.sku);
      if (fallback) productName = fallback.name;
    }
    const reqDoc = {
      store: storeName, type: modalMode, sku: modalForm.sku, productName,
      quantity: Number(modalForm.quantity), reason: modalForm.reason,
      status: "pending", createdAt: new Date().toISOString(),
    };
    try {
      await DomoApi.CreateDocument("requests", reqDoc);
      showToast(`${modalMode} request created successfully.`);
      setShowModal(false);
      setModalErrors({});
      refresh();
    } catch { showToast("Failed to create request.", "error"); }
  };

  const handleSaveInv = async () => {
    if (!validateInv()) return;
    try {
      const doc = {
        store: storeName, sku: invForm.sku, name: invForm.name,
        category: invForm.category, stock: Number(invForm.stock), threshold: Number(invForm.threshold),
      };
      if (invModalMode === "add") {
        await DomoApi.CreateDocument("inventory", doc);
        showToast("Product added to store.");
      } else {
        await DomoApi.UpdateDocument("inventory", editingItem.id, doc);
        showToast("Product updated.");
      }
      setShowInvModal(false);
      setInvErrors({});
      refresh();
    } catch { showToast("Failed to save inventory.", "error"); }
  };

  const handleDeleteInv = async (id) => {
    if (!window.confirm("Remove this item from store?")) return;
    try {
      await DomoApi.DeleteDocument("inventory", id);
      showToast("Item deleted.");
      refresh();
    } catch { showToast("Failed to delete.", "error"); }
  };

  const lowCount     = inventory.filter((i) => i.stock < i.threshold).length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const storeAcks    = requests.filter((r) => r.status !== "pending");

  const NAV_ITEMS = [
    { id: "inventory", label: "Inventory",        icon: Package },
    { id: "requests",  label: "Pending Requests", icon: FileText,   badge: pendingCount },
    { id: "acks",      label: "Acknowledgements", icon: CheckCircle, badge: storeAcks.length },
  ];

  // Style helpers 
  const inputCls = (err) =>
    `w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
      err
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-pink-400 focus:ring-pink-100"
    }`;
  const errMsg = (msg) =>
    msg ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><span>⚠</span> {msg}</p> : null;

  const requestIsComplete =
    !!modalForm.sku && Number(modalForm.quantity) >= 1 && modalForm.reason.trim().length > 0;

  const invIsComplete =
    invForm.sku.trim() && invForm.name.trim() && invForm.stock !== "" && invForm.threshold !== "";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F4FF] font-sans text-[#1E1B4B]">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
          toast.type === "error"
            ? "bg-red-50 text-red-600 border-red-200 shadow-red-100"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100"
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === "error" ? "bg-red-400" : "bg-emerald-400"}`} />
          {toast.msg}
        </div>
      )}

      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-[#1E1B4B]/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar  */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1E1B4B] flex flex-col transition-transform duration-300 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <span className="font-black text-white text-sm">Z</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-300 rounded-full border-2 border-[#1E1B4B]" />
            </div>
            <span className="font-black tracking-tight text-white">ZUDIO <span className="text-pink-400">RMS</span></span>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white transition-colors" onClick={() => setMobileNavOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Switcher */}
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Current Location</p>
          <div className="relative">
            <select
              value={storeName}
              onChange={(e) => onSwitchStore(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-pink-400/50 pr-8 cursor-pointer"
            >
              {stores.map((s) => <option key={s} value={s} className="bg-[#1E1B4B]">{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-white/40"}`} />
                <span className="font-semibold">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-black ${
                    active ? "bg-white/20 text-white" : "bg-pink-500 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-3">Quick Actions</p>
            <button
              onClick={() => openModal("pullback")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-all border border-white/8 font-semibold"
            >
              <FileDown className="w-4 h-4" /> Pull-Back
            </button>
            <button
              onClick={() => openModal("replenishment")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200 transition-all border border-white/8 font-semibold"
            >
              <CopyPlus className="w-4 h-4" /> Replenish
            </button>
          </div>
        </nav>

        {/* Back */}
        <div className="p-4 border-t border-white/10">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/10 transition-all font-semibold">
            <ArrowLeft className="w-4 h-4" /> Switch Role
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Mobile header */}
        <header className="lg:hidden h-14 border-b border-pink-100 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <span className="font-black text-white text-xs">Z</span>
            </div>
            <span className="font-black text-sm text-[#1E1B4B]">ZUDIO <span className="text-pink-500">RMS</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(true)} className="p-2 text-slate-400 hover:text-[#1E1B4B]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E1B4B] mb-1">Store Control</h2>
              <p className="text-slate-400 font-medium text-sm">
                Managing <span className="text-pink-500 font-bold">{storeName}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard title="Total SKUs" value={inventory.length} icon={Package} />
              <MetricCard title="Low Stock" value={lowCount} valueClass={lowCount > 0 ? "text-amber-500" : "text-[#1E1B4B]"} />
              <MetricCard title="Awaiting" value={pendingCount} valueClass="text-pink-500" />
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading data...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* INVENTORY TAB */}
              {activeTab === "inventory" && (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-pink-50/50 to-transparent">
                    <div>
                      <h3 className="text-base font-black text-[#1E1B4B]">Local Inventory</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Manage SKUs assigned to this branch</p>
                    </div>
                    <button
                      onClick={() => { setInvModalMode("add"); setInvForm({ sku: "", name: "", category: "Tops", stock: "", threshold: "" }); setInvErrors({}); setShowInvModal(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-sm shadow-pink-200 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>

                  {inventory.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center">
                        <Search className="w-7 h-7 text-pink-300" />
                      </div>
                      <p className="font-bold text-slate-500">No inventory data</p>
                      <p className="text-sm">Click "Add Product" to create entries.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU</th>
                            <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                            <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Category</th>
                            <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                            <th className="text-right py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item) => {
                            const isLow  = item.stock < item.threshold;
                            const isHigh = item.stock > item.threshold * 2;
                            const pct    = (item.stock / item.threshold) * 50;
                            return (
                              <tr key={item.id} className={`border-b border-slate-100 hover:bg-pink-50/40 transition-colors ${isLow ? "bg-red-50/30" : ""}`}>
                                <td className="py-3 px-5 font-mono text-xs text-slate-400">{item.sku}</td>
                                <td className="py-3 px-5 font-bold text-[#1E1B4B]">{item.name}</td>
                                <td className="py-3 px-5 hidden sm:table-cell">
                                  <span className="bg-violet-50 border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-3 px-5">
                                  <StockBar stock={item.stock} threshold={item.threshold} pct={pct} isLow={isLow} isHigh={isHigh} />
                                </td>
                                <td className="py-3 px-5">
                                  <div className="flex justify-end gap-1.5">
                                    <button onClick={() => { setInvModalMode("edit"); setEditingItem(item); setInvForm(item); setInvErrors({}); setShowInvModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-all">
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteInv(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* REQUESTS TAB */}
              {activeTab === "requests" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-black text-[#1E1B4B] tracking-tight">Pending Approval</h3>
                    <span className="text-xs text-slate-500 bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full font-semibold">{pendingCount} pending</span>
                  </div>
                  {pendingCount === 0 ? (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                      All caught up. No pending requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {requests.filter((r) => r.status === "pending").map((req) => (
                        <RequestCard key={req.id} req={req} role="store" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACKS TAB */}
              {activeTab === "acks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h3 className="text-xl font-black text-[#1E1B4B] tracking-tight">Processed Responses</h3>
                    <span className="text-xs text-slate-500 bg-white border border-slate-200 shadow-sm px-3 py-1 rounded-full font-semibold">{storeAcks.length} total</span>
                  </div>
                  {storeAcks.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                      No acknowledgements received yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {storeAcks.map((req) => <AcknowledgementCard key={req.id} ack={req} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* STOCK REQUEST MODAL  */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* coloured top */}
            <div className={`h-1.5 w-full ${modalMode === "pullback" ? "bg-gradient-to-r from-rose-400 to-pink-300" : "bg-gradient-to-r from-emerald-400 to-teal-300"}`} />

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${modalMode === "pullback" ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"}`}>
                  {modalMode === "pullback" ? <FileDown className="w-4 h-4 text-rose-500" /> : <CopyPlus className="w-4 h-4 text-emerald-500" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E1B4B]">Raise {modalMode === "pullback" ? "Pull-Back" : "Replenishment"}</h3>
                  <p className="text-xs text-slate-400">Submit a stock request to merchandising</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select
                    value={modalForm.sku}
                    onChange={(e) => { setModalForm({ ...modalForm, sku: e.target.value }); setModalErrors((p) => ({ ...p, sku: "" })); }}
                    className={inputCls(modalErrors.sku) + " pr-8 appearance-none cursor-pointer"}
                  >
                    <option value="">Select a product from inventory</option>
                    {inventory.map((i) => <option key={i.sku} value={i.sku}>{i.name} ({i.sku})</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errMsg(modalErrors.sku)}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                <input
                  type="number" min="1"
                  value={modalForm.quantity}
                  onChange={(e) => { setModalForm({ ...modalForm, quantity: e.target.value }); setModalErrors((p) => ({ ...p, quantity: "" })); }}
                  className={inputCls(modalErrors.quantity)}
                />
                {errMsg(modalErrors.quantity)}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  value={modalForm.reason}
                  onChange={(e) => { setModalForm({ ...modalForm, reason: e.target.value }); setModalErrors((p) => ({ ...p, reason: "" })); }}
                  placeholder="Briefly explain the necessity..."
                  className={inputCls(modalErrors.reason) + " resize-none"}
                />
                {errMsg(modalErrors.reason)}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setShowModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1E1B4B] hover:bg-white font-semibold text-sm transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={!requestIsComplete}
                className={`flex-1 h-11 rounded-xl font-black text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                  modalMode === "pullback"
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 disabled:hover:bg-rose-500"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 disabled:hover:bg-emerald-500"
                }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/*INVENTORY MODAL */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setShowInvModal(false)} />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-pink-400 to-violet-400" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-black text-[#1E1B4B]">{invModalMode === "add" ? "Add to Local Inventory" : "Edit Inventory Item"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invModalMode === "add" ? "Create a new product entry" : "Update product details"}</p>
              </div>
              <button onClick={() => setShowInvModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">SKU <span className="text-red-400">*</span></label>
                  <input disabled={invModalMode === "edit"} value={invForm.sku} onChange={(e) => { setInvForm({ ...invForm, sku: e.target.value }); setInvErrors((p) => ({ ...p, sku: "" })); }} className={inputCls(invErrors.sku) + " disabled:opacity-40 disabled:cursor-not-allowed"} />
                  {errMsg(invErrors.sku)}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <div className="relative">
                    <select value={invForm.category} onChange={(e) => setInvForm({ ...invForm, category: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all appearance-none pr-7">
                      {["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Ethnic", "Activewear", "Accessories"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name <span className="text-red-400">*</span></label>
                <input value={invForm.name} onChange={(e) => { setInvForm({ ...invForm, name: e.target.value }); setInvErrors((p) => ({ ...p, name: "" })); }} className={inputCls(invErrors.name)} />
                {errMsg(invErrors.name)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Stock <span className="text-red-400">*</span></label>
                  <input type="number" value={invForm.stock} onChange={(e) => { setInvForm({ ...invForm, stock: e.target.value }); setInvErrors((p) => ({ ...p, stock: "" })); }} className={inputCls(invErrors.stock)} />
                  {errMsg(invErrors.stock)}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Min Threshold <span className="text-red-400">*</span></label>
                  <input type="number" value={invForm.threshold} onChange={(e) => { setInvForm({ ...invForm, threshold: e.target.value }); setInvErrors((p) => ({ ...p, threshold: "" })); }} className={inputCls(invErrors.threshold)} />
                  {errMsg(invErrors.threshold)}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowInvModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1E1B4B] hover:bg-slate-50 font-semibold text-sm transition-all">Cancel</button>
              <button onClick={handleSaveInv} disabled={!invIsComplete} className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm transition-all shadow-md shadow-pink-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-pink-500">
                <Save className="w-4 h-4 inline mr-1.5" /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}