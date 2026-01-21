import React, { useEffect, useState } from 'react';
import { BADGE_LEVELS } from '../constants';
import { checkBadgeBalances, mintBadgeAction, NFT_CONTRACT_ADDRESS, fetchCurrentOnChainScore } from '../services/smartContract';
import { playWinSound, triggerHaptic } from '../services/audio';

interface AchievementBadgesProps {
  score: number;
  walletAddress?: string | null;
}

// SVG Components for each badge level
const BadgeIcon = ({ level, color, locked }: { level: number; color: string; locked: boolean }) => {
  const fill = color;
  const stroke = 'white';
  
  if (level === 1) { // Based
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M12 2L3 7V12C3 17.52 6.92 22.74 12 24C17.08 22.74 21 17.52 21 12V7L12 2Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  
  if (level === 2) { // Builder
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (level === 3) { // Superchain
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M2 4L12 2L22 4V10C22 10 22 18 12 22C2 18 2 10 2 10V4Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 12L12 9L15 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (level === 4) { // Legend
    return (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
        <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.3"/>
      </svg>
    );
  }

  if (level === 5) { // Giga Brain
    return (
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" fill={fill}/>
          <path d="M2 17L12 22L22 17" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
    );
  }

  return null;
};

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ score, walletAddress }) => {
  const [mintedBadges, setMintedBadges] = useState<boolean[]>(new Array(BADGE_LEVELS.length).fill(false));
  const [isMinting, setIsMinting] = useState<number | null>(null);
  const [onChainScore, setOnChainScore] = useState(0);

  // Check balances when wallet connects
  useEffect(() => {
    const checkBalances = async () => {
        if (!walletAddress || !window.ethereum) return;
        
        // 1. Get On-Chain Score (Source of Truth for Minting)
        const chainScore = await fetchCurrentOnChainScore(window.ethereum, walletAddress);
        setOnChainScore(chainScore);

        // 2. Check NFT Balances
        if (NFT_CONTRACT_ADDRESS && !NFT_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
            const ids = BADGE_LEVELS.map(b => b.id);
            const balances = await checkBadgeBalances(window.ethereum, walletAddress, ids);
            setMintedBadges(balances);
        }
    };
    checkBalances();
  }, [walletAddress, score]); // Re-check when local score changes (though on-chain needs minting first)

  const handleMint = async (badgeId: number, badgeScore: number) => {
    if (!walletAddress) {
        alert("Connect wallet to mint badges!");
        return;
    }

    if (onChainScore < badgeScore) {
        alert(`Your score on the blockchain is ${onChainScore}. You need ${badgeScore} to mint this NFT.\n\nPlease click 'MINT HIGH SCORE' in the game over screen (or restart the game) to save your current score to the blockchain first!`);
        return;
    }

    if (!NFT_CONTRACT_ADDRESS || NFT_CONTRACT_ADDRESS.includes("PLACEHOLDER")) {
        alert("NFT Contract not configured yet.");
        return;
    }

    try {
        setIsMinting(badgeId);
        const tx = await mintBadgeAction(window.ethereum, walletAddress, badgeId);
        await tx.wait(); // Wait for confirmation
        
        playWinSound();
        triggerHaptic('success');
        
        // Optimistic update
        const newMinted = [...mintedBadges];
        const index = BADGE_LEVELS.findIndex(b => b.id === badgeId);
        if (index !== -1) newMinted[index] = true;
        setMintedBadges(newMinted);

    } catch (e: any) {
        console.error("Mint failed", e);
        // Only alert if it's not a user rejection
        if (e?.code !== 4001) {
             alert("Minting failed. Check if you already own this badge or have sufficient gas.");
        }
    } finally {
        setIsMinting(null);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-2 px-3 w-full">
        {BADGE_LEVELS.map((badge, index) => {
          const unlocked = score >= badge.score;
          const isMinted = mintedBadges[index];
          const canMint = unlocked && !isMinted;
          const loading = isMinting === badge.id;
          
          return (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center justify-start relative group transition-opacity duration-300 ${unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}
            >
              <div 
                className={`
                    relative z-10 w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300
                    ${isMinted ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)] border-white/40' : ''}
                `}
                style={{ 
                  backgroundColor: unlocked ? `${badge.color}20` : `${badge.color}10`,
                  borderColor: isMinted ? '#00FF00' : (unlocked ? badge.color : `${badge.color}40`),
                }}
              >
                  <BadgeIcon level={badge.id} color={badge.color} locked={!unlocked} />
                  
                  {/* Owned checkmark */}
                  {isMinted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-black rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-bold border border-black shadow-sm">
                        ✓
                    </div>
                  )}
              </div>
              
              <div className="text-center flex flex-col items-center mt-1 w-full gap-0.5">
                <span className={`text-[8px] font-bold block truncate w-full ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                  {badge.label}
                </span>
                
                {/* Mint Button / Score Display */}
                {canMint && walletAddress ? (
                   <button 
                      onClick={() => handleMint(badge.id, badge.score)}
                      disabled={loading}
                      className="mt-1 bg-[#0052FF] hover:bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-lg shadow-blue-500/30 animate-pulse active:scale-95 transition-transform"
                   >
                     {loading ? '...' : 'MINT'}
                   </button>
                ) : (
                    <span className="text-[7px] text-gray-500 font-mono block leading-tight">
                        {badge.score >= 1000 ? (badge.score / 1000) + 'k' : badge.score}
                    </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementBadges;
