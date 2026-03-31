import { CopyPlus, FileDown, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";


 
export function RequestCard({ req, role = "store", onApprove, onReject }) {
  const isPending = req.status === "pending";
 
  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 h-full">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${
        req.type === "pullback"
          ? "bg-gradient-to-r from-red-400 to-rose-300"
          : "bg-gradient-to-r from-emerald-400 to-teal-300"
      }`} />
 
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={req.type} type="reqType" />
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{req.id}</span>
          </div>
          <StatusBadge status={req.status} type="request" />
        </div>
 
        {/* Product */}
        <div className="flex flex-col gap-1">
          <p className="font-bold text-[#1E1B4B] text-sm">{req.productName}</p>
          {role === "merchandiser" && (
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full w-fit">
              {req.store}
            </span>
          )}
        </div>
 
        {/* Reason */}
        <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 leading-relaxed flex-1">
          "{req.reason}"
        </p>
 
        {/* Quantity + Date */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${
            req.type === "pullback" ? "text-rose-500" : "text-teal-600"
          }`}>
            {req.type === "pullback"
              ? <FileDown className="w-3.5 h-3.5" />
              : <CopyPlus className="w-3.5 h-3.5" />
            }
            <span>{req.quantity} units</span>
          </div>
          <p className="text-[10px] text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
        </div>
 
        {/* Merchandiser Actions */}
        {role === "merchandiser" && isPending && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-sm shadow-emerald-500/20"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
 







