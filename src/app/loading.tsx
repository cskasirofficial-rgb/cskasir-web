export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-xl animate-bounce shadow-lg shadow-blue-500/30">
          CS
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase animate-pulse">
          Memuat CSKasir...
        </p>
      </div>
    </div>
  );
}