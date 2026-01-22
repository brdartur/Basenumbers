
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, GameState, Direction } from './types';
import { getEmptyGrid, addRandomTile, move, checkGameOver, hasWon } from './services/gameLogic';
import Board from './components/Board';
import AchievementBadges from './components/AchievementBadges';
import WalletConnect from './components/WalletConnect';
import LeaderboardModal from './components/LeaderboardModal';
import { COLORS, BADGE_LEVELS } from './constants';
import { CONTRACT_ADDRESS, encodeSubmitScore, setContractURI, NFT_CONTRACT_ADDRESS, fetchCurrentOnChainScore } from './services/smartContract';
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

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
);

const BaseLogo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="20" fill="#0052FF"/>
    <path d="M20 50h60" stroke="white" strokeWidth="16" strokeLinecap="round" transform="translate(10, 0)" />
  </svg>
);

const Ticker = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#0052FF]/90 backdrop-blur-md text-white py-2 overflow-hidden z-40 border-t border-blue-400/50 shadow-[0_-5px_20px_rgba(0,82,255,0.3)]">
    <div className="whitespace-nowrap animate-ticker flex font-bold tracking-widest text-xs uppercase">
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Based 2048</span> •
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Based 2048</span> •
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Based 2048</span> •
      <span className="mx-4">Build on Base</span> • 
      <span className="mx-4">Stay Based</span> • 
      <span className="mx-4">Mint Your Score</span> • 
      <span className="mx-4">Based 2048</span>
    </div>
  </div>
);

// --- THEME DEFINITIONS ---
type Theme = 'classic' | 'sapphire' | 'grid' | 'aurora';

const THEMES: { id: Theme; name: string; previewColor: string }[] = [
  { id: 'classic', name: 'Midnight', previewColor: '#0052FF' },
  { id: 'sapphire', name: 'Sapphire', previewColor: '#1E40AF' },
  { id: 'grid', name: 'Cyber Grid', previewColor: '#333333' },
  { id: 'aurora', name: 'Aurora', previewColor: '#10B981' }
];

// --- BACKGROUND COMPONENT ---
const Background = ({ theme }: { theme: Theme }) => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none transition-all duration-700">
    {/* Base Layer */}
    <div className="absolute inset-0 bg-[#050505]" />
    
    {/* --- CLASSIC THEME (Default) --- */}
    <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'classic' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] opacity-20 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#0038A8] opacity-15 blur-[120px] rounded-full animate-float-reverse" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#00D2FF] opacity-10 blur-[80px] rounded-full animate-pulse-glow" />
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
    </div>

    {/* --- SAPPHIRE THEME (Deep Blue) --- */}
    <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'sapphire' ? 'opacity-100' : 'opacity-0'}`}
         style={{ background: 'radial-gradient(circle at 50% -20%, #001E45 0%, #020408 80%)' }}>
        <div className="absolute top-[0%] left-[10%] w-[80%] h-[40%] bg-[#0052FF] opacity-10 blur-[100px] rounded-full" />
    </div>

    {/* --- GRID THEME (Cyber) --- */}
    <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'grid' ? 'opacity-100' : 'opacity-0'}`}
         style={{ backgroundColor: '#0A0C10' }}>
         {/* Sharp Grid Lines */}
         <div className="absolute inset-0" style={{ 
             backgroundImage: 'linear-gradient(#1F2937 1px, transparent 1px), linear-gradient(90deg, #1F2937 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             opacity: 0.2
         }} />
         <div className="absolute inset-0 bg-radial-vignette opacity-80" />
    </div>

    {/* --- AURORA THEME (Green/Teal) --- */}
    <div className={`absolute inset-0 transition-opacity duration-700 ${theme === 'aurora' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#10B981] opacity-15 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[0%] left-[-10%] w-[50%] h-[50%] bg-[#059669] opacity-10 blur-[100px] rounded-full" />
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-[#34D399] opacity-05 blur-[80px] rounded-full animate-pulse-glow" />
    </div>

    {/* Vignette Overlay for all themes */}
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
  
  // Settings State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [theme, setTheme] = useState<Theme>('classic');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  
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

    const savedTheme = localStorage.getItem('base2048-theme');
    if (savedTheme && ['classic', 'sapphire', 'grid', 'aurora'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
    }

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

  // Sync Best Score from Blockchain when Wallet Connects
  useEffect(() => {
    const syncOnChainScore = async () => {
        if (walletAddress && window.ethereum) {
            try {
                // Fetch the immutable score from the smart contract
                const chainScore = await fetchCurrentOnChainScore(window.ethereum, walletAddress);
                
                // If the blockchain score is higher than what we have locally (e.g. user cleared cookies), restore it
                if (chainScore > bestScore) {
                    console.log(`Restoring Best Score from chain: ${chainScore}`);
                    setBestScore(chainScore);
                    localStorage.setItem('base2048-best', chainScore.toString());
                }
            } catch (e) {
                console.warn("Could not sync score from chain", e);
            }
        }
    };
    syncOnChainScore();
  }, [walletAddress, bestScore]);

  // Save Settings when changed
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('base2048-sound', String(newState));
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('base2048-theme', newTheme);
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
    
    try {
      const scoreData = encodeSubmitScore(bestScore);
      let hash = null;

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
          console.warn("Retrying with value fallback...");
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
      } 

      if (hash) {
        setTxHash(hash);
        if (soundEnabled) playWinSound();
        setTimeout(() => setShowLeaderboard(true), 2000);
      }
      
    } catch (error: any) {
      console.error("Transaction failed", error);
      if (error?.code !== 4001) {
        alert("Transaction failed. Please ensure you are on Base Mainnet.");
      }
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
      <Background theme={theme} />

      {/* Main Container */}
      <div className="w-full max-w-[360px] z-10 flex flex-col h-full justify-between pb-12">
        
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 mb-2">
            {/* Nav Row */}
            <div className="flex justify-between items-center backdrop-blur-sm bg-black/20 p-2 rounded-xl border border-white/5 relative z-50">
                <div className="flex items-center gap-2">
                    <BaseLogo />
                    <span className="font-black text-xl tracking-tight italic text-white drop-shadow-[0_0_10px_rgba(0,82,255,0.5)]">
                      Base <span className="text-[#0052FF]">2048</span>
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    {/* Theme Toggle Button */}
                    <button 
                        onClick={() => setShowThemeSelector(!showThemeSelector)} 
                        className={`p-2 transition-colors hover:bg-white/5 rounded-full ${showThemeSelector ? 'text-white bg-white/10' : 'text-gray-400'}`}
                    >
                        <PaletteIcon />
                    </button>

                    <button onClick={toggleSound} className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                        {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <WalletConnect 
                        onConnect={setWalletAddress}
                        onDisconnect={() => setWalletAddress(null)}
                    />
                </div>
                
                {/* --- THEME SELECTOR DROPDOWN --- */}
                {showThemeSelector && (
                    <div className="absolute top-full right-0 mt-2 bg-[#0F1115] border border-[#222] p-2 rounded-xl shadow-2xl flex gap-2 animate-fade-in z-[60]">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => changeTheme(t.id)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${theme === t.id ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-80'}`}
                                style={{ background: t.previewColor }}
                                title={t.name}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Score Row */}
            <div className="flex justify-between items-end gap-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 ml-1">Current</span>
                    <div className="bg-[#111111]/80 backdrop-blur-md border border-[#333] px-3 py-2 rounded-lg min-w-[80px] shadow-lg">
                        <span className="text-xl font-mono font-bold text-white">{score}</span>
                    </div>
                 </div>

                 <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 ml-1">Best</span>
                    <div className="bg-[#111111]/80 backdrop-blur-md border border-[#333] px-3 py-2 rounded-lg min-w-[80px] shadow-lg">
                        <span className="text-xl font-mono font-bold text-white">{bestScore}</span>
                    </div>
                 </div>

                 <div className="flex gap-2 ml-auto">
                    <button 
                        onClick={startNewGame}
                        className="bg-[#1A1A1A]/80 hover:bg-[#252525] backdrop-blur-md border border-[#333] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                        title="Reset"
                    >
                        <RestartIcon />
                    </button>
                    <button 
                        onClick={() => setShowLeaderboard(true)}
                        className="bg-[#0052FF] hover:bg-[#004ad9] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,82,255,0.4)] hover:scale-105 active:scale-95"
                        title="Leaderboard"
                    >
                        <TrophyIcon />
                    </button>
                 </div>
            </div>
        </div>

        {/* GAME BOARD AREA */}
        <div className="flex-grow flex flex-col justify-center relative">
          
          <AchievementBadges score={bestScore} walletAddress={walletAddress} />
          
          <div className="mt-3 relative w-full">
             <Board grid={grid} />

             {/* Game Over / Win Modal */}
            {(gameOver || (gameWon && !grid.flat().includes(0) && !checkGameOver(grid))) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 rounded-xl backdrop-blur-xl p-6 text-center animate-fade-in border border-white/10 shadow-2xl">
                    <div className="mb-6 transform scale-110">
                        {gameWon ? (
                            <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        ) : (
                            <div className="text-6xl mb-4">💀</div>
                        )}
                        <h2 className="text-3xl font-black italic uppercase text-white tracking-wider drop-shadow-lg">
                            {gameWon ? 'Based Win' : 'Game Over'}
                        </h2>
                    </div>

                    <div className="bg-[#111]/80 border border-[#222] p-4 rounded-lg w-full mb-6 shadow-inner">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-widest block mb-1">Final Score</span>
                        <span className="text-5xl font-mono font-bold text-[#0052FF] tracking-tighter drop-shadow-[0_0_10px_rgba(0,82,255,0.5)]">{score}</span>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={startNewGame}
                            className="w-full py-3 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors rounded shadow-lg"
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
                                    className="w-full py-3 bg-[#0052FF] text-white font-bold uppercase tracking-wider hover:bg-[#004ad9] rounded shadow-[0_0_20px_rgba(0,82,255,0.4)] relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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

        {/* Footer info - View Collection Removed */}
        <div className="flex flex-col items-center justify-center mt-auto gap-1">
             <div className="text-center text-[10px] text-gray-500 font-mono tracking-widest opacity-60">
                BASE NETWORK 2048
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
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 18s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 8s ease-in-out infinite;
        }
        .bg-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        }
        .bg-radial-vignette {
            background: radial-gradient(circle at center, transparent 0%, #050505 100%);
        }
      `}</style>
    </div>
  );
}
