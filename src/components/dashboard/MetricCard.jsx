export function MetricCard({ title, value, subtitle, icon: Icon, valueClass = "", accent = "pink" }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3.5 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-300" />}
      </div>
      <div className={`text-2xl font-black tracking-tight leading-none ${valueClass || "text-[#1E1B4B]"}`}>
        {value}
      </div>
      {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}