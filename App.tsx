import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, GameState, Direction } from './types';
import { getEmptyGrid, addRandomTile, move, checkGameOver, hasWon } from './services/gameLogic';
import Board from './components/Board';
import AchievementBadges from './components/AchievementBadges';
import WalletConnect from './components/WalletConnect';
import LeaderboardModal from './components/LeaderboardModal';
import { COLORS, BADGE_LEVELS } from './constants';
import { CONTRACT_ADDRESS, encodeSubmitScore } from './services/smartContract';
import { playMoveSound, playMergeSound, playWinSound, playGameOverSound, triggerHaptic } from './services/audio';

// --- ICONS ---
const RestartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6"></path><path d="M21.5 22v-6h-6"></path><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path></svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
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

const SoundOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

const SoundOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

const BaseLogo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="base-logo-mask">
      <circle cx="50" cy="50" r="50" fill="white"/>
    </mask>
    <circle cx="50" cy="50" r="50" fill="#0052FF"/>
    <rect x="-10" y="42" width="75" height="16" fill="white" mask="url(#base-logo-mask)"/>
  </svg>
);

const Ticker = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#0052FF] text-white py-2 overflow-hidden z-40 border-t border-blue-400">
    <div className="whitespace-nowrap animate-ticker flex font-bold tracking-widest text-xs uppercase">
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Onchain Summer</span> • 
      <span className="mx-4">Based 2048</span> •
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Onchain Summer</span> • 
      <span className="mx-4">Based 2048</span> •
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Onchain Summer</span> • 
      <span className="mx-4">Based 2048</span>
    </div>
  </div>
);

export default function App() {
  const [grid, setGrid] = useState<Grid>(getEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const isInitialized = useRef(false);
  
  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // UI State
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Initialize Game & Settings
  useEffect(() => {
    // Load Settings
    const savedSound = localStorage.getItem('base2048-sound');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    // Load Best Score
    const savedBest = localStorage.getItem('base2048-best');
    if (savedBest) setBestScore(parseInt(savedBest));

    // Load Game State
    const savedState = localStorage.getItem('base2048-state');
    let loaded = false;

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState && parsedState.grid && Array.isArray(parsedState.grid)) {
          setGrid(parsedState.grid);
          setScore(parsedState.score || 0);
          setGameOver(parsedState.gameOver || false);
          setGameWon(parsedState.gameWon || false);
          loaded = true;
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }

    if (!loaded) {
      startNewGame();
    }
    
    isInitialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Settings when changed
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('base2048-sound', String(newState));
  };

  // Save Game State on Change
  useEffect(() => {
    if (!isInitialized.current) return;

    const gameState = {
      grid,
      score,
      gameOver,
      gameWon
    };
    localStorage.setItem('base2048-state', JSON.stringify(gameState));
  }, [grid, score, gameOver, gameWon]);

  const startNewGame = useCallback(() => {
    let newGrid = getEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setTxHash(null);
  }, []);

  const executeMove = useCallback((direction: Direction) => {
    if (gameOver || showLeaderboard) return;

    const result = move(grid, direction);
    
    if (result.moved) {
      if (result.score > 0) {
        if (soundEnabled) playMergeSound();
        triggerHaptic('medium');
      } else {
        if (soundEnabled) playMoveSound();
        triggerHaptic('light');
      }

      let newGrid = result.grid;
      const newScore = score + result.score;
      setScore(newScore);
      
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('base2048-best', newScore.toString());
      }

      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);

      if (hasWon(newGrid) && !gameWon) {
        setGameWon(true);
        if (soundEnabled) playWinSound();
        triggerHaptic('success');
      }

      if (checkGameOver(newGrid)) {
        setGameOver(true);
        if (soundEnabled) playGameOverSound();
        triggerHaptic('heavy');
      }
    }
  }, [grid, score, bestScore, gameOver, gameWon, showLeaderboard, soundEnabled]);

  // Wallet Features
  const mintScore = async () => {
    if (!walletAddress || !window.ethereum) return;
    setIsVerifying(true);
    setTxHash(null);
    
    let hash = null;
    const scoreData = encodeSubmitScore(bestScore);

    try {
      if (CONTRACT_ADDRESS) {
        try {
          hash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: CONTRACT_ADDRESS,
              from: walletAddress,
              data: scoreData,
            }],
          });
        } catch (contractError: any) {
          if (contractError?.code === 4001) throw contractError;
          // Fallback to self-send
          hash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: walletAddress,
              from: walletAddress,
              value: '0x0',
              data: scoreData,
            }],
          });
        }
      } else {
        // Fallback
        hash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            to: walletAddress,
            from: walletAddress,
            value: '0x0',
            data: scoreData,
          }],
        });
      }

      if (hash) {
        setTxHash(hash);
        if (soundEnabled) playWinSound();
        setTimeout(() => setShowLeaderboard(true), 2000);
      }
      
    } catch (error: any) {
      console.error("Transaction failed", error);
      if (error?.code !== 4001) alert("Transaction failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleShare = () => {
    const text = `🟦 Base 2048\n🏆 Score: ${bestScore}\n\nPlay on Base!`;
    const url = window.location.href;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=Base,Base2048`;
    window.open(tweetUrl, '_blank');
  };

  // Key Listeners
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

  // Touch handlers
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
      if (Math.abs(dx) > 30) {
        dx > 0 ? executeMove('RIGHT') : executeMove('LEFT');
      }
    } else {
      if (Math.abs(dy) > 30) {
        dy > 0 ? executeMove('DOWN') : executeMove('UP');
      }
    }
    touchStart.current = null;
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center p-4 relative overflow-hidden font-sans"
      style={{ backgroundColor: COLORS.background }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full opacity-5 blur-[120px]" style={{ background: COLORS.primary }} />

      {/* 
        Main Container:
        Restricted to 360px to exactly match the board width + layout tightness.
        This ensures headers, badges, and the board share the exact same vertical guide lines.
      */}
      <div className="w-full max-w-[360px] z-10 flex flex-col h-full justify-between pb-12">
        
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 mb-2">
            {/* Nav Row */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BaseLogo />
                    <span className="font-black text-xl tracking-tight italic">
                      Base <span className="text-[#0052FF]">2048</span>
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    <button onClick={toggleSound} className="p-2 text-gray-500 hover:text-white transition-colors">
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <WalletConnect 
                        onConnect={setWalletAddress}
                        onDisconnect={() => setWalletAddress(null)}
                    />
                </div>
            </div>

            {/* Score Row */}
            <div className="flex justify-between items-end gap-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Current</span>
                    <div className="bg-[#1A1A1A] border border-[#333] px-3 py-2 rounded min-w-[80px]">
                        <span className="text-xl font-mono font-bold text-white">{score}</span>
                    </div>
                 </div>

                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1">Best</span>
                    <div className="bg-[#1A1A1A] border border-[#333] px-3 py-2 rounded min-w-[80px]">
                        <span className="text-xl font-mono font-bold text-white">{bestScore}</span>
                    </div>
                 </div>

                 <div className="flex gap-1 ml-auto">
                    <button 
                        onClick={startNewGame}
                        className="bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
                        title="Reset"
                    >
                        <RestartIcon />
                    </button>
                    <button 
                        onClick={() => setShowLeaderboard(true)}
                        className="bg-[#0052FF] hover:bg-[#004ad9] text-white w-10 h-10 rounded flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(0,82,255,0.3)]"
                        title="Leaderboard"
                    >
                        <TrophyIcon />
                    </button>
                 </div>
            </div>
        </div>

        {/* GAME BOARD AREA */}
        <div className="flex-grow flex flex-col justify-center relative">
          
          {/* 
             Badges: Now aligned with grid columns via CSS Grid in component 
          */}
          <AchievementBadges score={bestScore} />
          
          <div className="mt-3 relative w-full">
             <Board grid={grid} />

             {/* Game Over / Win Modal */}
            {(gameOver || (gameWon && !grid.flat().includes(0) && !checkGameOver(grid))) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-xl backdrop-blur-sm p-6 text-center animate-fade-in border border-[#333]">
                    <div className="mb-6 transform scale-110">
                        {gameWon ? (
                            <div className="text-5xl mb-2">🎉</div>
                        ) : (
                            <div className="text-5xl mb-2">💀</div>
                        )}
                        <h2 className="text-3xl font-black italic uppercase text-white">
                            {gameWon ? 'Based Win' : 'Game Over'}
                        </h2>
                    </div>

                    <div className="bg-[#111] border border-[#222] p-4 rounded-lg w-full mb-6">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-widest block mb-1">Final Score</span>
                        <span className="text-4xl font-mono font-bold text-[#0052FF]">{score}</span>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={startNewGame}
                            className="w-full py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors rounded"
                        >
                            Try Again
                        </button>

                        {walletAddress ? (
                            txHash ? (
                                <a 
                                    href={`https://basescan.org/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-[#165a36] text-white font-bold uppercase tracking-wider hover:bg-[#1b6e41] rounded flex items-center justify-center gap-2"
                                >
                                    View Onchain <ExternalLinkIcon />
                                </a>
                            ) : (
                                <button 
                                    onClick={mintScore}
                                    disabled={isVerifying}
                                    className="w-full py-3 bg-[#0052FF] text-white font-bold uppercase tracking-wider hover:bg-[#004ad9] rounded shadow-[0_0_20px_rgba(0,82,255,0.4)]"
                                >
                                    {isVerifying ? 'Minting...' : 'Mint High Score'}
                                </button>
                            )
                        ) : (
                            <button className="w-full py-3 bg-[#111] border border-[#333] text-gray-500 font-bold uppercase tracking-wider rounded cursor-not-allowed">
                                Connect Wallet to Mint
                            </button>
                        )}
                        
                        <button onClick={handleShare} className="mt-2 text-xs text-gray-500 hover:text-white underline">
                            Share on X
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col items-center justify-center mt-auto gap-1">
             <div className="text-center text-[10px] text-gray-600 font-mono">
                BASE 2048 • ONCHAIN SUMMER
             </div>
             {/* Builder Code Display */}
             <div className="text-[9px] text-[#0052FF] font-mono tracking-widest bg-blue-900/10 px-2 py-0.5 rounded border border-blue-900/20">
                BUILDER CODE: bc_6ig77dw9
             </div>
        </div>
      </div>

      <Ticker />
      
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        userScore={bestScore}
        walletAddress={walletAddress}
      />
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
