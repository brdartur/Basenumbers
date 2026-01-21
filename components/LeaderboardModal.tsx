import React, { useMemo, useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { CONTRACT_ADDRESS, fetchChainLeaderboard } from '../services/smartContract';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userScore: number;
  walletAddress: string | null;
}

// Fallback mocks
const MOCK_LEADERS = [
  { address: '0x8BDF...F624', name: '0x8BDF...F624', score: 12352, verified: true },
  { address: '0x29F4...Bd6E', name: '0x29F4...Bd6E', score: 11312, verified: true },
  { address: '0x71C7...90A2', name: '0x71C7...90A2', score: 9500, verified: true },
  { address: '0xA420...6969', name: '0xA420...6969', score: 8200, verified: true },
  { address: '0xB1C4...2291', name: '0xB1C4...2291', score: 5000, verified: false },
];

const MedalIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#FFDB4D] to-[#B38F00] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#FFE066]/20">
         <span className="text-[10px] font-black text-[#423400]">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#E0E0E0] to-[#8C8C8C] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-white/20">
         <span className="text-[10px] font-black text-[#333]">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#E69C65] to-[#8D5024] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#FFB888]/20">
         <span className="text-[10px] font-black text-[#3D1F00]">3</span>
      </div>
    );
  }
  return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
};

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, userScore, walletAddress }) => {
  const [leaders, setLeaders] = useState<any[]>(MOCK_LEADERS);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
        if (!CONTRACT_ADDRESS || !window.ethereum) return;
        setIsLoading(true);
        try {
            // Service now handles deduplication
            const chainData = await fetchChainLeaderboard(window.ethereum, walletAddress || undefined);
            if (isMounted && chainData && chainData.length > 0) {
                setLeaders(chainData);
            }
        } catch (e) {
            console.error("Leaderboard load error", e);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    if (isOpen) {
        if (CONTRACT_ADDRESS) {
            // Keep existing data briefly or clear? Let's keep mocks until load
            // setLeaders([]); 
            loadData();
        } else {
            setLeaders(MOCK_LEADERS);
        }
    }
    return () => { isMounted = false; };
  }, [isOpen, walletAddress]);

  const { userRankData, topLeaderboard } = useMemo(() => {
    // 1. Create a safe copy
    let allPlayers = [...leaders];
    
    // 2. Identify User
    // Normalize address check
    const normalizedUserAddr = (walletAddress || '').toLowerCase();
    
    // Check if user is already in the list from DB/Chain
    const existingIndex = allPlayers.findIndex(p => p.address.toLowerCase() === normalizedUserAddr);
    
    if (existingIndex !== -1) {
        // Update user score in the list if local score is higher (optimistic UI)
        if (userScore > allPlayers[existingIndex].score) {
            allPlayers[existingIndex].score = userScore;
            // Re-sort required if score changed
            allPlayers.sort((a, b) => b.score - a.score);
        }
    } else if (walletAddress) {
        // User not in list, add them temporarily for display context if needed,
        // but typically we just want to calculate their theoretical rank.
        // For the "You" pinned row, we create a specific object.
    }

    // Re-calculate user index after potential sort
    const finalUserIndex = walletAddress 
        ? allPlayers.findIndex(p => p.address.toLowerCase() === normalizedUserAddr)
        : -1;

    // Create the "YOU" Data Object
    let userData;
    if (finalUserIndex !== -1) {
        userData = { ...allPlayers[finalUserIndex], rank: finalUserIndex + 1, isUser: true };
    } else {
        // If not in top list, we need to estimate or just show separate
        userData = {
            address: walletAddress || 'Guest',
            name: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Guest',
            score: userScore,
            verified: false,
            rank: '—', // Rank unknown if outside fetched list
            isUser: true
        };
    }

    return {
        userRankData: userData,
        topLeaderboard: allPlayers.slice(0, 50)
    };
  }, [userScore, walletAddress, leaders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0F1115] rounded-3xl overflow-hidden shadow-2xl border border-[#1F2128] flex flex-col max-h-[85vh] animate-pop-in">
        
        {/* Header */}
        <div className="p-6 flex justify-between items-start pb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Leaderboard</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-[#0052FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Base Mainnet</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="col-span-2">Rank</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-4 text-right">Score</div>
        </div>

        {/* User Pinned Row (Blue Style) */}
        <div className="px-4 pb-4">
            <div className="bg-[#001F66] border border-[#0052FF] rounded-xl grid grid-cols-12 items-center px-4 py-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052FF]" />
                
                <div className="col-span-2">
                    <span className="font-black text-white text-lg">{userRankData.rank}</span>
                </div>
                <div className="col-span-6 flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm truncate">
                        {userRankData.name}
                    </span>
                    <span className="bg-[#0052FF] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">YOU</span>
                </div>
                <div className="col-span-4 text-right">
                    <span className="font-bold text-white text-lg font-mono">
                        {userRankData.score.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto custom-scrollbar flex-grow bg-[#0F1115] px-2 pb-4">
           {isLoading ? (
               <div className="flex justify-center py-10">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052FF]"></div>
               </div>
           ) : (
               <div className="flex flex-col gap-1">
                   {topLeaderboard.map((player, idx) => {
                       const rank = idx + 1;
                       const isMe = userRankData.rank === rank && player.address.toLowerCase() === (walletAddress || '').toLowerCase();
                       
                       return (
                           <div 
                                key={`${player.address}_${rank}`}
                                className={`
                                    grid grid-cols-12 items-center px-4 py-3 rounded-xl
                                    ${isMe ? 'bg-[#1A1D24]' : 'hover:bg-[#15171C]'}
                                    transition-colors border border-transparent hover:border-[#2B303B]
                                `}
                           >
                               <div className="col-span-2 flex items-center">
                                   <MedalIcon rank={rank} />
                               </div>
                               <div className="col-span-6 flex items-center gap-1.5 overflow-hidden">
                                   <span className={`font-bold text-sm font-mono truncate ${isMe ? 'text-[#0052FF]' : 'text-[#8BA0B0]'}`}>
                                       {player.name}
                                   </span>
                                   {player.verified && (
                                     <svg className="w-3 h-3 text-[#0052FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                   )}
                               </div>
                               <div className="col-span-4 text-right">
                                   <span className="font-bold text-white text-sm font-mono tracking-wide">
                                       {player.score.toLocaleString()}
                                   </span>
                               </div>
                           </div>
                       );
                   })}
               </div>
           )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        @keyframes pop-in {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in { animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default LeaderboardModal;
