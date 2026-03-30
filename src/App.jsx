
import { useState, useEffect } from "react";
import StoreDashboard from "./pages/StoreDashboard";
import MerchandiserDashboard from "./pages/MerchandiserDashboard";
import { fetchStores } from "./API/domoAPI";
import { Loader2, Store, Factory, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export default function App() {
  const [role, setRole] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchStores()
      .then((s) => {
        if (!mounted) return;
        setStores(s);
        if (s.length > 0) setSelectedStore(s[0]);
      })
      .catch((e) => { if (!mounted) return; setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const refreshStores = async () => {
    try {
      const s = await fetchStores();
      setStores(s);
      if (s.length > 0 && !s.includes(selectedStore)) setSelectedStore(s[0]);
    } catch (e) { console.error(e); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EEFF] relative overflow-hidden">
        {/* soft blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-300/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[100px]" />

        <div className="z-10 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#3730A3] flex items-center justify-center shadow-2xl shadow-indigo-900/30">
              <span className="text-3xl font-black text-white tracking-tighter">Z</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-[#1E1B4B]">
              ZUDIO <span className="text-pink-500">RMS</span>
            </h1>
            <p className="text-indigo-400 font-semibold text-sm tracking-widest uppercase mt-1">
              Connecting to Domo framework
            </p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-pink-400 mt-2" />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EEFF]">
        <div className="flex flex-col items-center gap-5 max-w-sm px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1E1B4B] mb-2">Connection Failed</h1>
            <p className="text-slate-500 mb-3 font-medium">Unable to reach Domo Database</p>
            <p className="text-sm text-red-400 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-xl bg-[#1E1B4B] hover:bg-[#2d2a6e] text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  /* ── Role Selector ── */
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EEFF] relative overflow-hidden px-4">
        {/* background decorations */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-violet-400 to-indigo-500" />
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />
        {/* grid texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#1E1B4B 1px,transparent 1px),linear-gradient(90deg,#1E1B4B 1px,transparent 1px)", backgroundSize: "48px 48px" }}
        />

        {/* Logo */}
        <div className="z-10 flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#3730A3] flex items-center justify-center shadow-2xl shadow-indigo-900/25">
              <span className="text-3xl font-black text-white tracking-tighter">Z</span>
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/40">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-[#1E1B4B] mb-1">
            ZUDIO <span className="text-pink-500">RMS</span>
          </h1>
          <p className="text-indigo-400 font-semibold tracking-widest text-xs uppercase mb-5">
            Retail Management System
          </p>

          {stores.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Connected — {stores.length} {stores.length === 1 ? "Store" : "Stores"} Active
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className="z-10 flex gap-5 w-full max-w-2xl flex-col sm:flex-row">
          {/* Store Manager */}
          <button
            onClick={() => setRole("store")}
            className="group flex-1 relative overflow-hidden rounded-2xl bg-white border border-pink-100 shadow-lg shadow-pink-100/60 hover:shadow-xl hover:shadow-pink-200/60 hover:-translate-y-1 transition-all duration-300 p-7 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-pink-50 rounded-full group-hover:bg-pink-100 transition-colors duration-300" />

            <div className="relative flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 group-hover:bg-pink-100 group-hover:border-pink-200 flex items-center justify-center transition-all duration-300 shadow-sm">
                <Store className="w-7 h-7 text-pink-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E1B4B] mb-1">Store Manager</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  View local inventory, raise stock requests & track status.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-pink-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Enter Dashboard →
              </div>
            </div>
          </button>

          {/* Merchandiser */}
          <button
            onClick={() => setRole("merchandiser")}
            className="group flex-1 relative overflow-hidden rounded-2xl bg-white border border-violet-100 shadow-lg shadow-violet-100/60 hover:shadow-xl hover:shadow-violet-200/60 hover:-translate-y-1 transition-all duration-300 p-7 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-violet-50 rounded-full group-hover:bg-violet-100 transition-colors duration-300" />

            <div className="relative flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 group-hover:bg-violet-100 group-hover:border-violet-200 flex items-center justify-center transition-all duration-300 shadow-sm">
                <Factory className="w-7 h-7 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#1E1B4B] mb-1">Merchandiser</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Manage global inventory & review pending store requests.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-violet-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Enter Dashboard →
              </div>
            </div>
          </button>
        </div>

        <p className="z-10 mt-8 text-indigo-300 text-xs tracking-widest uppercase font-semibold">
          Select your role to continue
        </p>
      </div>
    );
  }

  if (role === "store") {
    return (
      <StoreDashboard
        storeName={selectedStore}
        stores={stores}
        onBack={() => setRole(null)}
        onSwitchStore={setSelectedStore}
      />
    );
  }

  return (
    <MerchandiserDashboard
      stores={stores}
      refreshStores={refreshStores}
      onBack={() => setRole(null)}
    />
  );
}