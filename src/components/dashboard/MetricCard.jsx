export function MetricCard({ title, value, subtitle, icon: Icon, valueClass = "" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {Icon && (
        <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-50 border border-slate-100 items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</span>
        <div className={`text-lg sm:text-xl font-black tracking-tight leading-none ${valueClass || "text-[#1E1B4B]"}`}>
          {value}
        </div>
        {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

