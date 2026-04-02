
export function StockBar({ stock, threshold, pct, isLow, isHigh }) {
  const barColor = isLow ? "bg-red-400" : isHigh ? "bg-amber-400" : "bg-emerald-400";
  const trackColor = isLow ? "bg-red-100" : isHigh ? "bg-amber-100" : "bg-emerald-100";
  const textColor = isLow ? "text-red-500" : isHigh ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 min-w-[90px] sm:min-w-[110px]">
      <span className={`font-bold text-xs sm:text-sm tabular-nums ${textColor}`}>
        {stock}{" "}
        <span className="text-slate-400 font-normal text-[10px] sm:text-xs">/ {threshold}</span>
      </span>
      <div className={`w-full h-1 sm:h-1.5 rounded-full overflow-hidden ${trackColor}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
        />
      </div>
    </div>
  );
}