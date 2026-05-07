/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { 
  Camera, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  Zap,
  History,
  LayoutDashboard,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeRideScreenshot } from "./services/geminiService";
import { RideAnalysis, AnalysisVerdict } from "./types";

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RideAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RideAnalysis[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico ao abrir o app
  useEffect(() => {
    const saved = localStorage.getItem("ride_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Salvar no histórico
  const addToHistory = (analysis: RideAnalysis) => {
    const newHistory = [analysis, ...history].slice(0, 50); // Mantém as últimas 50
    setHistory(newHistory);
    localStorage.setItem("ride_history", JSON.stringify(newHistory));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setResult(null);
      setError(null);
      
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeRideScreenshot(base64, file.type);
        setResult(analysis);
        addToHistory(analysis); // Salva automaticamente no histórico
      } catch (err) {
        console.error(err);
        setError("Erro na análise. Tente novamente.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Cálculos das estatísticas reais
  const stats = {
    totalValue: history.reduce((acc, curr) => acc + curr.value, 0),
    totalMiles: history.reduce((acc, curr) => acc + curr.distance, 0),
    efficiency: history.length > 0 
      ? history.reduce((acc, curr) => acc + curr.value, 0) / history.reduce((acc, curr) => acc + curr.distance, 0)
      : 0
  };

  const getVerdictDetails = (verdict: AnalysisVerdict) => {
    switch (verdict) {
      case AnalysisVerdict.GOOD:
        return {
          icon: <CheckCircle2 className="text-status-good h-8 w-8" />,
          label: "BOA CORRIDA",
          color: "text-status-good",
          bgColor: "bg-status-good/10",
          borderColor: "border-status-good/30",
          glow: "glow-green",
        };
      case AnalysisVerdict.AVERAGE:
        return {
          icon: <AlertTriangle className="text-status-average h-8 w-8" />,
          label: "MÉDIA CORRIDA",
          color: "text-status-average",
          bgColor: "bg-status-average/10",
          borderColor: "border-status-average/30",
          glow: "glow-yellow",
        };
      case AnalysisVerdict.POOR:
        return {
          icon: <XCircle className="text-status-poor h-8 w-8" />,
          label: "RUIM CORRIDA",
          color: "text-status-poor",
          bgColor: "bg-status-poor/10",
          borderColor: "border-status-poor/30",
          glow: "glow-red",
        };
    }
  };

  const [activeTab, setActiveTab] = useState<'perMile' | 'details'>('perMile');

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  const clearHistory = () => {
    if(confirm("Deseja apagar todo o histórico?")) {
      setHistory([]);
      localStorage.removeItem("ride_history");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col max-w-5xl mx-auto p-4 md:p-8 overflow-x-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
            <Zap className="w-7 h-7 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assistente de Corridas</h1>
            <p className="text-brand-muted text-sm uppercase">IA de Análise em Tempo Real</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!image ? (
              <motion.div 
                key="uploader"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-card border border-brand-border rounded-[2rem] p-8 flex-1 flex flex-col justify-center items-center relative overflow-hidden min-h-[400px]"
              >
                <div className="z-10 text-center flex flex-col items-center">
                  <div className="mb-6 inline-flex p-6 bg-slate-800 rounded-full">
                    <Camera className="w-12 h-12 text-brand-accent" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Analisar Oferta</h2>
                  <p className="text-brand-muted mb-8 max-w-sm">Capture a tela da oferta para validar o lucro.</p>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white text-lg font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-brand-accent/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    ABRIR CÂMERA
                  </button>
                </div>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" // Garante o uso da câmera traseira no celular
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-brand-card border border-brand-border rounded-[2rem] overflow-hidden flex flex-col min-h-[400px]"
              >
                <div className="relative flex-1 bg-black/20">
                  {isAnalyzing && (
                    <div className="absolute inset-0 z-10 bg-brand-bg/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                      <RefreshCw className="h-10 w-10 text-brand-accent animate-spin" />
                      <p className="text-sm font-mono tracking-widest animate-pulse uppercase">Analisando...</p>
                    </div>
                  )}
                  <img src={image} alt="Oferta" className="w-full h-full object-contain max-h-[500px]" />
                  <button 
                    onClick={reset}
                    className="absolute top-4 right-4 p-3 bg-brand-bg/80 rounded-xl hover:bg-brand-bg border border-brand-border"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
              <p className="text-brand-muted text-[10px] font-bold uppercase mb-1">Ganhos</p>
              <p className="text-xl font-bold">${stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
              <p className="text-brand-muted text-[10px] font-bold uppercase mb-1">Distância</p>
              <p className="text-xl font-bold">{stats.totalMiles.toFixed(1)} mi</p>
            </div>
            <div className="bg-brand-card p-5 rounded-2xl border border-brand-border">
              <p className="text-brand-muted text-[10px] font-bold uppercase mb-1">Eficiência Média</p>
              <p className="text-xl font-bold text-status-good">${stats.efficiency.toFixed(2)}/mi</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-brand-card border border-brand-border rounded-[2rem] overflow-hidden">
            <div className="grid grid-cols-2 gap-2 bg-brand-bg/80 p-3">
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'perMile' ? 'bg-brand-accent text-white' : 'text-brand-muted'}`}
                onClick={() => setActiveTab('perMile')}
              >
                Valor / Milha
              </button>
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'details' ? 'bg-brand-accent text-white' : 'text-brand-muted'}`}
                onClick={() => setActiveTab('details')}
              >
                Detalhes
              </button>
            </div>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${getVerdictDetails(result.verdict).bgColor} p-8`}
                >
                  <div className="text-center">
                    <span className={`text-[10px] font-black ${getVerdictDetails(result.verdict).color}`}>{getVerdictDetails(result.verdict).label}</span>
                    <div className={`text-5xl font-black ${getVerdictDetails(result.verdict).color} my-4`}>
                      ${result.perMile.toFixed(2)}<span className="text-xl opacity-60">/mi</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left mt-6">
                      <div className="bg-brand-card/50 p-3 rounded-xl">
                        <p className="text-[10px] text-brand-muted uppercase">Total</p>
                        <p className="text-lg font-bold">${result.value.toFixed(2)}</p>
                      </div>
                      <div className="bg-brand-card/50 p-3 rounded-xl">
                        <p className="text-[10px] text-brand-muted uppercase">Milhas</p>
                        <p className="text-lg font-bold">{result.distance} mi</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center opacity-50 min-h-[200px] flex flex-col items-center justify-center">
                  <LayoutDashboard className="w-12 h-12 mb-2" />
                  <p>Aguardando análise...</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-[2rem] p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-accent" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted">Histórico</h3>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-brand-muted hover:text-status-poor transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="p-6 bg-white/5 rounded-2xl text-brand-muted text-sm text-center">
                  Nenhum registro recente.
                </div>
              ) : (
                history.map((ride, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="font-bold text-sm">${ride.value.toFixed(2)}</p>
                      <p className="text-[10px] text-brand-muted">{ride.distance} mi • {ride.service || 'Entrega'}</p>
                    </div>
                    <div className={`text-xs font-bold ${getVerdictDetails(ride.verdict).color}`}>
                      ${ride.perMile.toFixed(2)}/mi
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}