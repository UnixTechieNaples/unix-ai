export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-sm font-bold tracking-wider text-cyan-300 mb-2">[CARICAMENTO STUDIO IN CORSO]</h2>
        <p className="text-xs text-slate-400">Inizializzazione dei nodi neurali e sincronizzazione dei flussi di dati...</p>
      </div>
    </div>
  );
}