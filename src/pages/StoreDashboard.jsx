


import { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import DomoApi from "../API/domoAPI";
import {
  Package, FileText, CheckCircle, ArrowLeft, Menu, Plus,
  Trash2, Edit, Save, X, Search, FileDown, CopyPlus, ChevronDown,
} from "lucide-react";
import { StatusBadge } from "../components/dashboard/StatusBadge";
import { StockBar } from "../components/dashboard/StockBar";
import { MetricCard } from "../components/dashboard/MetricCard";

export default function StoreDashboard({ storeName, onBack, onSwitchStore, stores = [] }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  const [seenReqCount, setSeenReqCount] = useState(0);
  const [seenAckCount, setSeenAckCount] = useState(0);

  useEffect(() => {
    setSeenReqCount(Number(localStorage.getItem(`seenReq_${storeName}`) || 0));
    setSeenAckCount(Number(localStorage.getItem(`seenAck_${storeName}`) || 0));
  }, [storeName]);

  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Request Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("pullback");
  const [modalForm, setModalForm] = useState({ sku: "", quantity: 1, reason: "" });
  const [modalErrors, setModalErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Inventory modal
  const [showInvModal, setShowInvModal] = useState(false);
  const [invModalMode, setInvModalMode] = useState("add");
  const [editingItem, setEditingItem] = useState(null);
  const [invForm, setInvForm] = useState({ sku: "", name: "", category: "Tops", stock: "", threshold: "" });
  const [invErrors, setInvErrors] = useState({});

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [allInvDocs, allReqs] = await Promise.all([
        DomoApi.ListDocuments("inventory").catch(() => []),
        DomoApi.fetchRequests()
      ]);
      const allInv = allInvDocs.map(d => ({ id: d.id, ...d.content }));
      const uniqueProds = allInv.filter((p, i, arr) => arr.findIndex(q => q.sku === p.sku) === i);
      setAllProducts(uniqueProds);
      const storeInv = allInv.filter((d) => d.store === storeName);
      setInventory(storeInv);
      const storeReqs = allReqs.filter(r => r.store === storeName)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(storeReqs);
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [storeName]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  const openModal = (mode, prefillSku = "") => {
    setModalMode(mode);
    setModalForm({ sku: prefillSku, quantity: 1, reason: "" });
    setModalErrors({});
    setSubmitting(false);
    setShowModal(true);
    setMobileNavOpen(false);
  };

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

  const handleCreateRequest = async () => {
    if (submitting) return;
    if (!validateRequest()) return;
    setSubmitting(true);
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
      showToast(`${modalMode === "pullback" ? "Pull-Back" : "Replenishment"} request submitted.`);
      setShowModal(false);
      setModalErrors({});
      refresh();
    } catch {
      showToast("Failed to create request.", "error");
    } finally {
      setSubmitting(false);
    }
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

  const lowCount = inventory.filter((i) => i.stock < i.threshold).length;
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCount = pendingRequests.length;
  const storeAcks = requests
    .filter((r) => r.status !== "pending")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    if (activeTab === "requests" && pendingCount > seenReqCount) {
      setSeenReqCount(pendingCount);
      localStorage.setItem(`seenReq_${storeName}`, pendingCount);
    }
  }, [pendingCount, activeTab, storeName, seenReqCount]);

  useEffect(() => {
    if (activeTab === "acks" && storeAcks.length > seenAckCount) {
      setSeenAckCount(storeAcks.length);
      localStorage.setItem(`seenAck_${storeName}`, storeAcks.length);
    }
  }, [storeAcks.length, activeTab, storeName, seenAckCount]);

  const reqBadgeCount = activeTab === "requests" ? 0 : Math.max(0, pendingCount - seenReqCount);
  const ackBadgeCount = activeTab === "acks" ? 0 : Math.max(0, storeAcks.length - seenAckCount);

  const NAV_ITEMS = [
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "requests", label: "Pending Requests", icon: FileText, badge: reqBadgeCount },
    { id: "acks", label: "Acknowledgements", icon: CheckCircle, badge: ackBadgeCount },
  ];

  const inputCls = (err) =>
    `w-full bg-white border rounded-xl px-3 py-2.5 text-sm text-[#1E1B4B] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${err
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-pink-400 focus:ring-pink-100"
    }`;
  const errMsg = (msg) =>
    msg ? <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><span>⚠</span> {msg}</p> : null;

  const requestIsComplete =
    !!modalForm.sku && Number(modalForm.quantity) >= 1 && modalForm.reason.trim().length > 0;
  const invIsComplete =
    invForm.sku.trim() && invForm.name.trim() && invForm.stock !== "" && invForm.threshold !== "";

  const stockLevelGetter = (params) => {
    const { data } = params;
    if (!data || !data.threshold || data.threshold === 0) return "Unknown";
    if (data.stock < data.threshold) return "Low";
    if (data.stock > data.threshold * 2) return "High";
    return "OK";
  };

  // Breakpoints
  const isMobile = winW < 480;
  const isSmall = winW < 640;
  const isTablet = winW < 1024;

  // ── AG Grid: Inventory columns ──────────────────────────────────────────────
  // Mobile: sku(80)+name(110)+category(90)+stock(120)+status(75)+actions(75) = 550
  const invColDefs = useMemo(() => [
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
      width: isMobile ? 120 : isTablet ? 160 : 180,
      filter: false,
      cellRenderer: ({ data }) => {
        const isLow = data.stock < data.threshold;
        const isHigh = data.stock > data.threshold * 2;
        const pct = (data.stock / data.threshold) * 50;
        return <StockBar stock={data.stock} threshold={data.threshold} pct={pct} isLow={isLow} isHigh={isHigh} />;
      },
    },
    {
      headerName: "Status",
      width: isMobile ? 75 : isTablet ? 85 : 95,
      valueGetter: stockLevelGetter,
      filter: "agSetColumnFilter",
      filterParams: { values: ["Low", "OK", "High", "Unknown"] },
      cellRenderer: ({ value }) => {
        const map = {
          Low: "bg-red-50 text-red-600 border-red-100",
          High: "bg-emerald-50 text-emerald-700 border-emerald-100",
          OK: "bg-slate-50 text-slate-600 border-slate-100",
        };
        return (
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold border ${map[value] || ""}`}>
            {value}
          </span>
        );
      },
    },
    {
      headerName: "Actions",
      width: isMobile ? 75 : isTablet ? 100 : 295,
      minWidth: isMobile ? 75 : isTablet ? 100 : 270,
      sortable: false,
      filter: false,
      suppressSizeToFit: true,
      cellRenderer: ({ data }) =>
        isMobile || isTablet ? (
          <div className="flex items-center gap-0.5 h-full">
            <button
              onClick={() => { setInvModalMode("edit"); setEditingItem(data); setInvForm(data); setInvErrors({}); setShowInvModal(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteInv(data.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 h-full w-full">
            <button onClick={() => openModal("pullback", data.sku)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold transition-all border border-slate-200 hover:border-rose-200 whitespace-nowrap">
              <FileDown className="w-3.5 h-3.5" /> Pull-Back
            </button>
            <button onClick={() => openModal("replenishment", data.sku)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold transition-all border border-slate-200 hover:border-emerald-200 whitespace-nowrap">
              <CopyPlus className="w-3.5 h-3.5" /> Replenish
            </button>
            <button onClick={() => { setInvModalMode("edit"); setEditingItem(data); setInvForm(data); setInvErrors({}); setShowInvModal(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-pink-50 transition-all">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDeleteInv(data.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [winW]);

  // ── AG Grid: Requests columns ───────────────────────────────────────────────
  // Mobile: type(75)+product(120)+sku(80)+qty(58)+reason(130)+date(95) = 558
  const reqColDefs = useMemo(() => [
    {
      field: "type", headerName: "Type",
      width: isMobile ? 75 : isTablet ? 100 : 115,
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
      field: "productName", headerName: "Product",
      width: isMobile ? 120 : undefined,
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 120,
      cellClass: "font-semibold text-[#1E1B4B] text-xs",
    },
    {
      field: "sku", headerName: "SKU",
      width: isMobile ? 80 : 90,
      cellClass: "font-mono text-xs text-slate-400",
    },
    {
      field: "quantity", headerName: "Qt",
      width: isMobile ? 58 : 70,
      filter: "agNumberColumnFilter",
      filterParams: { filterOptions: ["equals"], maxNumConditions: 1 },
    },
    {
      field: "reason", headerName: "Reason",
      width: isMobile ? 130 : undefined,
      flex: isMobile ? undefined : 1,
      hide: isTablet,
      cellClass: "text-slate-500 text-xs",
    },
    {
      field: "createdAt", headerName: "Date",
      width: isMobile ? 95 : 110,
      sort: "desc",
      valueFormatter: ({ value }) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: isMobile ? undefined : "numeric" }) : "—",
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [winW]);

  // ── AG Grid: Acks columns ───────────────────────────────────────────────────
  // Mobile: status(95)+type(75)+product(120)+sku(80)+qty(58)+date(95) = 523
  const ackColDefs = useMemo(() => [
    {
      field: "status", headerName: "Status",
      width: isMobile ? 95 : isTablet ? 115 : 135,
      cellRenderer: ({ value }) => {
        const map = { approved: "bg-emerald-50 text-emerald-700 border-emerald-100", rejected: "bg-red-50 text-red-600 border-red-100" };
        return <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold border capitalize ${map[value] || "bg-slate-50 text-slate-500 border-slate-100"}`}>{value}</span>;
      },
    },
    {
      field: "type", headerName: "Type",
      width: isMobile ? 75 : isTablet ? 110 : 125,
      cellRenderer: ({ value }) => {
        const isPull = value === "pullback";
        return <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold border ${isPull ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>{isPull ? (isMobile ? "Pull" : "Pull-Back") : (isMobile ? "Repl" : "Replenish")}</span>;
      },
    },
    {
      field: "productName", headerName: "Product",
      width: isMobile ? 120 : undefined,
      flex: isMobile ? undefined : 1,
      minWidth: isMobile ? 120 : 120,
      cellClass: "font-semibold text-[#1E1B4B] text-xs",
    },
    {
      field: "sku", headerName: "SKU",
      width: isMobile ? 80 : 90,
      cellClass: "font-mono text-xs text-slate-400",
    },
    {
      field: "quantity", headerName: "Qty",
      width: isMobile ? 58 : 70,
      filter: "agNumberColumnFilter",
      filterParams: { filterOptions: ["equals"], maxNumConditions: 1 },
    },
    {
      field: "feedback", headerName: "Feedback",
      width: isMobile ? 130 : undefined,
      flex: isMobile ? undefined : 1,
      hide: isTablet,
      cellClass: "text-slate-500 text-xs italic",
    },
    {
      field: "createdAt", headerName: "Date",
      width: isMobile ? 95 : 110,
      sort: "desc",
      valueFormatter: ({ value }) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: isMobile ? undefined : "numeric" }) : "—",
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [winW]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: false,
    suppressMovable: true,
    cellStyle: { display: "flex", alignItems: "center" },
    minWidth: 50,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    filterParams: { filterOptions: ["contains"], maxNumConditions: 1, debounceMs: 200 },
  }), []);

  /*
   * GRID RENDERING STRATEGY
   * ─────────────────────────────────────────────────────────────────────────
   * Mobile (<640px):
   *   • domLayout="autoHeight" → grid expands to show ALL rows (no internal scroll)
   *   • Outer wrapper: overflow-x-auto with a computed minWidth so ALL columns
   *     are accessible via horizontal finger-scroll — nothing is hidden or clipped.
   *   • The page itself scrolls vertically.
   *
   * Desktop (≥640px):
   *   • domLayout="normal" with explicit pixel height → grid handles its own scroll
   */
  const gridDomLayout = isSmall ? "autoHeight" : "normal";

  // Compute total pixel width of all visible columns for each grid
  // so the horizontal scroll container knows how wide to be.
  // sku(80)+name(110)+category(90)+stock(120)+status(75)+actions(75) = 550
  const INV_MOBILE_WIDTH = 550;
  // type(75)+product(120)+sku(80)+qty(58)+reason(130)+date(95) = 558
  const REQ_MOBILE_WIDTH = 558;
  // status(95)+type(75)+product(120)+sku(80)+qty(58)+date(95) = 523
  const ACK_MOBILE_WIDTH = 523;

  /*
   * GridWrapper
   * Mobile  : horizontal-scrollable shell + autoHeight grid inside a fixed-width div
   * Desktop : fixed-height box, grid scrolls internally
   */
  const GridWrapper = ({ children, desktopHeight = 440, mobileWidth = 520 }) =>
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

        <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">Current Location</p>
          <div className="relative">
            <select value={storeName} onChange={(e) => onSwitchStore(e.target.value)}
              className="w-full appearance-none bg-white/10 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-pink-400/50 pr-8 cursor-pointer">
              {[...stores].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).map((s) => <option key={s} value={s} className="bg-[#1E1B4B]">{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${active ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-white/40"}`} />
                <span className="font-semibold">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-black bg-pink-500 text-white ring-2 ring-[#1E1B4B]">{item.badge}</span>
                )}
              </button>
            );
          })}
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
        <header className="lg:hidden h-14 border-b border-pink-100 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
              <span className="font-black text-white text-xs">Z</span>
            </div>
            <span className="font-black text-sm text-[#1E1B4B]">ZUDIO <span className="text-pink-500">RMS</span></span>
          </div>
          <span className="text-xs font-semibold text-slate-400 truncate max-w-[100px] mx-2">{storeName}</span>
          <button onClick={() => setMobileNavOpen(true)} className="flex-shrink-0 p-2 text-slate-400 hover:text-[#1E1B4B]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile bottom tab bar */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-stretch shadow-lg">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors min-w-0 ${active ? "text-pink-500" : "text-slate-400"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[9px] font-semibold leading-tight w-full text-center px-0.5 truncate">
                  {item.id === "inventory" ? "Inventory" : item.id === "requests" ? "Requests" : "Acks"}
                </span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 translate-x-2 text-[9px] min-w-[16px] h-4 px-1 rounded-full font-black bg-pink-500 text-white flex items-center justify-center">{item.badge}</span>
                )}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-pink-500 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* Scroll hint for mobile — shows briefly when a grid tab is active */}
        {isSmall && !loading && (
          <div className="flex items-center justify-center gap-1.5 py-1 bg-pink-50 border-b border-pink-100">
            <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h4" />
            </svg>
            <span className="text-[10px] font-semibold text-pink-400 tracking-wide">Scroll table left / right to see all columns</span>
            <svg className="w-3 h-3 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        <div className="w-full p-3 sm:p-5 lg:p-7 flex flex-col gap-3 sm:gap-5 pb-24 sm:pb-5 lg:flex-1 lg:overflow-y-auto">

          {/* Page header */}
          <div className="flex items-end justify-between gap-2 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight text-[#1E1B4B] mb-0.5">Store Control</h2>
              <p className="text-slate-400 font-medium text-xs sm:text-sm truncate">
                Managing <span className="text-pink-500 font-bold">{storeName}</span>
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading data...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-3 sm:gap-4">

              {/* ── INVENTORY TAB ── */}
              {activeTab === "inventory" && (
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <MetricCard title="SKUs" value={inventory.length} icon={Package} />
                    <MetricCard title="Low Stock" value={lowCount} valueClass={lowCount > 0 ? "text-amber-500" : "text-[#1E1B4B]"} />
                    <MetricCard title="Awaiting" value={pendingCount} valueClass="text-pink-500" />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
                    <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 bg-gradient-to-r from-pink-50/50 to-transparent border-b border-slate-100 flex-shrink-0">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-[#1E1B4B] truncate">Local Inventory</h3>
                        <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Filter by <span className="font-semibold text-slate-500">Status</span> column</p>
                      </div>
                      <button
                        onClick={() => { setInvModalMode("add"); setInvForm({ sku: "", name: "", category: "Tops", stock: "", threshold: "" }); setInvErrors({}); setShowInvModal(true); }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-sm shadow-pink-200 whitespace-nowrap">
                        <Plus className="w-3.5 h-3.5" /> <span>Add{!isMobile && " Product"}</span>
                      </button>
                    </div>

                    {inventory.length === 0 ? (
                      <div className="py-16 sm:py-20 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center">
                          <Search className="w-6 h-6 text-pink-300" />
                        </div>
                        <p className="font-bold text-slate-500 text-sm">No inventory data</p>
                        <p className="text-xs sm:text-sm">Click "Add Product" to create entries.</p>
                      </div>
                    ) : (
                      <GridWrapper desktopHeight={440} mobileWidth={INV_MOBILE_WIDTH}>
                        <div className="ag-theme-quartz w-full h-full">
                          <AgGridReact
                            rowData={inventory}
                            columnDefs={invColDefs}
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

              {/* ── REQUESTS TAB ── */}
              {activeTab === "requests" && (
                <div className="rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-transparent border-b border-slate-100 flex-shrink-0">
                    <h3 className="text-sm sm:text-lg font-black text-[#1E1B4B] tracking-tight truncate mr-2">Pending Approval</h3>
                    <span className="flex-shrink-0 text-xs text-slate-500 bg-white border border-slate-200 px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">{pendingCount} pending</span>
                  </div>
                  {pendingCount === 0 ? (
                    <div className="py-12 sm:py-16 text-center text-slate-400 text-sm">All caught up. No pending requests.</div>
                  ) : (
                    <GridWrapper desktopHeight={440} mobileWidth={REQ_MOBILE_WIDTH}>
                      <div className="ag-theme-quartz w-full h-full">
                        <AgGridReact
                          rowData={pendingRequests}
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
              )}

              {/* ── ACKS TAB ── */}
              {activeTab === "acks" && (
                <div className="rounded-2xl border border-slate-200 bg-white flex flex-col shadow-sm overflow-hidden">
                  <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-transparent border-b border-slate-100 flex-shrink-0">
                    <div className="min-w-0 mr-2">
                      <h3 className="text-sm sm:text-lg font-black text-[#1E1B4B] tracking-tight truncate">Processed Responses</h3>
                      <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Newest first</p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-500 bg-white border border-slate-200 px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap">{storeAcks.length} total</span>
                  </div>
                  {storeAcks.length === 0 ? (
                    <div className="py-12 sm:py-16 text-center text-slate-400 text-sm">No acknowledgements received yet.</div>
                  ) : (
                    <GridWrapper desktopHeight={440} mobileWidth={ACK_MOBILE_WIDTH}>
                      <div className="ag-theme-quartz w-full h-full">
                        <AgGridReact
                          rowData={storeAcks}
                          columnDefs={ackColDefs}
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
            </div>
          )}
        </div>
      </main>

      {/* ── STOCK REQUEST MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E1B4B]/30 backdrop-blur-md" onClick={() => { if (!submitting) setShowModal(false); }} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {modalMode === "pullback" ? <FileDown className="w-4 h-4 text-slate-600" /> : <CopyPlus className="w-4 h-4 text-slate-600" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#1E1B4B] truncate">Raise {modalMode === "pullback" ? "Pull-Back" : "Replenishment"}</h3>
                  <p className="text-xs text-slate-400">Submit a stock request</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} disabled={submitting} className="flex-shrink-0 ml-2 p-1.5 rounded-lg text-slate-400 hover:text-[#1E1B4B] hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={modalForm.sku} onChange={(e) => { setModalForm({ ...modalForm, sku: e.target.value }); setModalErrors((p) => ({ ...p, sku: "" })); }}
                    className={inputCls(modalErrors.sku) + " pr-8 appearance-none cursor-pointer"}>
                    <option value="">Select a product from inventory</option>
                    {inventory.map((i) => <option key={i.sku} value={i.sku}>{i.name} ({i.sku})</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errMsg(modalErrors.sku)}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                <input type="number" min="1" value={modalForm.quantity} onChange={(e) => { setModalForm({ ...modalForm, quantity: e.target.value }); setModalErrors((p) => ({ ...p, quantity: "" })); }} className={inputCls(modalErrors.quantity)} />
                {errMsg(modalErrors.quantity)}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason <span className="text-red-400">*</span></label>
                <textarea rows={3} value={modalForm.reason} onChange={(e) => { setModalForm({ ...modalForm, reason: e.target.value }); setModalErrors((p) => ({ ...p, reason: "" })); }} placeholder="Briefly explain the necessity..." className={inputCls(modalErrors.reason) + " resize-none"} />
                {errMsg(modalErrors.reason)}
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setShowModal(false)} disabled={submitting} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1E1B4B] hover:bg-white font-semibold text-sm transition-all disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateRequest} disabled={!requestIsComplete || submitting}
                className="flex-1 h-11 rounded-xl bg-[#1E1B4B] hover:bg-[#2d2a6e] text-white font-black text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : "Submit Request"}
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
                <h3 className="text-sm sm:text-base font-black text-[#1E1B4B] truncate">{invModalMode === "add" ? "Add to Local Inventory" : "Edit Inventory Item"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invModalMode === "add" ? "Create a new product entry" : "Update product details"}</p>
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
              <div className="grid grid-cols-2 gap-3">
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
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowInvModal(false)} className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-500 hover:text-[#1E1B4B] hover:bg-slate-50 font-semibold text-sm transition-all">Cancel</button>
              <button onClick={handleSaveInv} disabled={!invIsComplete} className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-sm transition-all shadow-md shadow-pink-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <Save className="w-4 h-4" /> Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}