
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import StoreDashboard from "./pages/StoreDashboard";
import MerchandiserDashboard from "./pages/MerchandiserDashboard";
import AuthPage from "./pages/AuthPage";
import { fetchStores } from "./API/domoAPI";
import { Loader2, Store, Factory, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export default function App() {
  const { isSignedIn, isLoaded } = useUser();
  const [role, setRole] = useState(null);
  const [pendingRole, setPendingRole] = useState(null); // role clicked but not yet auth'd
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

  // When Clerk finishes loading and user IS signed in, promote pendingRole → role
  useEffect(() => {
    if (isLoaded && isSignedIn && pendingRole) {
      setRole(pendingRole);
      setPendingRole(null);
    }
  }, [isLoaded, isSignedIn, pendingRole]);

  const handleRoleClick = (chosen) => {
    if (isSignedIn) {
      // Already authenticated — go straight to dashboard
      setRole(chosen);
    } else {
      // Not signed in — show Clerk auth page first
      setPendingRole(chosen);
    }
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

  /* ── Show Clerk Auth if a role was clicked but not signed in ── */
  if (pendingRole) {
    return (
      <AuthPage
        role={pendingRole}
        onBack={() => setPendingRole(null)}
      />
    );
  }

  /* ── Role Selector ── */
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EEFF] relative overflow-hidden px-4 py-8 scrollbar-hide">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 via-violet-400 to-indigo-500" />
        <div className="absolute top-[-15%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none" />
        {/* grid texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(#1E1B4B 1px,transparent 1px),linear-gradient(90deg,#1E1B4B 1px,transparent 1px)", backgroundSize: "40px 40px" }}
        />

        {/* Logo + Title */}
        <div className="z-10 flex flex-col items-center mb-6 sm:mb-10 w-full px-4 text-center">
          <div className="relative mb-4 sm:mb-5">
            <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#3730A3] flex items-center justify-center shadow-2xl shadow-indigo-900/25">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter">Z</span>
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/40">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#1E1B4B] mb-1 text-center">
            ZUDIO <span className="text-pink-500">RMS</span>
          </h1>
          <p className="text-indigo-400 font-semibold tracking-widest text-[10px] sm:text-xs uppercase mb-4 sm:mb-5">
            Retail Management System
          </p>

          {stores.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Connected — {stores.length} {stores.length === 1 ? "Store" : "Stores"} Active
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className="z-10 flex flex-col gap-4 w-full sm:flex-row max-w-sm sm:max-w-2xl px-4 sm:px-0">
          {/* Store Manager */}
          <button
            onClick={() => handleRoleClick("store")}
            className="group flex-1 relative overflow-hidden rounded-2xl bg-white border border-pink-100 shadow-lg shadow-pink-100/60 hover:shadow-xl hover:shadow-pink-200/60 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 p-5 sm:p-7 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -top-6 -right-6 w-20 sm:w-24 h-20 sm:h-24 bg-pink-50 rounded-full group-hover:bg-pink-100 transition-colors duration-300" />

            <div className="relative flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-pink-50 border border-pink-100 group-hover:bg-pink-100 group-hover:border-pink-200 flex items-center justify-center transition-all duration-300 shadow-sm">
                <Store className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h3 className="text-base sm:text-lg font-black text-[#1E1B4B] mb-0.5 sm:mb-1">Store Manager</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  View local inventory, raise stock requests & track status.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-pink-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                Enter Dashboard →
              </div>
            </div>
          </button>

          {/* Merchandiser */}
          <button
            onClick={() => handleRoleClick("merchandiser")}
            className="group flex-1 relative overflow-hidden rounded-2xl bg-white border border-violet-100 shadow-lg shadow-violet-100/60 hover:shadow-xl hover:shadow-violet-200/60 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 p-5 sm:p-7 text-left"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -top-6 -right-6 w-20 sm:w-24 h-20 sm:h-24 bg-violet-50 rounded-full group-hover:bg-violet-100 transition-colors duration-300" />

            <div className="relative flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-violet-50 border border-violet-100 group-hover:bg-violet-100 group-hover:border-violet-200 flex items-center justify-center transition-all duration-300 shadow-sm">
                <Factory className="w-6 h-6 sm:w-7 sm:h-7 text-violet-500" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h3 className="text-base sm:text-lg font-black text-[#1E1B4B] mb-0.5 sm:mb-1">Merchandiser</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Manage global inventory & review pending store requests.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-violet-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                Enter Dashboard →
              </div>
            </div>
          </button>
        </div>

        {/* Store selector (if Store role chosen) */}
        {stores.length > 1 && (
          <div className="z-10 mt-5 w-full max-w-lg sm:max-w-2xl">
            <p className="text-center text-xs text-indigo-300 font-semibold uppercase tracking-widest mb-2">
              Tap a card to enter your dashboard
            </p>
          </div>
        )}

        <p className="z-10 mt-4 sm:mt-6 text-indigo-300 text-[10px] sm:text-xs tracking-widest uppercase font-semibold text-center">
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