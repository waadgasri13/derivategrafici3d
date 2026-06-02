import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text, MeshDistortMaterial, Trail, Line } from '@react-three/drei';
import { LineChart as RechartsLineChart, Line as RechartsLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Play, Pause, RefreshCw, Info, ChevronDown, Sliders, Zap, FunctionSquare as Function } from 'lucide-react';
import * as THREE from 'three';

// --- MATH UTILS ---

/**
 * Calcola la posizione s(t) basata su una funzione parametrica.
 * In fisica, s(t) rappresenta la legge oraria del moto.
 * Utilizziamo una funzione sinusoidale combinata con un trend lineare:
 * s(t) = A * sin(ωt + φ) + m*t
 * dove:
 * - A (amplitude): ampiezza dell'oscillazione
 * - ω (frequency): frequenza angolare
 * - φ (phase): sfasamento iniziale
 * - m (slope): velocità media costante (trend)
 */
const calculateSpace = (t, params) => {
  const { amplitude, frequency, phase, slope } = params;
  return amplitude * Math.sin(frequency * t + phase) + slope * t;
};

/**
 * Calcola la derivata prima v(t) = ds/dt.
 * In fisica, la derivata della posizione rispetto al tempo è la VELOCITÀ ISTANTANEA.
 * Applicando le regole di derivazione:
 * D[sin(f(x))] = cos(f(x)) * f'(x)
 * D[m*t] = m
 * Quindi: v(t) = A * ω * cos(ωt + φ) + m
 */
const calculateDerivative = (t, params) => {
  const { amplitude, frequency, phase, slope } = params;
  return amplitude * frequency * Math.cos(frequency * t + phase) + slope;
};

// --- 3D COMPONENTS ---

const Scene3D = ({ ballPosition, trajectory, params }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f2ff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ff00ff" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Assi Cartesiani 3D */}
      <group>
        {/* X Axis - Tempo */}
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[10, 0.05, 0.05]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        <Text position={[10.5, 0, 0]} fontSize={0.5} color="#00f2ff">Tempo (t)</Text>
        
        {/* Y Axis - Spazio */}
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[0.05, 10, 0.05]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        <Text position={[0, 10.5, 0]} fontSize={0.5} color="#ff00ff">Spazio (s)</Text>
        
        {/* Z Axis - Profondità (estetica) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 10]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </group>

      {/* Griglia di riferimento */}
      <gridHelper args={[20, 20, "#222", "#111"]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Traiettoria */}
      <Line
        points={trajectory.map(p => [p.t, p.s, 0])}
        color="#00f2ff"
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {/* Pallina Interattiva */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[ballPosition.t, ballPosition.s, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <MeshDistortMaterial
            color="#00f2ff"
            speed={2}
            distort={0.3}
            radius={1}
            emissive="#00f2ff"
            emissiveIntensity={2}
          />
        </mesh>
      </Float>

      {/* Proiezioni sugli assi */}
      <mesh position={[ballPosition.t, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" />
      </mesh>
      <mesh position={[0, ballPosition.s, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" />
      </mesh>

      <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={5} maxDistance={30} />
    </>
  );
};

// --- MAIN APP ---

export default function App() {
  const [params, setParams] = useState({
    amplitude: 2,
    frequency: 1,
    phase: 0,
    slope: 0.5
  });
  
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [history, setHistory] = useState([]);
  
  // Ref per l'animazione
  const requestRef = useRef();
  
  const updatePhysics = (t) => {
    const s = calculateSpace(t, params);
    const v = calculateDerivative(t, params);
    
    setHistory(prev => {
      const newHistory = [...prev, { t, s, v }];
      if (newHistory.length > 100) return newHistory.slice(1);
      return newHistory;
    });
    
    return { t, s, v };
  };

  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp) => {
        setTime(prev => prev + 0.05);
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  const currentData = useMemo(() => ({
    t: time % 10, // Loop per visualizzazione
    s: calculateSpace(time % 10, params),
    v: calculateDerivative(time % 10, params)
  }), [time, params]);

  // Generazione dati per il grafico 2D
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 10; i += 0.2) {
      data.push({
        t: parseFloat(i.toFixed(1)),
        s: calculateSpace(i, params),
        v: calculateDerivative(i, params)
      });
    }
    return data;
  }, [params]);

  // Calcolo retta tangente nel punto corrente
  const tangentLine = useMemo(() => {
    const { t, s, v } = currentData;
    // y = mx + q => s = v*t + q => q = s - v*t
    const q = s - v * t;
    return [
      { t: t - 1, s: v * (t - 1) + q },
      { t: t + 1, s: v * (t + 1) + q }
    ];
  }, [currentData]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyber-blue/30">
      
      {/* 1. SEZIONE INTRODUTTIVA */}
      <section className="relative h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-blue blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-pink blur-[120px] rounded-full animate-pulse" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10 text-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue text-sm mb-6">
            <Zap size={14} />
            <span className="uppercase tracking-widest font-bold">Laboratorio Virtuale</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white via-cyber-blue to-cyber-pink bg-clip-text text-transparent italic tracking-tighter">
            FLUSSI MUTABILI
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed">
            Esplora l'universo delle <span className="text-cyber-blue font-bold">Derivate</span> attraverso il movimento. 
            Come cambia lo spazio rispetto al tempo? La risposta è nel flusso.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => document.getElementById('sandbox').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-cyber-blue text-black font-black rounded-sm hover:scale-105 transition-transform flex items-center gap-2"
            >
              ESPLORA SANDBOX <ChevronDown size={20} />
            </button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown size={32} className="text-cyber-blue" />
        </div>
      </section>

      {/* 2. SEZIONE INTERATTIVA: 3D SANDBOX */}
      <section id="sandbox" className="relative min-h-screen bg-[#080808] border-y border-white/5 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: 3D Canvas */}
        <div className="flex-1 h-[60vh] lg:h-screen relative">
          <div className="absolute top-10 left-10 z-10 pointer-events-none">
            <h2 className="text-3xl font-black flex items-center gap-3 cyber-glow">
              <Activity className="text-cyber-blue" /> 3D SANDBOX VIEWER
            </h2>
            <p className="text-gray-500 max-w-xs mt-2">
              Interagisci con il grafico 3D. Ruota per vedere le proiezioni e osserva come la pallina genera dati.
            </p>
          </div>

          <div className="w-full h-full">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={45} />
              <Scene3D 
                ballPosition={currentData} 
                trajectory={chartData}
                params={params}
              />
            </Canvas>
          </div>

          {/* Info HUD */}
          <div className="absolute bottom-10 left-10 z-10 bg-black/80 backdrop-blur-md p-6 border border-cyber-blue/30 rounded-lg cyber-border min-w-[200px]">
            <div className="space-y-4">
              <div className="flex justify-between items-end gap-8">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Tempo (t)</p>
                  <p className="text-2xl font-mono text-cyber-blue">{currentData.t.toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest text-right">Spazio (s)</p>
                  <p className="text-2xl font-mono text-cyber-pink text-right">{currentData.s.toFixed(2)}m</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Velocità (ds/dt)</p>
                <p className="text-2xl font-mono text-cyber-green">{currentData.v.toFixed(2)}m/s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Real-time Modifiers */}
        <div className="w-full lg:w-[400px] bg-black/40 backdrop-blur-xl border-l border-white/5 p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Sliders className="text-cyber-blue" /> Modificatori
              </h3>
              <p className="text-gray-500 text-sm">Regola i parametri del moto per osservare le variazioni istantanee nel grafico 3D.</p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-400 uppercase tracking-wider font-bold">Ampiezza</label>
                  <span className="text-cyber-blue font-mono text-lg">{params.amplitude.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="5" step="0.1" 
                  value={params.amplitude}
                  onChange={(e) => setParams({...params, amplitude: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-400 uppercase tracking-wider font-bold">Frequenza</label>
                  <span className="text-cyber-blue font-mono text-lg">{params.frequency.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="3" step="0.1" 
                  value={params.frequency}
                  onChange={(e) => setParams({...params, frequency: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <label className="text-gray-400 uppercase tracking-wider font-bold">Pendenza</label>
                  <span className="text-cyber-blue font-mono text-lg">{params.slope.toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="-2" max="2" step="0.1" 
                  value={params.slope}
                  onChange={(e) => setParams({...params, slope: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                />
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-1 py-4 rounded-lg font-black flex items-center justify-center gap-3 transition-all active:scale-95 ${
                  isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30'
                }`}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'STOP' : 'PLAY'}
              </button>
              <button 
                onClick={() => setTime(0)}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all active:scale-95"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="p-6 bg-cyber-blue/5 border border-cyber-blue/20 rounded-xl space-y-3">
              <h4 className="font-bold text-cyber-blue text-xs uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Nota Scientifica
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Le modifiche agiscono sulla <span className="text-white italic">Legge Oraria</span>. 
                L'ampiezza aumenta lo spostamento massimo, la frequenza accelera le oscillazioni e la pendenza determina la velocità di deriva costante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEZIONE FINALE: CALCOLATORE */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black italic tracking-tighter cyber-glow">ANALISI DI FLUSSO 2D</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Confronta la posizione e la velocità istantanea nel tempo attraverso la rappresentazione cartesiana standard.</p>
          </div>

          {/* 2D Graph Display */}
          <div className="space-y-6">
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl h-[500px] relative overflow-hidden">
              <div className="absolute top-6 left-6 z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Function className="text-cyber-pink" /> Analisi di Funzione: s(t) e v(t)
                </h3>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 60, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="t" stroke="#444" label={{ value: 'Tempo (s)', position: 'insideBottomRight', offset: -10 }} />
                  <YAxis stroke="#444" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  
                  {/* Funzione Spazio */}
                  <RechartsLine 
                    type="monotone" 
                    dataKey="s" 
                    stroke="#ff00ff" 
                    strokeWidth={3} 
                    dot={false} 
                    name="Spazio s(t)"
                  />
                  
                  {/* Funzione Velocità (Derivata) */}
                  <RechartsLine 
                    type="monotone" 
                    dataKey="v" 
                    stroke="#00ff9f" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false} 
                    name="Velocità v(t)"
                  />

                  {/* Punto Corrente */}
                  <ReferenceLine x={currentData.t} stroke="#00f2ff" strokeDasharray="3 3" />
                  
                  {/* Tangente nel punto (Approssimazione visiva nel grafico 2D) */}
                  <RechartsLine
                    data={[
                      { t: currentData.t - 0.5, s: currentData.s - currentData.v * 0.5 },
                      { t: currentData.t + 0.5, s: currentData.s + currentData.v * 0.5 }
                    ]}
                    stroke="#00f2ff"
                    strokeWidth={4}
                    dot={false}
                    name="Tangente (Derivata)"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>

              <div className="absolute bottom-6 right-8 flex gap-6 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyber-pink rounded-full" /> 
                  <span className="text-gray-400">s(t)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyber-green border-dashed border-2 border-transparent rounded-full" /> 
                  <span className="text-gray-400">v(t) = s'(t)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyber-blue rounded-full" /> 
                  <span className="text-gray-400">Tangente</span>
                </div>
              </div>
            </div>

            {/* Studio di Funzione Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-cyber-pink/5 border border-cyber-pink/20 rounded-xl">
                <h4 className="font-bold text-cyber-pink mb-2 uppercase text-xs tracking-widest">Punti Critici</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  La velocità v(t) si annulla quando il moto inverte la direzione. In questi punti abbiamo un Massimo o un Minimo locale (Stazionarietà).
                </p>
              </div>
              <div className="p-6 bg-cyber-green/5 border border-cyber-green/20 rounded-xl">
                <h4 className="font-bold text-cyber-green mb-2 uppercase text-xs tracking-widest">Crescenza e Decrescenza</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Se v(t) &gt; 0, la pallina si muove in avanti (funzione crescente). Se v(t) &lt; 0, si muove all'indietro (funzione decrescente).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
