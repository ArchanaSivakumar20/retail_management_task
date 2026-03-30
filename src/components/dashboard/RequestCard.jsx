import { CopyPlus, FileDown, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";


 
export function RequestCard({ req, role = "store", onApprove, onReject }) {
  const isPending = req.status === "pending";
 
  return (
    <div className="flex flex-col bg-[#131929] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-200 h-full">
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${
        req.type === "pullback"
          ? "bg-gradient-to-r from-rose-500/70 to-transparent"
          : "bg-gradient-to-r from-teal-500/70 to-transparent"
      }`} />
 
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={req.type} type="reqType" />
            <span className="text-[10px] font-mono text-slate-600 bg-white/4 px-2 py-0.5 rounded-full">{req.id}</span>
          </div>
          <StatusBadge status={req.status} type="request" />
        </div>
 
        {/* Product */}
        <div className="flex flex-col gap-1">
          <p className="font-bold text-white text-sm">{req.productName}</p>
          {role === "merchandiser" && (
            <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full w-fit">
              {req.store}
            </span>
          )}
        </div>
 
        {/* Reason */}
        <p className="text-xs text-slate-500 italic bg-white/3 border border-white/6 rounded-xl px-3 py-2.5 leading-relaxed flex-1">
          "{req.reason}"
        </p>
 
        {/* Quantity + Date */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${
            req.type === "pullback" ? "text-rose-400" : "text-teal-400"
          }`}>
            {req.type === "pullback"
              ? <FileDown className="w-3.5 h-3.5" />
              : <CopyPlus className="w-3.5 h-3.5" />
            }
            <span>{req.quantity} units</span>
          </div>
          <p className="text-[10px] text-slate-600">{new Date(req.createdAt).toLocaleDateString()}</p>
        </div>
 
        {/* Merchandiser Actions */}
        {role === "merchandiser" && isPending && (
          <div className="flex gap-2 pt-3 border-t border-white/6">
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0F1A] text-xs font-black transition-all shadow-md shadow-emerald-500/20"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
 