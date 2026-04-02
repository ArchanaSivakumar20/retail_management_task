








import { CopyPlus, FileDown, CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export function RequestCard({ req, role = "store", onApprove, onReject }) {
  const isPending = req.status === "pending";

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 h-full">
      {/* Top accent bar */}
      <div className={`h-1 w-full flex-shrink-0 ${req.type === "pullback"
          ? "bg-gradient-to-r from-red-400 to-rose-300"
          : "bg-gradient-to-r from-emerald-400 to-teal-300"
        }`} />

      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-1 gap-2 sm:gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <StatusBadge status={req.type} type="reqType" />
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-[100px] sm:max-w-none">
              {req.id}
            </span>
          </div>
          <StatusBadge status={req.status} type="request" />
        </div>

        {/* Product */}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-bold text-[#1E1B4B] text-xs sm:text-sm truncate">{req.productName}</p>
          {role === "merchandiser" && (
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-1.5 sm:px-2 py-0.5 rounded-full w-fit truncate max-w-full">
              {req.store}
            </span>
          )}
        </div>

        {/* Reason */}
        <p className="text-[11px] sm:text-xs text-slate-500 italic bg-slate-50 border border-slate-100 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none">
          "{req.reason}"
        </p>

        {/* Quantity + Date */}
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold flex-shrink-0 ${req.type === "pullback" ? "text-rose-500" : "text-teal-600"
            }`}>
            {req.type === "pullback"
              ? <FileDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              : <CopyPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            }
            <span>{req.quantity} units</span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 flex-shrink-0">
            {new Date(req.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Merchandiser Actions */}
        {role === "merchandiser" && isPending && (
          <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-slate-100">
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 h-7 sm:h-8 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[10px] sm:text-xs font-bold transition-all"
            >
              <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 h-7 sm:h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs font-black transition-all shadow-sm shadow-emerald-500/20"
            >
              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span>Approve</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}