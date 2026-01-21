
import React, { useEffect, useState } from 'react';
import { BADGE_LEVELS } from '../constants';
import { checkBadgeBalances, mintBadgeAction, NFT_CONTRACT_ADDRESS, fetchCurrentOnChainScore } from '../services/smartContract';
import { playWinSound, triggerHaptic } from '../services/audio';

// --- INLINE SVG ICONS TO PREVENT BROKEN IMAGES ---
const BadgeIcon = ({ id, color, locked }: { id: number, color: string, locked: boolean }) => {
  const strokeColor = locked ? '#444' : color;
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
       {/* Background Circle */}
       <circle cx="256" cy="256" r="240" fill={locked ? '#111' : '#050505'} stroke={strokeColor} strokeWidth="12" />
       
       {/* Inner Glow Circle */}
       {!locked && <circle cx="256" cy="256" r="200" fill={color} fillOpacity="0.1" />}

       {/* Icon Content */}
       <g transform="translate(106, 106) scale(12.5)">
          {/* Badge 1: Shield/Trophy */}
          {id === 1 && (
             <path d="M12 2L3 7V12C3 17.52 6.92 22.74 12 24C17.08 22.74 21 17.52 21 12V7L12 2Z" fill={locked ? '#333' : color} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          )}
          
          {/* Badge 2: Star/Star (Builder) */}
          {id === 2 && (
             <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={locked ? '#333' : color} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          )}

          {/* Badge 3: Superchain Link */}
          {id === 3 && (
             <g>
                <path d="M2 4L12 2L22 4V10C22 10 22 18 12 22C2 18 2 10 2 10V4Z" fill={locked ? '#333' : color} stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 12L12 9L15 12" stroke={locked ? '#555' : '#fff'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </g>
          )}

          {/* Badge 4: Legend / Crown */}
          {id === 4 && (
             <g>
                <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" fill={locked ? '#333' : color} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" fill={locked ? '#555' : 'white'} fillOpacity="0.5"/>
             </g>
          )}

          {/* Badge 5: Giga Brain / Gem */}
          {id === 5 && (
             <g>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" fill={locked ? '#333' : color}/>
                <path d="M2 17L12 22L22 17" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round"/>
             </g>
          )}
       </g>
    </svg>
  );
};


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
  }, [walletAddress, score]); // Re-check when local score changes

  const handleMint = async (badgeId: number, badgeScore: number) => {
    if (!walletAddress) {
        alert("Connect wallet to mint badges!");
        return;
    }

    if (onChainScore < badgeScore) {
        alert(`Your score on the blockchain is ${onChainScore}. You need ${badgeScore} to mint this NFT.\n\nPlease click 'MINT HIGH SCORE' in the game over screen to save your score to the blockchain first!`);
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
          const isMinted = mintedBadges[index];
          // Logic update: Unlocked if score meets requirements OR if user already owns the badge
          const unlocked = score >= badge.score || isMinted;
          
          const canMint = score >= badge.score && !isMinted;
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
                  {/* Inline SVG Replacement */}
                  <BadgeIcon id={badge.id} color={badge.color} locked={!unlocked} />
                  
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
