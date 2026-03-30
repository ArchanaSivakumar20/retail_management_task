
import { useState, useEffect } from "react";
import DomoApi from "../API/domoAPI";
import {
  ArrowLeft, Menu, Plus, Search, LayoutDashboard, Inbox, Trash2, Edit,
  CheckCircle, Store, X, ChevronDown,TrendingUp, AlertTriangle, Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MetricCard } from "../components/dashboard/MetricCard";
import { StatusBadge } from "../components/dashboard/StatusBadge";
import { StockBar } from "../components/dashboard/StockBar";
import { RequestCard } from "../components/dashboard/RequestCard";

export default function MerchandiserDashboard({ stores = [], refreshStores, onBack }) {
  const [allRequests, setAllRequests] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [filterStore, setFilterStore] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [ackModal, setAckModal] = useState(null);
  const [ackText, setAckText] = useState("");

  const [showInvModal, setShowInvModal] = useState(false);
  const [invModalMode, setInvModalMode] = useState("add");
  const [invModalStore, setInvModalStore] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [invForm, setInvForm] = useState({ sku: "", name: "", category: "Tops", stock: "", threshold: "" });
  const [invErrors, setInvErrors] = useState({});

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: "" });
  const [storeErrors, setStoreErrors] = useState({});

  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const reqs = await DomoApi.fetchRequests();
      setAllRequests(reqs);
      const invResults = await Promise.all(
        stores.map(async (store) => {
          try { const inv = await DomoApi.fetchInventory(store); return [store, inv || []]; }
          catch { return [store, []]; }
        })
      );
      setInventoryMap(Object.fromEntries(invResults));
    } catch (e) { console.error(e); showToast("Data refresh failed.", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (stores.length > 0) refresh(); else setLoading(false);
  }, [stores.length]);

  // Validation 
  const validateInv = () => {
    const errs = {};
    if (!invModalStore) errs.store = "Store is required.";
    if (!invForm.sku.trim()) errs.sku = "SKU is required.";
    if (!invForm.name.trim()) errs.name = "Product name is required.";
    if (invForm.stock === "" || isNaN(invForm.stock)) errs.stock = "Valid stock number required.";
    if (invForm.threshold === "" || isNaN(invForm.threshold)) errs.threshold = "Valid threshold required.";
    setInvErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStore = () => {
    const errs = {};
    if (!storeForm.name.trim()) errs.name = "Store name is required.";
    setStoreErrors(errs);
    return Object.keys(errs).length === 0;
  };

  //  Handlers
  const handleProcessRequest = async (status) => {
    if (!ackModal) return;
    try {
      if (status === "approved") {
        const storeInv = inventoryMap[ackModal.store] || [];
        const item = storeInv.find((i) => i.sku === ackModal.sku);
        if (item) {
          const change = ackModal.type === "pullback" ? -Number(ackModal.quantity) : Number(ackModal.quantity);
          await DomoApi.UpdateDocument("inventory", item.id, { ...item, stock: Math.max(0, item.stock + change) });
        }
      }
      await DomoApi.UpdateDocument("requests", ackModal.id, {
        ...ackModal, status,
        feedback: ackText.trim() || `${status === "approved" ? "Approved" : "Rejected"} by Merchandising.`,
      });
      showToast(`Request ${status}.`);
      setAckModal(null); setAckText("");
      refresh();
    } catch { showToast("Failed to process request.", "error"); }
  };

  const handleAddStore = async () => {
    if (!validateStore()) return;
    try {
      await DomoApi.CreateDocument("stores", { name: storeForm.name.trim() });
      await refreshStores();
      showToast("Store added!");
      setShowStoreModal(false); setStoreForm({ name: "" }); setStoreErrors({});
    } catch { showToast("Failed to add store.", "error"); }
  };

  const handleSaveInv = async () => {
    if (!validateInv()) return;
    try {
      const doc = { store: invModalStore, sku: invForm.sku, name: invForm.name, category: invForm.category, stock: Number(invForm.stock), threshold: Number(invForm.threshold) };
      if (invModalMode === "add") { await DomoApi.CreateDocument("inventory", doc); showToast("Product added globally."); }
      else { await DomoApi.UpdateDocument("inventory", editingItem.id, doc); showToast("Product updated globally."); }
      setShowInvModal(false); setInvErrors({}); refresh();
    } catch { showToast("Failed to save product.", "error"); }
  };

  const handleDeleteInv = async (item) => {
    if (!window.confirm("Delete this central item mapping?")) return;
    try { await DomoApi.DeleteDocument("inventory", item.id); showToast("Item deleted."); refresh(); }
    catch { showToast("Delete failed.", "error"); }
  };

  const hasLowStock  = Object.values(inventoryMap).some((inv) => inv.some((i) => i.stock < i.threshold));
  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const approvedCount= allRequests.filter((r) => r.status === "approved").length;

  const filteredRequests = allRequests.filter((r) => {
    if (filterStore  !== "All" && r.store !== filterStore) return false;
    if (filterType   !== "All" && r.type  !== filterType.toLowerCase()) return false;
    if (filterStatus !== "All" && r.status!== filterStatus.toLowerCase()) return false;
    return true;
  });

  const NAV_ITEMS = [
    { id: "overview",  label: "Warehouse View",   icon: LayoutDashboard },
    { id: "requests",  label: "Global Requests",  icon: Inbox, badge: pendingCount },
  ];

  // Style helpers 
  const inputCls = (err) =>
    `w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
      err
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
    }`;
  const errMsg = (msg) =>
    msg ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><span>⚠</span> {msg}</p> : null;

  const invIsComplete = invForm.sku.trim() && invForm.name.trim() && invForm.stock !== "" && invForm.threshold !== "";

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

      {/*  Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1E1B4B] flex flex-col transition-transform duration-300 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="font-black text-white text-sm">Z</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full border-2 border-[#1E1B4B]" />
            </div>
            <span className="font-black tracking-tight text-white">ZUDIO <span className="text-violet-300">RMS</span></span>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white transition-colors" onClick={() => setMobileNavOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
            <span className="text-xs font-bold text-violet-200 uppercase tracking-widest">Central Merchandising</span>
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
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
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

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">Administration</p>
            <button
              onClick={() => { setShowStoreModal(true); setStoreErrors({}); setStoreForm({ name: "" }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/8 font-semibold"
            >
              <Store className="w-4 h-4 text-white/30" /> Register Store
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
        <header className="lg:hidden h-14 border-b border-violet-100 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="font-black text-white text-xs">Z</span>
            </div>
            <span className="font-black text-sm text-[#1E1B4B]">ZUDIO <span className="text-violet-500">RMS</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(true)} className="p-2 text-slate-400 hover:text-[#1E1B4B]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E1B4B] mb-1">Global Dashboard</h2>
              <p className="text-slate-400 font-medium text-sm">
                Monitoring <span className="text-violet-500 font-bold">{stores.length}</span> Connected {stores.length === 1 ? "Location" : "Locations"}
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Locations" value={stores.length} icon={Store} />
              <MetricCard title="Approved" value={approvedCount} valueClass="text-emerald-500" icon={CheckCircle} />
              <MetricCard title="Pending" value={pendingCount} valueClass={pendingCount > 0 ? "text-amber-500" : "text-[#1E1B4B]"} icon={Inbox} />
              <MetricCard title="Stock Health" value={hasLowStock ? "Warning" : "Optimal"} valueClass={hasLowStock ? "text-red-500" : "text-emerald-500"} icon={hasLowStock ? AlertTriangle : TrendingUp} />
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading master data...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-2">
                <Search className="w-7 h-7 text-violet-300" />
              </div>
              <p className="font-bold text-slate-500">No stores registered yet</p>
              <p className="text-sm">Click "Register Store" in the sidebar.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="grid xl:grid-cols-2 gap-5">
                  {stores.map((store) => {
                    const inv = inventoryMap[store] || [];
                    return (
                      <div key={store} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-violet-50/60 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-50 border border-violet-100 rounded-xl">
                              <Store className="w-4 h-4 text-violet-500" />
                            </div>
                            <h3 className="text-base font-black text-[#1E1B4B]">{store}</h3>
                            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-medium">{inv.length} SKUs</span>
                          </div>
                          <button
                            onClick={() => { setInvModalStore(store); setInvModalMode("add"); setInvForm({ sku: "", name: "", category: "Tops", stock: "", threshold: "" }); setInvErrors({}); setShowInvModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-sm shadow-violet-200"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Item
                          </button>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[260px]">
                          {inv.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                              <Search className="w-8 h-8 text-violet-200" />
                              <p className="text-sm font-medium">No items mapped yet</p>
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU / Item</th>
                                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Level</th>
                                  <th className="text-right py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.map((item) => {
                                  const isLow  = item.stock < item.threshold;
                                  const isHigh = item.stock > item.threshold * 2;
                                  const pct    = (item.stock / item.threshold) * 50;
                                  return (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-violet-50/30 transition-colors">
                                      <td className="py-3 px-5">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-[#1E1B4B] text-sm">{item.name}</span>
                                          <span className="font-mono text-[10px] text-slate-400 mt-0.5">{item.sku}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-5">
                                        <StockBar stock={item.stock} threshold={item.threshold} pct={pct} isLow={isLow} isHigh={isHigh} />
                                      </td>
                                      <td className="py-3 px-5">
                                        <div className="flex justify-end gap-1.5">
                                          <button onClick={() => { setInvModalStore(store); setInvModalMode("edit"); setEditingItem(item); setInvForm(item); setInvErrors({}); setShowInvModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all">
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => handleDeleteInv(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* REQUESTS TAB */}
              {activeTab === "requests" && (
                <div className="space-y-5">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <Select value={filterStore} onValueChange={setFilterStore}>
                      <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                        <SelectItem value="All">All Stores</SelectItem>
                        {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="pullback">Pull-Backs</SelectItem>
                        <SelectItem value="replenishment">Replenishments</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="ml-auto text-xs text-slate-400 font-semibold">{filteredRequests.length} result{filteredRequests.length !== 1 ? "s" : ""}</span>
                  </div>

                  {filteredRequests.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                      No requests match current filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredRequests.map((req) => (
                        <RequestCard
                          key={req.id} req={req} role="merchandiser"
                          onApprove={(id) => { setAckModal(allRequests.find((r) => r.id === id)); setAckText(""); }}
                          onReject={(id) => { setAckModal(allRequests.find((r) => r.id === id)); setAckText(""); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* PROCESS REQUEST MODAL  */}
      {ackModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setAckModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 via-pink-400 to-rose-300" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#1E1B4B]">Process Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">Review and respond to this stock request</p>
              </div>
              <button onClick={() => setAckModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={ackModal.type} type="reqType" />
                  <span className="text-xs font-mono text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{ackModal.id}</span>
                </div>
                <p className="font-black text-[#1E1B4B]">{ackModal.productName} <span className="text-slate-400 font-mono text-xs font-normal">({ackModal.sku})</span></p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>From: <span className="text-violet-600 font-bold">{ackModal.store}</span></span>
                  <span>Qty: <span className="text-[#1E1B4B] font-black">{ackModal.quantity}</span></span>
                </div>
                {ackModal.reason && (
                  <p className="text-xs text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-200">"{ackModal.reason}"</p>
                )}
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Feedback Notes <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={ackText}
                  onChange={(e) => setAckText(e.target.value)}
                  placeholder="Enter feedback for the store manager..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => handleProcessRequest("rejected")} className="flex-1 h-11 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 font-bold text-sm transition-all">
                Reject Request
              </button>
              <button onClick={() => handleProcessRequest("approved")} className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-md shadow-emerald-200">
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  REGISTER STORE MODAL */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setShowStoreModal(false)} />
          <div className="relative w-full sm:max-w-sm bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-indigo-400" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#1E1B4B]">Register New Store</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add a new retail location</p>
              </div>
              <button onClick={() => setShowStoreModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location Name</label>
              <input
                autoFocus value={storeForm.name}
                onChange={(e) => { setStoreForm({ name: e.target.value }); setStoreErrors({}); }}
                onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                placeholder="e.g. Zudio Downtown Branch"
                className={inputCls(storeErrors.name)}
              />
              {errMsg(storeErrors.name)}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setShowStoreModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:bg-white font-semibold text-sm transition-all">Cancel</button>
              <button
                onClick={handleAddStore}
                disabled={!storeForm.name.trim()}
                className="flex-1 h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-black text-sm transition-all shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-500"
              >
                Register Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY MODAL */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setShowInvModal(false)} />
          <div className="relative w-full sm:max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-pink-400" />
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-black text-[#1E1B4B]">{invModalMode === "add" ? `Map to ${invModalStore}` : "Edit Product"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invModalMode === "add" ? "Add a new product to this location" : "Update product details"}</p>
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
                    <select value={invForm.category} onChange={(e) => setInvForm({ ...invForm, category: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all appearance-none pr-7">
                      {["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Ethnic", "Activewear", "Accessories"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none hidden" />
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Stock <span className="text-red-400">*</span></label>
                  <input type="number" value={invForm.stock} onChange={(e) => { setInvForm({ ...invForm, stock: e.target.value }); setInvErrors((p) => ({ ...p, stock: "" })); }} className={inputCls(invErrors.stock)} />
                  {errMsg(invErrors.stock)}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Threshold <span className="text-red-400">*</span></label>
                  <input type="number" value={invForm.threshold} onChange={(e) => { setInvForm({ ...invForm, threshold: e.target.value }); setInvErrors((p) => ({ ...p, threshold: "" })); }} className={inputCls(invErrors.threshold)} />
                  {errMsg(invErrors.threshold)}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowInvModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-sm transition-all">Cancel</button>
              <button onClick={handleSaveInv} disabled={!invIsComplete} className="flex-1 h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-black text-sm transition-all shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-500">
                {invModalMode === "add" ? "Map Item" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}