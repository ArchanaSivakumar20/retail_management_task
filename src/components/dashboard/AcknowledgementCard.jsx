import { CheckCircle2, XOctagon, FileDown, CopyPlus, PackageCheck, PackageX } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export function AcknowledgementCard({ ack }) {
  const isApproved = ack.status === "approved";
  const isRejected = ack.status === "rejected";

  return (
    <div className={`flex flex-col bg-white rounded-2xl overflow-hidden border shadow-sm transition-all hover:shadow-md ${
      isApproved ? "border-emerald-200 shadow-emerald-50"
      : isRejected ? "border-red-200 shadow-red-50"
      : "border-slate-100"
    }`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${
        isApproved ? "bg-gradient-to-r from-emerald-400 to-teal-300"
        : isRejected ? "bg-gradient-to-r from-red-400 to-rose-300"
        : "bg-slate-200"
      }`} />

      <div className="p-5 flex flex-col gap-4">
        {/* Row 1: type badge + big status pill */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={ack.type} type="reqType" />
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">{ack.id}</span>
          </div>
          {/* Big visible APPROVED/REJECTED pill */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
            isApproved
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : isRejected
              ? "bg-red-50 text-red-500 border-red-200"
              : "bg-slate-50 text-slate-500 border-slate-200"
          }`}>
            {isApproved
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Approved</>
              : isRejected
              ? <><XOctagon className="w-3.5 h-3.5" /> Rejected</>
              : ack.status
            }
          </span>
        </div>

        {/* Row 2: product info */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex flex-col gap-2">
          <p className="font-bold text-[#1E1B4B] text-sm">{ack.productName}</p>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${
            ack.type === "pullback" ? "text-rose-500" : "text-teal-600"
          }`}>
            {ack.type === "pullback" ? <FileDown className="w-3.5 h-3.5" /> : <CopyPlus className="w-3.5 h-3.5" />}
            <span>
              {ack.quantity} unit{ack.quantity > 1 ? "s" : ""}{" "}
              {ack.type === "pullback" ? "requested for pull-back" : "requested for replenishment"}
            </span>
          </div>
        </div>

        {/* Row 3: stock impact banner */}
        {isApproved ? (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <PackageCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Stock Updated ✓</p>
              <p className="text-xs text-emerald-700/80 leading-relaxed">
                {ack.type === "pullback"
                  ? `${ack.quantity} unit${ack.quantity > 1 ? "s" : ""} have been pulled back — stock reduced.`
                  : `${ack.quantity} unit${ack.quantity > 1 ? "s" : ""} have been added to your store inventory.`
                }
              </p>
            </div>
          </div>
        ) : isRejected ? (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <PackageX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-1">No Stock Change</p>
              <p className="text-xs text-red-600/80 leading-relaxed">
                Your request was rejected. Stock levels remain unchanged.
              </p>
            </div>
          </div>
        ) : null}

        {/* Row 4: merchandiser feedback */}
        {ack.feedback && (
          <div className={`rounded-xl px-4 py-3 border ${
            isApproved ? "bg-slate-50 border-slate-200" : "bg-red-50 border-red-200"
          }`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${
              isApproved ? "text-slate-500" : "text-red-500"
            }`}>
              Merchandiser Feedback
            </p>
            <p className={`text-xs leading-relaxed italic ${
              isApproved ? "text-slate-500" : "text-red-600"
            }`}>
              "{ack.feedback}"
            </p>
          </div>
        )}

        {/* Row 5: timestamp */}
        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          Processed: {new Date(ack.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
