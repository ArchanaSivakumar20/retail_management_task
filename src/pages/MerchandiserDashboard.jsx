


import { useState, useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import DomoApi from "../API/domoAPI";
import {
  ArrowLeft, Menu, Plus, Search, LayoutDashboard, Inbox, Trash2, Edit,
  CheckCircle, Store, X, ChevronDown, TrendingUp, AlertTriangle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MetricCard } from "../components/dashboard/MetricCard";
import { StatusBadge } from "../components/dashboard/StatusBadge";
import { StockBar } from "../components/dashboard/StockBar";

export default function MerchandiserDashboard({ stores = [], refreshStores, onBack }) {
  const [allRequests,  setAllRequests]  = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("overview");

  // Track screen width for responsive column defs
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [filterStore,  setFilterStore]  = useState("All");
  const [filterType,   setFilterType]   = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [ackModal,      setAckModal]      = useState(null);
  const [ackText,       setAckText]       = useState("");
  const [submittingAck, setSubmittingAck] = useState(false);

  const [showInvModal,  setShowInvModal]  = useState(false);
  const [invModalMode,  setInvModalMode]  = useState("add");
  const [invModalStore, setInvModalStore] = useState("");
  const [editingItem,   setEditingItem]   = useState(null);
  const [invForm,       setInvForm]       = useState({ sku: "", name: "", category: "Tops", stock: "", threshold: "" });
  const [invErrors,     setInvErrors]     = useState({});

  const [showStoreModal,  setShowStoreModal]  = useState(false);
  const [storeForm,       setStoreForm]       = useState({ name: "", address: "", phone: "", manager: "" });
  const [storeErrors,     setStoreErrors]     = useState({});
  const [submittingStore, setSubmittingStore] = useState(false);

  const [itemToDelete, setItemToDelete] = useState(null);

  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [seenReqCount, setSeenReqCount] = useState(() =>
    Number(localStorage.getItem(`seenReq_merch`) || 0)
  );

  const [selectedStore, setSelectedStore] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [reqs, allInvDocs] = await Promise.all([
        DomoApi.fetchRequests(),
        DomoApi.ListDocuments("inventory").catch(() => [])
      ]);
      setAllRequests(reqs);
      const allInv = (allInvDocs || []).map(d => ({ id: d.id, ...d.content }));
      const mappedInv = {};
      stores.forEach((store) => { mappedInv[store] = []; });
      allInv.forEach((item) => {
        if (mappedInv[item.store]) mappedInv[item.store].push(item);
        else mappedInv[item.store] = [item];
      });
      setInventoryMap(mappedInv);
    } catch (e) {
      console.error(e);
      showToast("Data refresh failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stores.length > 0) { refresh(); setSelectedStore(stores[0]); }
    else { setLoading(false); }
  }, [stores.length]);

  const handleTabChange = (tabId) => { setActiveTab(tabId); setMobileNavOpen(false); };

  useEffect(() => {
    if (stores.length > 0 && !selectedStore) setSelectedStore(stores[0]);
  }, [stores]);

  const validateInv = () => {
    const errs = {};
    if (!invModalStore)              errs.store     = "Store is required.";
    if (!invForm.sku.trim())         errs.sku       = "SKU is required.";
    if (!invForm.name.trim())        errs.name      = "Product name is required.";
    if (invForm.stock === "" || isNaN(invForm.stock))         errs.stock     = "Valid stock number required.";
    if (invForm.threshold === "" || isNaN(invForm.threshold)) errs.threshold = "Valid threshold required.";
    setInvErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStore = () => {
    const errs = {};
    if (!storeForm.name.trim()) errs.name = "Branch name is required.";
    if (storeForm.phone && !/^[0-9\+\-\s]{7,15}$/.test(storeForm.phone)) errs.phone = "Enter a valid phone number.";
    setStoreErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProcessRequest = async (status) => {
    if (!ackModal) return;
    if (status === "rejected" && !ackText.trim()) { showToast("Feedback is required for rejection.", "error"); return; }
    setSubmittingAck(true);
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
      setAckModal(null); setAckText(""); refresh();
    } catch { showToast("Failed to process request.", "error"); }
    finally { setSubmittingAck(false); }
  };

  const handleAddStore = async () => {
    if (!validateStore() || submittingStore) return;
    setSubmittingStore(true);
    try {
      await DomoApi.CreateDocument("stores", { name: storeForm.name.trim(), address: storeForm.address.trim(), phone: storeForm.phone.trim(), manager: storeForm.manager.trim() });
      await refreshStores();
      showToast("Store registered!");
      setShowStoreModal(false);
      setStoreForm({ name: "", address: "", phone: "", manager: "" });
      setStoreErrors({});
    } catch { showToast("Failed to add store.", "error"); }
    finally { setSubmittingStore(false); }
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

  const handleDeleteInv  = async (item) => { setItemToDelete(item); };
  const confirmDeleteInv = async () => {
    if (!itemToDelete) return;
    try { await DomoApi.DeleteDocument("inventory", itemToDelete.id); showToast("Item deleted."); refresh(); }
    catch { showToast("Delete failed.", "error"); }
    finally { setItemToDelete(null); }
  };

  const hasLowStock   = Object.values(inventoryMap).some((inv) => inv.some((i) => i.stock < i.threshold));
  const pendingCount  = allRequests.filter((r) => r.status === "pending").length;
  const approvedCount = allRequests.filter((r) => r.status === "approved").length;

  useEffect(() => {
    if (activeTab === "requests" && pendingCount > seenReqCount) {
      setSeenReqCount(pendingCount);
      localStorage.setItem(`seenReq_merch`, pendingCount);
    }
  }, [pendingCount, activeTab, seenReqCount]);

  const reqBadgeCount = activeTab === "requests" ? 0 : Math.max(0, pendingCount - seenReqCount);

  const filteredRequests = allRequests
    .filter((r) => {
      if (filterStore  !== "All" && r.store  !== filterStore)                return false;
      if (filterType   !== "All" && r.type   !== filterType.toLowerCase())   return false;
      if (filterStatus !== "All" && r.status !== filterStatus.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const NAV_ITEMS = [
    { id: "overview",  label: "Warehouse View",  icon: LayoutDashboard },
    { id: "requests",  label: "Global Requests", icon: Inbox, badge: reqBadgeCount },
  ];

  const inputCls = (err) =>
    `w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
      err ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
    }`;
  const errMsg = (msg) =>
    msg ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><span>⚠</span> {msg}</p> : null;

  const invIsComplete = invForm.sku.trim() && invForm.name.trim() && invForm.stock !== "" && invForm.threshold !== "";

  const currentStoreInv = selectedStore ? (inventoryMap[selectedStore] || []) : [];

  // Breakpoints
  const isMobile = winW < 480;
  const isSmall  = winW < 640;
  const isTablet = winW < 1024;

  // ── AG Grid: Warehouse Inventory columns ────────────────────────────────────
  // Mobile: sku(80)+name(110)+category(90)+stock(120)+actions(75) = 475
  const WH_INV_MOBILE_WIDTH = 475;

  const whInvColDefs = useMemo(() => [
    {
      field: "sku",
      headerName: "SKU",
      width: isMobile ? 80 : 90,
      cellClass: "font-mono text-xs text-slate-400",
    },
    {
      field: "name",
      headerName: "Product",
      width: isMobile ? 110 : undefined,
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 110 : 120,
      cellClass: "font-bold text-[#1E1B4B] text-xs sm:text-sm",
    },
    {
      field: "category",
      headerName: "Category",
      width: isMobile ? 90 : isTablet ? 115 : 135,
      cellRenderer: ({ value }) => (
        <span className="bg-violet-50 border border-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full text-xs font-semibold truncate">
          {value}
        </span>
      ),
    },
    {
      field: "stock",
      headerName: "Stock",
      width: isMobile ? 120 : isTablet ? 160 : 210,
      filter: false,
      cellRenderer: ({ data }) => {
        const isLow  = data.stock < data.threshold;
        const isHigh = data.stock > data.threshold * 2;
        const pct    = (data.stock / data.threshold) * 50;
        return <StockBar stock={data.stock} threshold={data.threshold} pct={pct} isLow={isLow} isHigh={isHigh} />;
      },
    },
    {
      headerName: "Actions",
      width: isMobile ? 75 : 100,
      minWidth: isMobile ? 75 : 100,
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellRenderer: ({ data }) => (
        <div className="flex items-center gap-0.5 h-full">
          <button
            onClick={() => { setInvModalStore(selectedStore); setInvModalMode("edit"); setEditingItem(data); setInvForm(data); setInvErrors({}); setShowInvModal(true); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteInv(data)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [winW, selectedStore, inventoryMap]);

  // ── AG Grid: Global Requests columns ────────────────────────────────────────
  // Mobile: store(90)+type(75)+product(120)+sku(80)+qty(58)+status(95)+actions(80) = 598
  const REQ_MOBILE_WIDTH = 598;

  const reqColDefs = useMemo(() => [
    {
      field: "store",
      headerName: "Store",
      width: isMobile ? 90 : isTablet ? 125 : 155,
      cellClass: "text-xs font-semibold text-slate-600",
    },
    {
      field: "type",
      headerName: "Type",
      width: isMobile ? 75 : isTablet ? 115 : 125,
      cellRenderer: ({ value }) => {
        const isPull = value === "pullback";
        return (
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold border ${isPull ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
            {isPull ? (isMobile ? "Pull" : "Pull-Back") : (isMobile ? "Repl" : "Replenish")}
          </span>
        );
      },
    },
    {
      field: "productName",
      headerName: "Product",
      width: isMobile ? 120 : undefined,
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 120,
      cellClass: "text-xs font-semibold text-[#1E1B4B]",
    },
    {
      field: "sku",
      headerName: "SKU",
      width: isMobile ? 80 : 90,
      hide: isTablet && !isMobile ? false : (!isMobile && isTablet),
      cellClass: "font-mono text-xs text-slate-400",
    },
    {
      field: "quantity",
      headerName: "Qt",
      width: isMobile ? 58 : 70,
      filter: "agNumberColumnFilter",
      filterParams: { filterOptions: ["equals"], maxNumConditions: 1 },
    },
    {
      field: "status",
      headerName: "Status",
      width: isMobile ? 95 : isTablet ? 115 : 135,
      cellRenderer: ({ value }) => <StatusBadge status={value} />,
    },
    {
      headerName: "Actions",
      width: isMobile ? 80 : isTablet ? 180 : 205,
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellRenderer: ({ data }) =>
        data.status === "pending" ? (
          <div className="flex items-center gap-1 h-full">
            <button
              onClick={() => { setAckModal(data); setAckText(""); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all whitespace-nowrap">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />{!isMobile && <span>Approve</span>}
            </button>
            <button
              onClick={() => { setAckModal(data); setAckText(""); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-all whitespace-nowrap">
              <X className="w-3 h-3 flex-shrink-0" />{!isMobile && <span>Reject</span>}
            </button>
          </div>
        ) : <span className="text-xs text-slate-400 font-medium italic">Processed</span>,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [winW, allRequests]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: false,
    suppressMovable: true,
    cellStyle: { display: "flex", alignItems: "center" },
    minWidth: 48,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    filterParams: { filterOptions: ["contains"], maxNumConditions: 1, debounceMs: 200 },
  }), []);

  /*
   * GRID RENDERING STRATEGY
   * Mobile  (<640 px) : domLayout="autoHeight" — grid grows; page scrolls vertically
   *                     outer wrapper: overflow-x-auto with fixed mobileWidth → finger-scroll horizontally
   * Desktop (≥640 px) : domLayout="normal" — fixed height; grid scrolls internally
   */
  const gridDomLayout = isSmall ? "autoHeight" : "normal";

  /*
   * GridWrapper
   * Mobile  : horizontal-scrollable shell + autoHeight grid inside a fixed-width div
   * Desktop : fixed-height box, grid scrolls internally
   */
  const GridWrapper = ({ children, desktopHeight = 440, mobileWidth = 480 }) =>
    isSmall ? (
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ width: mobileWidth, minWidth: mobileWidth }}>
          {children}
        </div>
      </div>
    ) : (
      <div style={{ height: desktopHeight, width: "100%" }}>{children}</div>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-[#F5F4FF] font-sans text-[#1E1B4B]">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold
          bottom-[72px] left-3 right-3 sm:bottom-5 sm:left-auto sm:right-5 sm:w-auto
          ${toast.type === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === "error" ? "bg-red-400" : "bg-emerald-400"}`} />
          {toast.msg}
        </div>
      )}

      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-[#1E1B4B]/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1E1B4B] flex flex-col transition-transform duration-300 ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="font-black text-white text-sm">Z</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full border-2 border-[#1E1B4B]" />
            </div>
            <span className="font-black tracking-tight text-white">ZUDIO <span className="text-violet-300">RMS</span></span>
          </div>
          <button className="lg:hidden text-white/40 hover:text-white" onClick={() => setMobileNavOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-violet-300 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-violet-200 uppercase tracking-widest truncate">Central Merchandising</span>
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon; const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${active ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-white/40"}`} />
                <span className="font-semibold">{item.label}</span>
                {item.badge > 0 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-black bg-violet-400 text-white ring-2 ring-[#1E1B4B]">{item.badge}</span>}
              </button>
            );
          })}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-2">Administration</p>
            <button onClick={() => { setShowStoreModal(true); setStoreErrors({}); setStoreForm({ name: "", address: "", phone: "", manager: "" }); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/8 font-semibold">
              <Store className="w-4 h-4 text-white/30 flex-shrink-0" /> Register Store
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/10 transition-all font-semibold">
            <ArrowLeft className="w-4 h-4" /> Switch Role
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col w-full min-w-0 lg:overflow-hidden">

        {/* Mobile sticky top header */}
        <header className="lg:hidden h-14 border-b border-violet-100 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="font-black text-white text-xs">Z</span>
            </div>
            <span className="font-black text-sm text-[#1E1B4B]">ZUDIO <span className="text-violet-500">RMS</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(true)} className="flex-shrink-0 p-2 text-slate-400 hover:text-[#1E1B4B]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile bottom tab bar */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-stretch shadow-lg">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon; const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors min-w-0 ${active ? "text-violet-500" : "text-slate-400"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[9px] font-semibold leading-tight w-full text-center px-0.5 truncate">
                  {item.id === "overview" ? "Warehouse" : "Requests"}
                </span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 translate-x-2 text-[9px] min-w-[16px] h-4 px-1 rounded-full font-black bg-violet-500 text-white flex items-center justify-center">{item.badge}</span>
                )}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-violet-500 rounded-full" />}
              </button>
            );
          })}
          {/* Register Store shortcut */}
          <button onClick={() => { setShowStoreModal(true); setStoreErrors({}); setStoreForm({ name: "", address: "", phone: "", manager: "" }); }}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-slate-400 min-w-0 relative">
            <Store className="w-5 h-5 flex-shrink-0" />
            <span className="text-[9px] font-semibold leading-tight">Register</span>
          </button>
        </nav>

        {/* Scroll hint for mobile */}
        {isSmall && !loading && stores.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-1 bg-violet-50 border-b border-violet-100">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h4" />
            </svg>
            <span className="text-[10px] font-semibold text-violet-400 tracking-wide">Scroll table left / right to see all columns</span>
            <svg className="w-3 h-3 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        <div className="w-full p-3 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-6 pb-24 sm:pb-6 lg:flex-1 lg:overflow-y-auto">

          {/* Page header + Metric cards */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#1E1B4B] mb-0.5 sm:mb-1">Global Dashboard</h2>
              <p className="text-slate-400 font-medium text-xs sm:text-sm">
                Monitoring <span className="text-violet-500 font-bold">{stores.length}</span> Connected {stores.length === 1 ? "Location" : "Locations"}
              </p>
            </div>
            {/* 2×2 on mobile, 4-col on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
              <MetricCard title="Locations"    value={stores.length}  icon={Store} />
              <MetricCard title="Approved"     value={approvedCount}  valueClass="text-emerald-500" icon={CheckCircle} />
              <MetricCard title="Pending"      value={pendingCount}   valueClass={pendingCount > 0 ? "text-amber-500" : "text-[#1E1B4B]"} icon={Inbox} />
              <MetricCard title="Stock Health" value={hasLowStock ? "Warn" : "OK"} valueClass={hasLowStock ? "text-red-500" : "text-emerald-500"} icon={hasLowStock ? AlertTriangle : TrendingUp} />
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
              <p className="text-sm text-center px-4">Tap "Register" below or use the sidebar.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4 sm:gap-5">

              {/* ── OVERVIEW TAB ── */}
              {activeTab === "overview" && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-transparent flex-shrink-0">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-black text-[#1E1B4B] uppercase tracking-widest">Warehouse View</h3>
                        {selectedStore && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            <span className="text-violet-600 font-bold">{selectedStore}</span>{" — "}{currentStoreInv.length} SKUs
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {stores.length > 0 && (
                          <Select value={selectedStore} onValueChange={setSelectedStore}>
                            <SelectTrigger className="flex-1 sm:flex-none sm:w-[180px] bg-white border border-slate-200 text-slate-600 rounded-xl h-9 sm:h-10 focus:ring-violet-200 focus:border-violet-400 font-bold text-xs min-w-0" style={{ boxShadow: "none" }}>
                              <SelectValue placeholder="Select Store" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                              {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {selectedStore && (
                          <button
                            onClick={() => { setInvModalStore(selectedStore); setInvModalMode("add"); setInvForm({ sku: "", name: "", category: "Tops", stock: "", threshold: "" }); setInvErrors({}); setShowInvModal(true); }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-sm shadow-violet-200 h-9 sm:h-10 whitespace-nowrap">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Add Item</span>
                            <span className="xs:hidden">Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!selectedStore || currentStoreInv.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                      <Search className="w-8 h-8 text-violet-200" />
                      <p className="text-sm font-medium">No items mapped yet</p>
                    </div>
                  ) : (
                    <GridWrapper desktopHeight={440} mobileWidth={WH_INV_MOBILE_WIDTH}>
                      <div className="ag-theme-quartz w-full h-full">
                        <AgGridReact
                          rowData={currentStoreInv}
                          columnDefs={whInvColDefs}
                          defaultColDef={defaultColDef}
                          pagination={true}
                          paginationPageSize={isMobile ? 8 : 10}
                          paginationPageSizeSelector={false}
                          rowHeight={isMobile ? 44 : 52}
                          suppressCellFocus={true}
                          domLayout={gridDomLayout}
                          suppressHorizontalScroll={false}
                        />
                      </div>
                    </GridWrapper>
                  )}
                </div>
              )}

              {/* ── REQUESTS TAB ── */}
              {activeTab === "requests" && (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Filters */}
                  <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="hidden sm:block flex-shrink-0">
                        <h3 className="text-sm font-black text-[#1E1B4B] uppercase tracking-widest">System Requests</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Review and manage incoming store applications.</p>
                      </div>
                      {/* 3-col grid on mobile, flex row right-aligned on sm+ */}
                      <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-2 sm:ml-auto">
                        <Select value={filterStore} onValueChange={setFilterStore}>
                          <SelectTrigger className="w-full sm:w-[130px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                            <SelectItem value="All">All Stores</SelectItem>
                            {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="w-full sm:w-[130px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="pullback">Pull-Backs</SelectItem>
                            <SelectItem value="replenishment">Replenishments</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full sm:w-[130px] bg-slate-50 border-slate-200 text-slate-600 rounded-xl h-9 focus:ring-violet-200 focus:border-violet-400 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-[#1E1B4B]">
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {filteredRequests.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-sm">No requests match current filters.</div>
                    ) : (
                      <GridWrapper desktopHeight={440} mobileWidth={REQ_MOBILE_WIDTH}>
                        <div className="ag-theme-quartz w-full h-full">
                          <AgGridReact
                            rowData={filteredRequests}
                            columnDefs={reqColDefs}
                            defaultColDef={defaultColDef}
                            pagination={true}
                            paginationPageSize={isMobile ? 8 : 10}
                            paginationPageSizeSelector={false}
                            rowHeight={isMobile ? 44 : 52}
                            suppressCellFocus={true}
                            domLayout={gridDomLayout}
                            suppressHorizontalScroll={false}
                          />
                        </div>
                      </GridWrapper>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── PROCESS REQUEST MODAL ── */}
      {ackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => !submittingAck && setAckModal(null)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0 mr-2">
                <h3 className="text-base sm:text-lg font-black text-[#1E1B4B] truncate">Process Request</h3>
                <p className="text-xs text-slate-400 mt-0.5">Review and respond to this stock request</p>
              </div>
              <button onClick={() => setAckModal(null)} disabled={submittingAck} className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            {submittingAck ? (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                <div>
                  <h4 className="font-bold text-[#1E1B4B] text-lg">Updating Global Records...</h4>
                  <p className="text-sm text-slate-500 mt-1">Please wait while the system securely processes this inventory transaction.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "55vh" }}>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={ackModal.type} type="reqType" />
                      <span className="text-xs font-mono text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full truncate max-w-[130px]">{ackModal.id}</span>
                    </div>
                    <p className="font-black text-[#1E1B4B] text-sm sm:text-base truncate">{ackModal.productName} <span className="text-slate-400 font-mono text-xs font-normal">({ackModal.sku})</span></p>
                    <div className="flex items-center gap-3 sm:gap-4 text-sm text-slate-500 flex-wrap">
                      <span>From: <span className="text-violet-600 font-bold">{ackModal.store}</span></span>
                      <span>Qty: <span className="text-[#1E1B4B] font-black">{ackModal.quantity}</span></span>
                    </div>
                    {ackModal.reason && <p className="text-xs text-slate-500 italic bg-white rounded-lg px-3 py-2 border border-slate-200">"{ackModal.reason}"</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Feedback <span className="text-slate-400 normal-case font-normal">(Required for rejection)</span></label>
                    <textarea value={ackText} onChange={(e) => setAckText(e.target.value)} placeholder="Enter feedback for the store manager..." rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none" />
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                  <button onClick={() => handleProcessRequest("rejected")} className="flex-1 h-11 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 font-bold text-sm transition-all">Reject</button>
                  <button onClick={() => handleProcessRequest("approved")} className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-md shadow-emerald-200">Approve</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REGISTER STORE MODAL ── */}
      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => { if (!submittingStore) setShowStoreModal(false); }} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0 mr-2">
                <h3 className="text-base sm:text-lg font-black text-[#1E1B4B] truncate">Register New Location</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add a new retail branch to the system</p>
              </div>
              <button onClick={() => setShowStoreModal(false)} disabled={submittingStore} className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Branch Name <span className="text-red-400">*</span></label>
                <input autoFocus value={storeForm.name} onChange={(e) => { setStoreForm(f => ({ ...f, name: e.target.value })); setStoreErrors({}); }} onKeyDown={(e) => e.key === "Enter" && handleAddStore()} placeholder="e.g. Zudio Downtown Branch" className={inputCls(storeErrors.name)} />
                {errMsg(storeErrors.name)}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Address</label>
                <textarea value={storeForm.address} onChange={(e) => setStoreForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address, city, pincode" rows={2} className={inputCls(false) + " resize-none"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                  <input type="tel" value={storeForm.phone} onChange={(e) => { setStoreForm(f => ({ ...f, phone: e.target.value })); setStoreErrors(p => ({ ...p, phone: "" })); }} placeholder="+91 98765 43210" className={inputCls(storeErrors.phone)} />
                  {errMsg(storeErrors.phone)}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manager</label>
                  <input value={storeForm.manager} onChange={(e) => setStoreForm(f => ({ ...f, manager: e.target.value }))} placeholder="Branch manager" className={inputCls(false)} />
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setShowStoreModal(false)} disabled={submittingStore} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:bg-white font-semibold text-sm transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleAddStore} disabled={!storeForm.name.trim() || submittingStore}
                className="flex-1 h-11 rounded-xl bg-[#1E1B4B] hover:bg-[#2d2a6e] text-white font-black text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submittingStore ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</> : "Register Location"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTORY MODAL ── */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setShowInvModal(false)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="min-w-0 mr-2">
                <h3 className="text-sm sm:text-base font-black text-[#1E1B4B] truncate">{invModalMode === "add" ? `Map to ${invModalStore}` : "Edit Product"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invModalMode === "add" ? "Add a new product to this location" : "Update product details"}</p>
              </div>
              <button onClick={() => setShowInvModal(false)} className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">SKU <span className="text-red-400">*</span></label>
                  <input disabled={invModalMode === "edit"} value={invForm.sku} onChange={(e) => { setInvForm({ ...invForm, sku: e.target.value }); setInvErrors((p) => ({ ...p, sku: "" })); }} className={inputCls(invErrors.sku) + " disabled:opacity-40 disabled:cursor-not-allowed"} />
                  {errMsg(invErrors.sku)}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <div className="relative">
                    <select value={invForm.category} onChange={(e) => setInvForm({ ...invForm, category: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all appearance-none pr-7">
                      {["Tops","Bottoms","Dresses","Outerwear","Footwear","Ethnic","Activewear","Accessories"].map((c) => <option key={c} value={c}>{c}</option>)}
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
              <div className="grid grid-cols-2 gap-3">
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
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowInvModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-sm transition-all">Cancel</button>
              <button onClick={handleSaveInv} disabled={!invIsComplete} className="flex-1 h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-black text-sm transition-all shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-500">
                {invModalMode === "add" ? "Save Item" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => setItemToDelete(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100 shadow-sm shadow-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#1E1B4B]">Remove Mapping?</h3>
                <p className="text-sm text-slate-500 mt-2 px-2">
                  This will remove <span className="font-bold text-[#1E1B4B]">{itemToDelete.name}</span> from <span className="font-bold text-violet-600">{itemToDelete.store}</span>'s local inventory view. The central definition remains.
                </p>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setItemToDelete(null)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:bg-white font-semibold text-sm transition-all">Cancel</button>
              <button onClick={confirmDeleteInv} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-all shadow-md shadow-red-200">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}