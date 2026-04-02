



export function MetricCard({ title, value, subtitle, icon: Icon, valueClass = "" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 min-w-0">
      {Icon && (
        <div className="hidden md:flex w-9 h-9 rounded-full bg-slate-50 border border-slate-100 items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{title}</span>
        <div className={`text-base sm:text-lg md:text-xl font-black tracking-tight leading-none truncate ${valueClass || "text-[#1E1B4B]"}`}>
          {value}
        </div>
        {subtitle && <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}