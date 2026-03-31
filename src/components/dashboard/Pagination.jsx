// import { ChevronLeft, ChevronRight } from "lucide-react";

// export function Pagination({ currentPage, totalPages, onPageChange }) {
//   if (totalPages <= 1) return null;

//   return (
//     <div className="flex items-center justify-between border-t border-slate-200 mt-6 pt-6">
//       <div className="text-sm font-semibold text-slate-500">
//         Showing Page <span className="text-[#1E1B4B] font-black">{currentPage}</span> of <span className="text-[#1E1B4B] font-black">{totalPages}</span>
//       </div>
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//           disabled={currentPage === 1}
//           className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           <ChevronLeft className="w-4 h-4" /> Prev
//         </button>
//         <button
//           onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//           disabled={currentPage >= totalPages}
//           className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           Next <ChevronRight className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }