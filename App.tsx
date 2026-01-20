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
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6"></path><path d="M21.5 22v-6h-6"></path><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path></svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

const SoundOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);

const SoundOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);

const VibrateOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18"></path><path d="M18 3v18"></path><path d="M12 7v10"></path></svg>
);

const VibrateOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18"></path><path d="M18 3v18"></path><path d="M2 2l20 20"></path></svg>
);

const BaseLogo = () => (
  <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="base-logo-mask">
      <circle cx="50" cy="50" r="50" fill="white"/>
    </mask>
    <circle cx="50" cy="50" r="50" fill="#0052FF"/>
    <rect x="-10" y="42" width="75" height="16" fill="white" mask="url(#base-logo-mask)"/>
  </svg>
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
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

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
    const savedHaptics = localStorage.getItem('base2048-haptics');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    if (savedHaptics !== null) setHapticsEnabled(savedHaptics === 'true');

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

  const toggleHaptics = () => {
    const newState = !hapticsEnabled;
    setHapticsEnabled(newState);
    localStorage.setItem('base2048-haptics', String(newState));
    if (newState) triggerHaptic('light'); // Feedback when turning on
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
      // Feedback: Haptics & Audio (Conditional)
      if (result.score > 0) {
        if (soundEnabled) playMergeSound();
        if (hapticsEnabled) triggerHaptic('medium');
      } else {
        if (soundEnabled) playMoveSound();
        if (hapticsEnabled) triggerHaptic('light');
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
        if (hapticsEnabled) triggerHaptic('success');
      }

      if (checkGameOver(newGrid)) {
        setGameOver(true);
        if (soundEnabled) playGameOverSound();
        if (hapticsEnabled) triggerHaptic('heavy');
      }
    }
  }, [grid, score, bestScore, gameOver, gameWon, showLeaderboard, soundEnabled, hapticsEnabled]);

  // Wallet Features
  const signScore = async () => {
    if (!walletAddress || !window.ethereum) return;
    setIsVerifying(true);
    try {
      const message = `I verify my score of ${score} in Base 2048. Address: ${walletAddress}`;
      const encodedMessage = `0x${Array.from(message).map(c => c.charCodeAt(0).toString(16)).join('')}`;
      
      await window.ethereum.request({
        method: 'personal_sign',
        params: [encodedMessage, walletAddress],
      });
      alert("Success! Score verified via signature.");
    } catch (error) {
      console.error("Signature failed", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const mintScore = async () => {
    if (!walletAddress || !window.ethereum) return;
    setIsVerifying(true);
    setTxHash(null);
    
    let hash = null;
    const scoreData = encodeSubmitScore(bestScore);

    try {
      // STRATEGY: Try Main Contract first -> If fail, Fallback to Self-Send
      
      if (CONTRACT_ADDRESS) {
        try {
          console.log("Attempting to send to contract:", CONTRACT_ADDRESS);
          hash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: CONTRACT_ADDRESS,
              from: walletAddress,
              data: scoreData,
            }],
          });
        } catch (contractError: any) {
          console.warn("Contract transaction failed (likely revert or wrong network). Falling back to self-send.", contractError);
          // If the user rejected the specific contract tx, they likely won't want the fallback either,
          // but usually error 4001 is user rejection. If it's another error (RPC error), we fallback.
          if (contractError?.code === 4001) {
            throw contractError; // Rethrow if user explicitly rejected
          }
          
          // FALLBACK: Send 0 ETH to self with data
          hash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              to: walletAddress, // Send to self
              from: walletAddress,
              value: '0x0',
              data: scoreData, // Embed score in data
            }],
          });
        }
      } else {
        // No contract address configured -> Direct Self Send
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
      let msg = "Transaction failed.";
      if (error?.code === 4001) {
         msg = "Transaction rejected by user.";
      }
      alert(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleShare = () => {
    const targetScore = bestScore;
    let badgeName = "Explorer";
    let badgeEmoji = "🌱";

    const unlockedBadge = [...BADGE_LEVELS].reverse().find(b => targetScore >= b.score);
    
    if (unlockedBadge) {
      badgeName = unlockedBadge.label;
      if (unlockedBadge.id === 1) badgeEmoji = "🛡️";
      if (unlockedBadge.id === 2) badgeEmoji = "⚔️";
      if (unlockedBadge.id === 3) badgeEmoji = "👑";
      if (unlockedBadge.id === 4) badgeEmoji = "🔵";
    }

    const line1 = `🟦 Base 2048 Report`;
    const line2 = `🏆 Best Score: ${targetScore}`;
    const line3 = `🎖 Rank: ${badgeName} ${badgeEmoji}`;
    const line4 = `Building on Base!`;
    
    const text = `${line1}\n\n${line2}\n${line3}\n\n${line4}`;
    const url = window.location.href;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=Base,Base2048,BuildOnBase`;
    
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
        if (dx > 0) executeMove('RIGHT');
        else executeMove('LEFT');
      }
    } else {
      if (Math.abs(dy) > 30) {
        if (dy > 0) executeMove('DOWN');
        else executeMove('UP');
      }
    }
    touchStart.current = null;
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decoration / Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" style={{ background: COLORS.primary }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[100px]" style={{ background: '#FFFFFF' }} />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BaseLogo />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <h1 className="font-bold text-3xl leading-none text-white tracking-tight">Base</h1>
                <span className="font-bold text-3xl leading-none" style={{ color: COLORS.primary }}>2048</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-0.5">Network Edition</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#2B303B] flex flex-col items-center min-w-[70px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Score</span>
              <span className="font-bold text-lg leading-tight">{score}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#2B303B] flex flex-col items-center min-w-[70px]">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Best</span>
              <span className="font-bold text-lg leading-tight">{bestScore}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
             <button 
              onClick={startNewGame}
              className="flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors hover:bg-[#2B303B]"
              style={{ color: COLORS.primary }}
              title="New Game"
             >
               <RestartIcon />
             </button>

             <button 
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors hover:bg-[#2B303B]"
              style={{ color: '#FFD700' }}
              title="Leaderboard"
             >
               <TrophyIcon />
             </button>
             
             {/* Sound Toggle */}
             <button 
              onClick={toggleSound}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors hover:bg-[#2B303B] ${!soundEnabled ? 'text-gray-500' : 'text-gray-200'}`}
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
             >
               {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
             </button>

             {/* Haptic Toggle */}
             <button 
              onClick={toggleHaptics}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors hover:bg-[#2B303B] ${!hapticsEnabled ? 'text-gray-500' : 'text-gray-200'}`}
              title={hapticsEnabled ? "Disable Vibration" : "Enable Vibration"}
             >
               {hapticsEnabled ? <VibrateOnIcon /> : <VibrateOffIcon />}
             </button>
          </div>
          
          {/* Wallet Connection */}
          <WalletConnect 
            onConnect={setWalletAddress}
            onDisconnect={() => setWalletAddress(null)}
          />
        </div>

        {/* Badges System - VISUAL ONLY */}
        <div className="mb-2">
          <AchievementBadges score={bestScore} />
        </div>

        {/* Board Container */}
        <div className="relative">
          <Board grid={grid} />
          
          {/* Game Over / Win Overlay */}
          {(gameOver || (gameWon && !grid.flat().includes(0) && !checkGameOver(grid))) && (
            <div className="absolute inset-0 bg-[#0F1115]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl animate-fade-in p-6 text-center">
              <h2 className="text-4xl font-extrabold mb-2">{gameWon ? 'You Win!' : 'Game Over'}</h2>
              <p className="text-gray-400 mb-6">Final Score: {score}</p>
              
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                {/* 1. Try Again */}
                <button 
                  onClick={startNewGame}
                  className="w-full px-6 py-3 rounded-full font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/50"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Try Again
                </button>

                {/* 2. Web3 Actions */}
                {walletAddress ? (
                  <>
                    {txHash ? (
                      <a 
                        href={`https://basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-3 rounded-full font-bold text-sm bg-[#165a36] text-white hover:bg-[#1b6e41] transition-colors flex items-center justify-center gap-2 animate-fade-in"
                      >
                         <CheckIcon />
                         View on Basescan <ExternalLinkIcon />
                      </a>
                    ) : (
                      <button 
                        onClick={mintScore}
                        disabled={isVerifying}
                        className="w-full px-4 py-3 rounded-full font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        {isVerifying ? 'Processing...' : '🏆 Mint Score (Start TX)'}
                      </button>
                    )}
                    
                    {!txHash && (
                      <button 
                        onClick={signScore}
                        disabled={isVerifying}
                        className="w-full px-4 py-2 rounded-full font-bold text-xs text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-700"
                      >
                        Verify via Signature (Free)
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">Connect wallet to submit score</div>
                )}

                {/* Share Button (Moved here for better UX on Game Over) */}
                <button
                  onClick={handleShare}
                  className="w-full px-4 py-2 rounded-full font-bold text-xs text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Share Score on X
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Join the numbers and get to the <span className="text-blue-400 font-bold">2048</span> tile!</p>
          <p className="mt-2 text-xs opacity-60">
            Swipe (Mobile) or use Arrow Keys (Desktop)
          </p>
        </div>
      </div>
      
      {/* Leaderboard Modal */}
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        userScore={bestScore}
        walletAddress={walletAddress}
      />
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
