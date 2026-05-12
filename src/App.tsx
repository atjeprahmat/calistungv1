
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Trophy, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Volume2, 
  Hash, 
  Type, 
  Languages,
  ChevronLeft,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameCategory, Progress, INITIAL_PROGRESS, NUMBERS, LETTERS, HIJAIYAH } from './types';
import { playSound, speak } from './utils/audio';
import CanvasTracing from './components/CanvasTracing';

export default function App() {
  const [view, setView] = useState<'home' | 'game' | 'progress'>('home');
  const [category, setCategory] = useState<GameCategory>('numbers');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = localStorage.getItem('belajar_progress');
    const initial = saved ? JSON.parse(saved) : INITIAL_PROGRESS;
    // Handle migrations
    if (initial.playerName === undefined) initial.playerName = '';
    return initial;
  });
  
  const [gameStep, setGameStep] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [gameState, setGameState] = useState<'ready' | 'target_set' | 'success' | 'tracing' | 'counting'>('ready');
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Save progress
  useEffect(() => {
    localStorage.setItem('belajar_progress', JSON.stringify(progress));
  }, [progress]);

  const generateTask = () => {
    setTimerActive(false);
    // Every 5 stars, give a tracing task (but not 0 stars)
    const currentStars = progress.stats[category].stars;
    const shouldTrace = currentStars > 0 && (currentStars + 1) % 6 === 0;
    const shouldCount = category === 'numbers' && currentStars > 2 && currentStars % 4 === 0;

    let pool: any[] = [];
    if (category === 'numbers') pool = NUMBERS;
    else if (category === 'letters') pool = LETTERS;
    else if (category === 'hijaiyah') pool = HIJAIYAH;

    const target = pool[Math.floor(Math.random() * pool.length)];

    if (shouldTrace) {
      setCurrentTarget(target);
      setGameState('tracing');
      const msg = `Ayo gambar ${category === 'numbers' ? 'angka' : 'huruf'} ${category === 'numbers' ? target.val : (category === 'hijaiyah' ? target.name : target.char)}`;
      speak(msg);
      setTimeLeft(60); // More time for tracing
      setTimerActive(true);
      return;
    }

    if (shouldCount) {
      setCurrentTarget(target);
      setGameState('counting');
      const msg = `Ada berapa bintang di layar?`;
      speak(msg);
      // Generate options including correct answer
      const val = target.val;
      const others = pool.filter(i => i !== target).sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions([target, ...others].sort(() => Math.random() - 0.5));
      setTimeLeft(20);
      setTimerActive(true);
      return;
    }

    const others = pool.filter(i => i !== target).sort(() => Math.random() - 0.5).slice(0, 3);
    const mixed = [target, ...others].sort(() => Math.random() - 0.5);

    setCurrentTarget(target);
    setOptions(mixed);
    setGameState('target_set');
    setTimeLeft(20);
    setTimerActive(true);
    
    // Auto speak
    const msg = category === 'numbers' ? `Tunjukkan angka ${target.val}` : 
                category === 'hijaiyah' ? `Tunjukkan huruf ${target.name}` :
                `Tunjukkan huruf ${target.char}`;
    speak(msg);
  };

  const handleChoice = (choice: any) => {
    if (gameState !== 'target_set' && gameState !== 'tracing' && gameState !== 'counting') return;

    if (choice === currentTarget) {
      setTimerActive(false);
      playSound('correct');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
      setStreak(s => s + 1);
      setGameState('success');

      // Personalized appreciation
      const compliments = [
        "hebat", "pintar", "luar biasa", "keren", "cerdas", "mantap", "jago sekali"
      ];
      const prefixes = ["Wow", "Hebat", "Luar biasa", "Yey", "Hore"];
      
      const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const name = progress.playerName || 'Pintar';
      
      // Randomly pick between "Name Compliment" or "Prefix Name Compliment"
      const message = Math.random() > 0.5 
        ? `${name} ${randomCompliment}!`
        : `${randomPrefix}, ${name} ${randomCompliment}!`;
        
      speak(message);
      
      // Update progress
      const newProgress = { ...progress };
      const oldStars = newProgress.stats[category].stars;
      newProgress.stats[category].stars += 1;
      if (newProgress.stats[category].stars > 0 && newProgress.stats[category].stars % 10 === 0) {
        newProgress.stats[category].level += 1;
        playSound('star'); // Extra sound for level up
        speak(`Selamat! Level kamu naik ke level ${newProgress.stats[category].level}`);
      }
      setProgress(newProgress);

      setTimeout(() => {
        setGameState('ready');
        generateTask();
      }, 4000); // Increased delay to avoid audio overlap
    } else {
      playSound('wrong');
      speak("Coba lagi sayang!");
      setStreak(0);
    }
  };

  const startLevel = (cat: GameCategory) => {
    setCategory(cat);
    setView('game');
    setGameStep(0);
    setGameState('ready');
    setTimerActive(false);
    setTimeout(generateTask, 500);
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      playSound('wrong');
      speak("Waktu habis! Ayo coba lagi.");
      setTimeout(generateTask, 2000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tracingSize = useMemo(() => {
    if (windowWidth < 640) return 280;
    if (windowWidth < 1024) return 340;
    return 380;
  }, [windowWidth]);

  const renderHome = () => (
    <div className="h-full bg-blue-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <AnimatePresence>
        {!progress.playerName && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-blue-900/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-x-8 border-t-8 border-white text-center"
            >
              <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl border-4 border-white">
                👋
              </div>
              <h2 className="text-3xl font-black text-blue-900 mb-2 italic">HALO, SIAPA NAMAMU?</h2>
              <p className="text-blue-400 font-bold mb-8 uppercase text-sm tracking-widest">Ayo tulis nama panggilanmu!</p>
              
              <input 
                type="text"
                autoFocus
                maxLength={10}
                placeholder="Tulis di sini..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) setProgress(prev => ({ ...prev, playerName: val }));
                  }
                }}
                className="w-full p-6 text-2xl font-black text-center text-blue-900 bg-blue-50 rounded-[28px] focus:outline-none focus:ring-4 focus:ring-blue-200 placeholder:text-blue-200 mb-6 uppercase italic"
              />
              
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const val = input.value.trim();
                  if (val) setProgress(prev => ({ ...prev, playerName: val }));
                }}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-[28px] shadow-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all text-xl tracking-tighter italic"
              >
                MULAI PETUALANGAN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decoration from theme */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none grid grid-cols-10 gap-x-20 gap-y-12">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="text-8xl font-black">{i % 3 === 0 ? 'A' : (i % 3 === 1 ? '1' : 'ب')}</span>
        ))}
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-16 relative z-10"
      >
        <h1 className="text-6xl font-black text-blue-900 mb-4 drop-shadow-sm tracking-tight italic">
          BELAJAR DUNIA!
        </h1>
        <p className="text-blue-400 font-bold tracking-[0.2em] uppercase text-sm">Pilih Petualanganmu</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-5xl relative z-10">
        <CategoryCard 
          icon={<Hash className="w-16 h-16 text-blue-500" />}
          title="ANGKA"
          subtitle="Kenali 1 sampai 10"
          color="bg-white"
          borderColor="border-blue-300"
          onClick={() => startLevel('numbers')}
          stars={progress.stats.numbers.stars}
        />
        <CategoryCard 
          icon={<Type className="w-16 h-16 text-purple-500" />}
          title="HURUF"
          subtitle="Abjad A sampai Z"
          color="bg-white"
          borderColor="border-purple-300"
          onClick={() => startLevel('letters')}
          stars={progress.stats.letters.stars}
        />
        <CategoryCard 
          icon={<Languages className="w-16 h-16 text-green-500" />}
          title="HIJAIYAH"
          subtitle="Alif, Ba, Ta..."
          color="bg-white"
          borderColor="border-green-300"
          onClick={() => startLevel('hijaiyah')}
          stars={progress.stats.hijaiyah.stars}
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setView('progress')}
        className="mt-16 flex items-center gap-3 bg-blue-900 px-10 py-5 rounded-3xl shadow-2xl text-white font-black tracking-widest hover:bg-blue-800 transition-all border-b-8 border-blue-950 active:border-b-0 active:translate-y-2"
      >
        <Trophy className="w-6 h-6 text-yellow-400" />
        RAPORT BELAJAR
      </motion.button>
    </div>
  );

  const renderGame = () => (
    <div className="h-full bg-blue-50 flex flex-col overflow-hidden font-sans">
      {/* Header Panel */}
      <div className="h-16 md:h-20 bg-white shadow-md flex items-center justify-between px-4 md:px-10 z-10 shrink-0">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button onClick={() => setView('home')} className="p-1 md:p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-blue-900" />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-400 rounded-full flex items-center justify-center border-2 md:border-4 border-white shadow-sm text-xl md:text-2xl">
            👦
          </div>
          <div className="hidden sm:block">
            <h3 className="text-blue-900 font-bold text-sm md:text-base leading-tight truncate max-w-[100px] md:max-w-none">Halo, {progress.playerName}!</h3>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-tight">Level {progress.stats[category].level}</p>
          </div>
        </div>
        
        <div className="flex space-x-2 md:space-x-4">
          <div className={`flex items-center px-3 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl border-2 shadow-sm transition-colors ${timeLeft < 5 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
            <span className="font-black text-sm md:text-xl tabular-nums">{timeLeft}s</span>
          </div>
          <div className="flex items-center bg-yellow-50 px-3 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl border-2 border-yellow-200 shadow-sm">
            <span className="text-yellow-600 font-bold text-sm md:text-xl mr-1 md:mr-2">⭐</span>
            <span className="text-yellow-800 font-black text-sm md:text-xl">{progress.stats[category].stars}</span>
          </div>
          <div className="hidden xs:flex items-center bg-pink-50 px-3 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl border-2 border-pink-200 shadow-sm">
            <span className="text-pink-600 font-bold text-sm md:text-xl mr-1 md:mr-2">🏆</span>
            <span className="text-pink-800 font-black text-sm md:text-xl">L{progress.stats[category].level}</span>
          </div>
        </div>
      </div>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Mode Selector */}
        <div className="w-full md:w-64 bg-blue-100/50 p-4 md:p-6 flex md:flex-col space-x-3 md:space-x-0 md:space-y-4 shrink-0 overflow-x-auto md:overflow-y-auto no-scrollbar">
          <div className="hidden md:block text-blue-900 font-black text-[10px] uppercase tracking-widest mb-2 opacity-60">MODE BELAJAR</div>
          
          <SidebarButton 
            active={category === 'letters'} 
            onClick={() => { 
              setCategory('letters'); 
              setGameState('ready'); 
              setCurrentTarget(null);
              setOptions([]);
              setTimeout(generateTask, 100); 
            }}
            icon="Aa" title="Huruf" color="blue" 
          />
          <SidebarButton 
            active={category === 'numbers'} 
            onClick={() => { 
              setCategory('numbers'); 
              setGameState('ready'); 
              setCurrentTarget(null);
              setOptions([]);
              setTimeout(generateTask, 100); 
            }}
            icon="123" title="Angka" color="green" 
          />
          <SidebarButton 
            active={category === 'hijaiyah'} 
            onClick={() => { 
              setCategory('hijaiyah'); 
              setGameState('ready'); 
              setCurrentTarget(null);
              setOptions([]);
              setTimeout(generateTask, 100); 
            }}
            icon="ا ب" title="Hijaiyah" color="purple" 
          />

          <div className="hidden md:block mt-auto p-4 bg-white/60 rounded-3xl border-2 border-blue-200 backdrop-blur-sm">
            <p className="text-[10px] text-blue-900 font-black mb-2 uppercase tracking-wide">Target Hari Ini:</p>
            <div className="w-full bg-blue-200 h-3 rounded-full overflow-hidden p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(progress.stats[category].stars % 10) * 10}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-blue-600 mt-2 font-black">{(progress.stats[category].stars % 10) * 10}% Selesai</p>
          </div>
        </div>

        {/* Game Stage Area */}
        <div className="flex-1 relative p-4 md:p-10 flex flex-col overflow-hidden">
          <div className="bg-white rounded-[32px] md:rounded-[48px] flex-1 w-full shadow-2xl border-x-4 md:border-x-8 border-t-4 md:border-t-8 border-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none select-none">
              <div className="grid grid-cols-10 gap-x-12 gap-y-16 p-10 font-black text-8xl">
                {Array.from({ length: 30 }).map((_, i) => (
                   <span key={i}>{category === 'numbers' ? i % 10 : (category === 'letters' ? LETTERS[i % 26].char : HIJAIYAH[i % 28].char)}</span>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {gameState === 'target_set' && (
                <motion.div 
                  key="task"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="w-full flex flex-col items-center gap-12 z-10"
                >
                  <div className="text-center">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const msg = category === 'numbers' ? `Tunjukkan angka ${currentTarget.val}` : 
                                    category === 'hijaiyah' ? `Tunjukkan huruf ${currentTarget.name}` :
                                    `Tunjukkan huruf ${currentTarget.char}`;
                        speak(msg);
                      }}
                      className="w-28 h-28 bg-blue-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl animate-pulse ring-12 ring-blue-50 transition-all active:ring-0 active:scale-95"
                    >
                      <Volume2 className="w-14 h-14 text-white" />
                    </motion.button>
                    <h2 className="text-4xl font-black text-blue-900 tracking-tight italic uppercase">
                       "Cari {category === 'numbers' ? 'Angka' : 'Huruf'} {category === 'numbers' ? currentTarget.val : (category === 'hijaiyah' ? currentTarget.name : currentTarget.char)}!"
                    </h2>
                    <p className="text-blue-400 font-bold mt-2">Dengarkan suara dan pilih tombol yang tepat!</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:grid-cols-4 md:gap-8 px-4 md:px-10 w-full max-w-4xl">
                    {options.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9, y: 8 }}
                        onClick={() => handleChoice(opt)}
                        className={`h-32 xs:h-40 md:h-52 rounded-[32px] md:rounded-[40px] shadow-2xl flex items-center justify-center transition-all bg-white text-5xl md:text-7xl font-black text-blue-900 chunky-button ${
                          i % 4 === 0 ? 'chunky-shadow-pink border-pink-400' :
                          i % 4 === 1 ? 'chunky-shadow-yellow border-yellow-400' :
                          i % 4 === 2 ? 'chunky-shadow-teal border-teal-400' :
                          'chunky-shadow-blue border-blue-400'
                        } border-2 overflow-hidden hover:bg-gray-50`}
                      >
                        {category === 'numbers' ? opt.val : opt.char}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {gameState === 'tracing' && currentTarget && (
                <motion.div
                  key="tracing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center z-10"
                >
                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-black text-blue-900 italic">TULIS DI SIN!</h2>
                    <p className="text-blue-400 font-bold">Ikuti garisnya ya cantik...</p>
                  </div>
                  <CanvasTracing 
                    character={category === 'numbers' ? currentTarget.val.toString() : currentTarget.char}
                    onFinish={() => handleChoice(currentTarget)}
                    color={category === 'numbers' ? '#F472B6' : (category === 'hijaiyah' ? '#34D399' : '#60A5FA')}
                    size={tracingSize}
                  />
                </motion.div>
              )}

              {gameState === 'counting' && currentTarget && (
                <motion.div
                  key="counting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-12 z-10 w-full"
                >
                  <div className="grid grid-cols-5 xs:grid-cols-10 gap-2 md:gap-4 mb-2">
                    {Array.from({ length: currentTarget.val }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring' }}
                        className="w-10 h-10 md:w-14 md:h-14 bg-yellow-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border-2 md:border-4 border-white"
                      >
                        <Star className="w-6 h-6 md:w-8 md:h-8 text-white fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl md:text-4xl font-black text-blue-900 italic uppercase">Ada Berapa?</h2>
                    <p className="text-blue-400 font-bold mt-1 md:mt-2 text-sm md:text-base">Dihitung pelan-pelan ya!</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-4 md:px-10 max-w-4xl">
                   {options.map((opt, i) => (
                     <motion.button
                       key={i}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => handleChoice(opt)}
                       className={`h-24 md:h-32 rounded-3xl bg-white border-2 border-gray-100 chunky-button chunky-shadow-yellow text-4xl md:text-5xl font-black text-blue-900 shadow-sm`}
                     >
                       {opt.val}
                     </motion.button>
                   ))}
                  </div>
                </motion.div>
              )}

              {gameState === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ rotate: -20, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-8 z-10"
                >
                  <div className="w-56 h-56 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl border-[12px] border-white ring-20 ring-yellow-50">
                     <Star className="w-32 h-32 text-white fill-current animate-spin-slow" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-6xl font-black text-yellow-500 uppercase tracking-tighter italic drop-shadow-lg">LUAR BIASA!</h1>
                    <p className="text-2xl font-black text-blue-400 mt-4">Kamu sangat pintar sekali!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Track / Footer */}
      <div className="h-20 md:h-24 bg-blue-900 flex items-center px-4 md:px-10 relative overflow-hidden shrink-0">
        <div className="hidden sm:block text-white/40 font-black text-sm md:text-2xl mr-6 md:mr-12 italic shrink-0 tracking-widest uppercase">PETA BELAJAR</div>
        
        <div className="flex-1 flex items-center space-x-6 md:space-x-12 relative overflow-x-auto no-scrollbar py-2">
          {/* Connection Line */}
          <div className="absolute h-1 w-full bg-white/10 top-1/2 -translate-y-1/2 left-0 z-0"></div>
          
          {/* Path Dots */}
          {Array.from({ length: 10 }).map((_, i) => {
             const stepLevel = i + 1;
             const isCompleted = progress.stats[category].level > stepLevel;
             const isCurrent = progress.stats[category].level === stepLevel;
             return (
               <div key={i} className="relative z-10 shrink-0">
                 <div className={`
                   flex items-center justify-center transition-all duration-500
                   ${isCompleted ? 'w-8 h-8 md:w-10 md:h-10 bg-green-400 border-2 md:border-4 border-blue-900 ring-2 md:ring-4 ring-green-400/30' : 
                     isCurrent ? 'w-12 h-12 md:w-16 md:h-16 bg-white border-2 md:border-4 border-blue-600 shadow-2xl ring-4 md:ring-8 ring-blue-500/20' : 
                     'w-8 h-8 md:w-10 md:h-10 bg-blue-800 border-2 md:border-4 border-blue-950 opacity-40'}
                   rounded-full
                 `}>
                   <span className={`font-black tracking-tighter ${isCurrent ? 'text-blue-900 text-xs md:text-base' : 'text-white/60 text-[8px] md:text-[10px]'}`}>
                     L{stepLevel}
                   </span>
                   {isCompleted && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"><CheckCircle2 className="w-2 h-2 md:w-3 md:h-3 text-green-500" /></div>}
                 </div>
               </div>
             );
          })}
        </div>
        
        <div className="ml-4 md:ml-12 shrink-0">
          <button 
            onClick={() => setView('progress')}
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-extrabold py-2 md:py-3 px-4 md:px-8 rounded-xl md:rounded-[20px] shadow-xl border-b-4 md:border-b-6 border-yellow-600 transition-all active:border-b-0 active:translate-y-1 text-xs md:text-base"
          >
            TOKO
          </button>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-12">
          <button onClick={() => setView('home')} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-gray-800">Raport Belajarku</h1>
          <div className="w-10" />
        </header>

        <div className="space-y-6">
          {(Object.keys(progress.stats) as GameCategory[]).map(cat => (
            <div key={cat} className="p-6 border-2 border-gray-100 rounded-3xl bg-gray-50/50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    cat === 'numbers' ? 'bg-blue-100' : 
                    cat === 'letters' ? 'bg-purple-100' : 'bg-green-100'
                  }`}>
                    {cat === 'numbers' ? <Hash className="w-6 h-6 text-blue-500" /> : 
                     cat === 'letters' ? <Type className="w-6 h-6 text-purple-500" /> : 
                     <Languages className="w-6 h-6 text-green-500" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 capitalize">{cat}</h3>
                    <p className="text-xs text-gray-500">Level {progress.stats[cat].level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-bold text-yellow-600">
                  <Star className="w-4 h-4 fill-current" />
                  {progress.stats[cat].stars}
                </div>
              </div>
              <div className="h-4 bg-white border-2 border-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.stats[cat].stars % 10) * 10}%` }}
                  className={`h-full ${
                    cat === 'numbers' ? 'bg-blue-400' : 
                    cat === 'letters' ? 'bg-purple-400' : 'bg-green-400'
                  }`} 
                />
              </div>
              <p className="text-[10px] text-right mt-2 font-bold uppercase tracking-wider text-gray-400">
                {10 - (progress.stats[cat].stars % 10)} Bintang lagi Ke Level {progress.stats[cat].level + 1}
              </p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => {
            if (confirm('Hapus semua kemajuan dan nama?')) {
              localStorage.removeItem('belajar_progress');
              localStorage.clear(); // Nuclear option to be safe
              window.location.href = window.location.origin; // Hardest reset
            }
          }}
          className="mt-12 w-full p-4 text-red-500 font-medium text-sm border-2 border-red-50 border-dashed rounded-2xl hover:bg-red-50 transition-colors uppercase tracking-widest font-black"
        >
          Reset Semua Progress
        </button>
      </div>
    </div>
  );

  return (
    <div className="font-sans antialiased h-full overflow-hidden select-none">
      {view === 'home' && renderHome()}
      {view === 'game' && renderGame()}
      {view === 'progress' && renderProgress()}
    </div>
  );
}

function SidebarButton({ active, icon, title, color, onClick }: any) {
  const colorMap = {
    blue: 'bg-blue-500 border-blue-700 hover:bg-blue-600',
    green: 'bg-green-500 border-green-700 hover:bg-green-600',
    purple: 'bg-purple-500 border-purple-700 hover:bg-purple-600'
  };

  return (
    <button 
      onClick={onClick}
      className={`py-3 md:py-4 px-3 md:px-4 rounded-2xl md:rounded-[24px] shadow-lg border-b-4 flex items-center space-x-2 md:space-x-3 transition-all active:translate-y-1 active:border-b-0 shrink-0 min-w-[100px] md:w-full ${
        active 
          ? `${colorMap[color as keyof typeof colorMap]} text-white ring-4 ring-blue-100` 
          : 'bg-white border-blue-100 hover:bg-blue-50 text-blue-900'
      }`}
    >
      <div className={`${active ? 'bg-white/20' : 'bg-gray-100'} p-1.5 md:p-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs min-w-[30px] md:min-w-[40px] text-center`}>
        {icon}
      </div>
      <span className="font-black uppercase tracking-tight text-[10px] md:text-xs">{title}</span>
    </button>
  );
}

function CategoryCard({ icon, title, subtitle, color, borderColor, onClick, stars }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${color} ${borderColor} border-2 md:border-4 p-6 md:p-8 rounded-[40px] md:rounded-[56px] flex flex-col items-center text-center shadow-[0_20px_50px_rgba(30,58,138,0.1)] relative overflow-hidden group`}
    >
      <div className="bg-blue-50 p-4 md:p-8 rounded-[24px] md:rounded-[32px] mb-4 md:mb-8 group-hover:scale-110 transition-transform duration-300">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-12 h-12 md:w-16 md:h-16' })}
      </div>
      <h3 className="text-2xl md:text-3xl font-black text-blue-900 mb-1 md:mb-2 tracking-tighter italic">{title}</h3>
      <p className="text-[10px] md:text-sm font-bold text-blue-400 mb-4 md:mb-6 uppercase tracking-wider">{subtitle}</p>
      
      <div className="bg-yellow-50 px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 md:gap-3 font-black text-yellow-600 border-2 border-yellow-200 text-xs md:text-base">
        <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
        {stars} BINTANG
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
    </motion.button>
  );
}
