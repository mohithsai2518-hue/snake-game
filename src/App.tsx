import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Gamepad2, Music, Trophy, RotateCcw } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

// --- Types ---
interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
  color: string;
}

interface Point {
  x: number;
  y: number;
}

// --- Constants ---
const TRACKS: Track[] = [
  {
    id: 1,
    title: "Vaporwave Vista",
    artist: "AI Gen: Synthia",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/vapor/400/400",
    color: "#ff00ff", // Magenta
  },
  {
    id: 2,
    title: "Neon Pulse",
    artist: "AI Gen: Electro",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon/400/400",
    color: "#00ffff", // Cyan
  },
  {
    id: 3,
    title: "Midnight Drive",
    artist: "AI Gen: Retro",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/drive/400/400",
    color: "#39ff14", // Lime
  },
];

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

// --- Components ---

const SnakeGame = ({ onScoreChange }: { onScoreChange: (score: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const gameLoopRef = useRef<number | null>(null);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setIsGameOver(false);
    setScore(0);
    setSpeed(150);
    onScoreChange(0);
    generateFood(INITIAL_SNAKE);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (isGameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        // Self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          onScoreChange(newScore);
          generateFood(newSnake);
          setSpeed(prev => Math.max(80, prev - 2));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [direction, food, isGameOver, score, speed, generateFood, onScoreChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Snake
    snake.forEach((segment, index) => {
      const alpha = 1 - (index / snake.length) * 0.6;
      ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#39ff14";
      
      // Rounded rectangles for snake
      const r = 4;
      const x = segment.x * cellSize + 1;
      const y = segment.y * cellSize + 1;
      const w = cellSize - 2;
      const h = cellSize - 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Food
    ctx.fillStyle = "#ff00ff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff00ff";
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div id="snake-container" className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-green to-neon-cyan rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-zinc-950 rounded-xl overflow-hidden border border-white/5">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full aspect-square"
        />
        
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
            >
              <Trophy className="w-12 h-12 text-neon-yellow mb-2" />
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Game Over</h2>
              <p className="text-zinc-400 mb-6">Final Score: <span className="text-neon-green font-mono">{score}</span></p>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-neon-green transition-colors"
                id="reset-button"
              >
                <RotateCcw className="w-4 h-4" />
                PLAY AGAIN
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MusicPlayerComp = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio error", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    } else {
      nextIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    }
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setProgress(0);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error("Autoplay blocked or error:", e);
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => skipTrack('next'));
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => skipTrack('next'));
    };
  }, [currentTrackIndex]);

  return (
    <div id="player-container" className="flex flex-col gap-6 w-full max-w-md">
      <audio ref={audioRef} src={currentTrack.url} />
      
      {/* Visualizer Mock */}
      <div className="flex items-end justify-center gap-1 h-32 overflow-hidden px-4">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: isPlaying ? [20, Math.random() * 100 + 20, 20] : 10,
            }}
            transition={{
              repeat: Infinity,
              duration: 0.5 + Math.random(),
              ease: "easeInOut",
            }}
            style={{ backgroundColor: currentTrack.color }}
            className="w-full max-w-[8px] rounded-t-sm opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          />
        ))}
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div 
          className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${currentTrack.color}, transparent 70%)` 
          }}
        />
        
        <div className="flex gap-4 relative">
          <motion.div 
            key={currentTrack.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0"
          >
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="flex flex-col justify-center overflow-hidden">
            <motion.h3 
              key={currentTrack.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-white truncate"
            >
              {currentTrack.title}
            </motion.h3>
            <p className="text-zinc-400 text-sm font-medium">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="mt-8 space-y-4 relative">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer group/progress">
            <motion.div 
              className="h-full group-hover/progress:brightness-125 transition-all"
              style={{ width: `${progress}%`, backgroundColor: currentTrack.color }}
              animate={{ boxShadow: isPlaying ? `0 0 10px ${currentTrack.color}` : 'none' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/40">
              <Volume2 className="w-4 h-4" />
              <div className="w-16 h-1 bg-white/10 rounded-full" />
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => skipTrack('prev')}
                className="text-white hover:text-white/80 transition-colors"
                id="prev-btn"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                id="play-pause-btn"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              
              <button 
                onClick={() => skipTrack('next')}
                className="text-white hover:text-white/80 transition-colors"
                id="next-btn"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
            </div>

            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-neon-green selection:text-black overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-neon-purple rounded-full blur-[200px]" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-neon-cyan rounded-full blur-[200px]" />
      </div>

      {/* Navigation / Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center rotate-3">
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">NEON BEATS</h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">ARCADE & AUDIO</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Audio: Operational</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-2 bg-black/60 border border-white/10 rounded-xl shadow-inner group">
            <Trophy className="w-6 h-6 text-neon-yellow group-hover:scale-110 transition-transform" />
            <span 
              className="text-4xl font-digital text-neon-yellow tracking-[0.2em] relative glitch block" 
              data-text={String(score).padStart(4, '0')}
            >
               {String(score).padStart(4, '0')}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-80px)]">
        {/* Left Side: Info & Player */}
        <div className="space-y-12">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-md"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-green">Live Prototype v1.0.4</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl sm:text-7xl font-black uppercase tracking-tighter italic leading-[0.85]"
            >
              Play the <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]">Rhythm.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 max-w-sm font-medium leading-relaxed"
            >
              Master the grid while syncing to curated AI-generated synthscapes. 
              The ultimate chill-out arcade session.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MusicPlayerComp />
          </motion.div>
        </div>

        {/* Right Side: Game */}
        <div className="flex flex-col items-center justify-center">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ type: "spring", damping: 15 }}
             className="w-full max-w-[450px]"
           >
              <div className="mb-6 flex justify-between items-end">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Game Interface</span>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                      <span className="text-sm font-mono text-zinc-300">SYSTEM_ACTIVE</span>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Grid Density</p>
                   <p className="text-sm font-mono text-neon-cyan leading-none">20x20_MATRX</p>
                </div>
              </div>

              <SnakeGame onScoreChange={setScore} />
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                   <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Controls</div>
                   <div className="grid grid-cols-3 gap-1">
                      <div className="w-8 h-8 rounded bg-zinc-800 border-b-2 border-zinc-950 flex items-center justify-center text-[10px] col-start-2">↑</div>
                      <div className="w-8 h-8 rounded bg-zinc-800 border-b-2 border-zinc-950 flex items-center justify-center text-[10px] col-start-1 row-start-2">←</div>
                      <div className="w-8 h-8 rounded bg-zinc-800 border-b-2 border-zinc-950 flex items-center justify-center text-[10px] col-start-2 row-start-2">↓</div>
                      <div className="w-8 h-8 rounded bg-zinc-800 border-b-2 border-zinc-950 flex items-center justify-center text-[10px] col-start-3 row-start-2">→</div>
                   </div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col justify-between">
                   <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Multiplier</div>
                   <div className="text-3xl font-black text-white italic">x{Math.floor(score / 50) + 1}</div>
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-neon-green transition-all duration-300" style={{ width: `${(score % 50) * 2}%` }} />
                   </div>
                </div>
              </div>
           </motion.div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="relative z-10 border-t border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          © 2024 NEON BEATS ARCADE // ARCADE SYSTEMS INC.
        </p>
        <div className="flex gap-6">
          {['Discord', 'Twitter', 'Github'].map(link => (
            <a key={link} href="#" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
