import { SignIn } from "@clerk/clerk-react";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AuthPage({ role, onBack }) {
  const isStore = role === "store";
  const accent = isStore
    ? { from: "from-pink-400", to: "to-rose-400", text: "text-pink-500", ring: "ring-pink-200" }
    : { from: "from-violet-400", to: "to-indigo-400", text: "text-violet-500", ring: "ring-violet-200" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EEFF] relative overflow-hidden px-4 py-8 scrollbar-hide">
      {/* Background blobs */}
      <div className={`absolute top-[-15%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[100px] pointer-events-none ${isStore ? "bg-pink-200/30" : "bg-violet-200/30"}`} />
      <div className={`absolute bottom-[-15%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[100px] pointer-events-none ${isStore ? "bg-rose-200/20" : "bg-indigo-200/20"}`} />
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent.from} ${accent.to}`} />

      {/* Header */}
      <div className="z-10 flex flex-col items-center mb-6 w-full max-w-sm">
        {/* Back button */}
        <div className="w-full mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to roles
          </button>
        </div>

        {/* Logo */}
        <div className="relative mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E1B4B] to-[#3730A3] flex items-center justify-center shadow-xl shadow-indigo-900/20`}>
            <span className="text-xl font-black text-white tracking-tighter">Z</span>
          </div>
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-md ${isStore ? "bg-pink-500" : "bg-violet-500"}`}>
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-[#1E1B4B] tracking-tight">
          ZUDIO <span className={accent.text}>RMS</span>
        </h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5 mb-2">
          {isStore ? "Store Manager Portal" : "Merchandiser Portal"}
        </p>
      </div>

      {/* Clerk SignIn component — embedded (not redirected) */}
      <div className="z-10 w-full max-w-sm">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-xl shadow-indigo-900/10 border border-slate-100 rounded-2xl overflow-hidden",
              headerTitle: "font-black text-[#1E1B4B]",
              headerSubtitle: "text-slate-400 text-sm",
              socialButtonsBlockButton: `rounded-xl border border-slate-200 hover:border-slate-300 transition-all font-semibold`,
              formButtonPrimary: `bg-gradient-to-r ${accent.from} ${accent.to} hover:opacity-90 transition-all font-bold rounded-xl`,
              formFieldInput: `rounded-xl border-slate-200 focus:border-${isStore ? "pink" : "violet"}-400 focus:ring-1 focus:ring-${isStore ? "pink" : "violet"}-200`,
              footerActionLink: `${accent.text} font-bold hover:opacity-80`,
              dividerLine: "bg-slate-100",
              dividerText: "text-slate-400 text-xs",
            },
          }}
          routing="hash"
          signUpUrl="#/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
