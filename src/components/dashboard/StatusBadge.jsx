export function StatusBadge({ status, type = "request" }) {
  if (type === "request") {
    const map = {
      approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
      rejected: "bg-red-50 text-red-500 border-red-200",
      pending:  "bg-amber-50 text-amber-600 border-amber-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${map[status] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
        {status}
      </span>
    );
  }
 
  if (type === "stock") {
    const isLow  = status === "low";
    const isHigh = status === "excess";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
        isLow  ? "bg-red-50 text-red-500 border-red-200"
               : isHigh
               ? "bg-amber-50 text-amber-600 border-amber-200"
               : "bg-emerald-50 text-emerald-600 border-emerald-200"
      }`}>
        {isLow ? "Low Stock" : isHigh ? "Excess" : "Optimal"}
      </span>
    );
  }
 
  if (type === "reqType") {
    const isPullback = status === "pullback";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
        isPullback
          ? "bg-rose-50 text-rose-500 border-rose-200"
          : "bg-teal-50 text-teal-600 border-teal-200"
      }`}>
        {status}
      </span>
    );
  }
 
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-400 border-slate-200">
      {status}
    </span>
  );
}
