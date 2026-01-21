import React, { useEffect, useState } from 'react';
import { BADGE_LEVELS } from '../constants';
import { checkBadgeBalances, mintBadgeAction, NFT_CONTRACT_ADDRESS, fetchCurrentOnChainScore } from '../services/smartContract';
import { playWinSound, triggerHaptic } from '../services/audio';

interface AchievementBadgesProps {
  score: number;
  walletAddress?: string | null;
}

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
      <div className="grid grid-cols-5 gap-3 px-2 w-full">
        {BADGE_LEVELS.map((badge, index) => {
          const unlocked = score >= badge.score;
          const isMinted = mintedBadges[index];
          const canMint = unlocked && !isMinted;
          const loading = isMinting === badge.id;
          
          return (
            <div 
              key={badge.id} 
              className={`flex flex-col items-center justify-start relative group transition-all duration-300 ${unlocked ? 'opacity-100' : 'opacity-40 grayscale blur-[0.5px]'}`}
            >
              <div 
                className={`
                    relative z-10 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center
                    transition-transform duration-300
                    ${isMinted ? 'scale-110' : 'hover:scale-105'}
                `}
              >
                  {/* Use local SVG assets */}
                  <img 
                    src={`/badges/${badge.id}.svg`} 
                    alt={badge.label}
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                  
                  {/* Owned checkmark */}
                  {isMinted && (
                    <div className="absolute -top-1 -right-1 bg-[#0052FF] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-[#0F1115] shadow-lg z-20">
                        ✓
                    </div>
                  )}
              </div>
              
              <div className="text-center flex flex-col items-center mt-2 w-full gap-0.5">
                <span className={`text-[9px] font-black uppercase tracking-wider block w-full ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                  {badge.label}
                </span>
                
                {/* Mint Button / Score Display */}
                {canMint && walletAddress ? (
                   <button 
                      onClick={() => handleMint(badge.id, badge.score)}
                      disabled={loading}
                      className="mt-1 bg-[#0052FF] hover:bg-blue-600 text-white text-[8px] font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(0,82,255,0.5)] animate-pulse active:scale-95 transition-transform"
                   >
                     {loading ? '...' : 'MINT'}
                   </button>
                ) : (
                    <span className="text-[8px] text-gray-500 font-mono block">
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
