
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, Direction } from './types';
import { getEmptyGrid, addRandomTile, move, checkGameOver, hasWon } from './services/gameLogic';
import Board from './components/Board';
import AchievementBadges from './components/AchievementBadges';
import WalletConnect from './components/WalletConnect';
import LeaderboardModal from './components/LeaderboardModal';
import { COLORS } from './constants';
import { CONTRACT_ADDRESS, encodeSubmitScore, fetchCurrentOnChainScore } from './services/smartContract';
import { playMoveSound, playMergeSound, playWinSound, playGameOverSound, triggerHaptic } from './services/audio';

// --- ICONS ---
const RestartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6"></path><path d="M21.5 22v-6h-6"></path><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path></svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14l2 2 4-4"></path>
  </svg>
);

const SoundOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

const SoundOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

const BaseLogo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0052FF"/>
    <path d="M20 50h60" stroke="white" strokeWidth="16" strokeLinecap="round" transform="translate(10, 0)" />
  </svg>
);

type Theme = 'classic' | 'sapphire' | 'grid' | 'aurora';

const Background = ({ theme }: { theme: Theme }) => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none transition-all duration-700">
    <div className="absolute inset-0 bg-[#050505]" />
    <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'classic' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] opacity-20 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
    </div>
    <div className="absolute inset-0 bg-radial-vignette" />
  </div>
);

export default function App() {
  const [grid, setGrid] = useState<Grid>(getEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const isInitialized = useRef(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme] = useState<Theme>('classic');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const savedSound = localStorage.getItem('base2048-sound');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    const savedBest = localStorage.getItem('base2048-best');
    if (savedBest) setBestScore(parseInt(savedBest));
    const savedState = localStorage.getItem('base2048-state');
    let loaded = false;
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState && parsedState.grid) {
          setGrid(parsedState.grid);
          setScore(parsedState.score || 0);
          setGameOver(parsedState.gameOver || false);
          setGameWon(parsedState.gameWon || false);
          loaded = true;
        }
      } catch (e) { console.error(e); }
    }
    if (!loaded) startNewGame();
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (walletAddress && window.ethereum) {
        fetchCurrentOnChainScore(window.ethereum, walletAddress).then(chainScore => {
            if (chainScore > bestScore) {
                setBestScore(chainScore);
                localStorage.setItem('base2048-best', chainScore.toString());
            }
        });
    }
  }, [walletAddress, bestScore]);

  useEffect(() => {
    if (!isInitialized.current) return;
    localStorage.setItem('base2048-state', JSON.stringify({ grid, score, gameOver, gameWon }));
  }, [grid, score, gameOver, gameWon]);

  const startNewGame = useCallback(() => {
    let newGrid = getEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
  }, []);

  const handleCheckIn = async () => {
    if (!walletAddress || !window.ethereum) {
      alert("Connect wallet to perform Daily Check-in.");
      return;
    }

    setIsCheckingIn(true);
    try {
      // Реализуем чек-ин через вызов submitScore, так как этот метод работает гарантированно
      // Передаем текущий лучший счет. Контракт просто обновит его или оставит прежним.
      const dummyScoreData = encodeSubmitScore(bestScore || 0);
      
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ 
          to: CONTRACT_ADDRESS, 
          from: walletAddress, 
          data: dummyScoreData 
        }],
      });
      
      if (soundEnabled) playWinSound();
      triggerHaptic('success');
      alert("Daily Check-in successful! 🟦");
    } catch (error: any) {
      console.error("Check-in via submitScore failed", error);
      if (error?.code === 4001) return;
      alert("Transaction failed. Make sure you are on Base Network.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const executeMove = useCallback((direction: Direction) => {
    if (gameOver || showLeaderboard) return;
    const result = move(grid, direction);
    if (result.moved) {
      if (result.score > 0) { if (soundEnabled) playMergeSound(); triggerHaptic('medium'); }
      else { if (soundEnabled) playMoveSound(); triggerHaptic('light'); }
      let newGrid = result.grid;
      const newScore = score + result.score;
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('base2048-best', newScore.toString());
      }
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      if (hasWon(newGrid) && !gameWon) { setGameWon(true); if (soundEnabled) playWinSound(); triggerHaptic('success'); }
      if (checkGameOver(newGrid)) { setGameOver(true); if (soundEnabled) playGameOverSound(); triggerHaptic('heavy'); }
    }
  }, [grid, score, bestScore, gameOver, gameWon, showLeaderboard, soundEnabled]);

  const mintScore = async () => {
    if (!walletAddress || !window.ethereum) return;
    setIsVerifying(true);
    try {
      const scoreData = encodeSubmitScore(bestScore);
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ to: CONTRACT_ADDRESS, from: walletAddress, data: scoreData }],
      });
      if (soundEnabled) playWinSound(); 
      setTimeout(() => setShowLeaderboard(true), 2000);
    } catch (error: any) {
      if (error?.code !== 4001) alert("Transaction failed.");
    } finally { setIsVerifying(false); }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLeaderboard) return;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) executeMove('UP');
      if (['ArrowDown', 's', 'S'].includes(e.key)) executeMove('DOWN');
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) executeMove('LEFT');
      if (['ArrowRight', 'd', 'D'].includes(e.key)) executeMove('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeMove, showLeaderboard]);

  const touchStart = useRef<{x: number, y: number} | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showLeaderboard) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (showLeaderboard || !touchStart.current) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStart.current.x;
    const dy = touchEnd.y - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) dx > 0 ? executeMove('RIGHT') : executeMove('LEFT');
    } else {
      if (Math.abs(dy) > 30) dy > 0 ? executeMove('DOWN') : executeMove('UP');
    }
    touchStart.current = null;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 relative overflow-hidden font-sans" style={{ backgroundColor: COLORS.background }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <Background theme={theme} />
      <div className="w-full max-w-[360px] z-10 flex flex-col h-full justify-between pb-12">
        <div className="flex flex-col gap-4 mb-2">
            <div className="flex justify-between items-center backdrop-blur-sm bg-black/20 p-2 rounded-xl border border-white/5 relative z-50">
                <div className="flex items-center gap-2">
                    <BaseLogo />
                    <span className="font-black text-xl tracking-tight italic text-white drop-shadow-[0_0_10px_rgba(0,82,255,0.5)]">Base <span className="text-[#0052FF]">2048</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <WalletConnect onConnect={setWalletAddress} onDisconnect={() => setWalletAddress(null)} />
                </div>
            </div>

            <div className="flex justify-between items-end gap-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 ml-1">Score</span>
                    <div className="bg-[#111111]/80 backdrop-blur-md border border-[#333] px-3 py-2 rounded-lg min-w-[80px] shadow-lg text-center">
                        <span className="text-xl font-mono font-bold text-white">{score}</span>
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 ml-1">Best</span>
                    <div className="bg-[#111111]/80 backdrop-blur-md border border-[#333] px-3 py-2 rounded-lg min-w-[80px] shadow-lg text-center">
                        <span className="text-xl font-mono font-bold text-white">{bestScore}</span>
                    </div>
                 </div>
                 <div className="flex gap-2 ml-auto">
                    {/* CHECK-IN BUTTON */}
                    <button 
                        onClick={handleCheckIn} 
                        disabled={isCheckingIn}
                        title="Daily Check-in"
                        className={`bg-[#0052FF]/20 hover:bg-[#0052FF]/40 border border-[#0052FF]/30 text-[#0052FF] w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-lg active:scale-95 ${isCheckingIn ? 'animate-pulse' : ''}`}
                    >
                        {isCheckingIn ? <div className="w-4 h-4 border-2 border-[#0052FF] border-t-transparent rounded-full animate-spin" /> : <CalendarIcon />}
                    </button>

                    <button onClick={startNewGame} className="bg-[#1A1A1A]/80 hover:bg-[#252525] border border-[#333] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-lg"><RestartIcon /></button>
                    <button onClick={() => setShowLeaderboard(true)} className="bg-[#0052FF] hover:bg-[#004ad9] text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95"><TrophyIcon /></button>
                 </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col justify-center relative">
          <AchievementBadges score={bestScore} walletAddress={walletAddress} />
          <div className="mt-3 relative w-full">
             <Board grid={grid} />
            {gameOver && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-xl backdrop-blur-xl p-6 text-center animate-fade-in border border-white/10 shadow-2xl">
                    <div className="mb-6 transform scale-110"><div className="text-6xl mb-4">💀</div><h2 className="text-3xl font-black italic uppercase text-white tracking-wider">Game Over</h2></div>
                    <div className="bg-[#111]/80 border border-[#222] p-4 rounded-lg w-full mb-6"><span className="text-gray-500 text-xs uppercase font-bold block mb-1">Final Score</span><span className="text-5xl font-mono font-bold text-[#0052FF]">{score}</span></div>
                    <div className="flex flex-col gap-3 w-full">
                        <button onClick={startNewGame} className="w-full py-3 bg-white text-black font-bold uppercase rounded hover:bg-gray-200 transition-colors">Try Again</button>
                        {walletAddress ? (
                            <button onClick={mintScore} disabled={isVerifying} className="w-full py-3 bg-[#0052FF] text-white font-bold uppercase rounded hover:bg-[#004ad9] transition-colors">{isVerifying ? 'Minting...' : 'Mint High Score'}</button>
                        ) : (
                            <button className="w-full py-3 bg-[#111] border border-[#333] text-gray-500 font-bold uppercase rounded cursor-not-allowed">Connect to Mint</button>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-auto gap-1"><div className="text-center text-[10px] text-gray-500 font-mono tracking-widest opacity-60 italic">POWERED BY BASE SMART WALLET</div></div>
      </div>
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} userScore={bestScore} walletAddress={walletAddress} />
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .bg-grid { background-size: 40px 40px; background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px); }
        .bg-radial-vignette { background: radial-gradient(circle at center, transparent 0%, #050505 100%); }
      `}</style>
    </div>
  );
}
