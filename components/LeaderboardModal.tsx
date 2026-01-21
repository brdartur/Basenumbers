import React, { useMemo, useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { CONTRACT_ADDRESS, fetchChainLeaderboard, ChainLeader } from '../services/smartContract';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userScore: number;
  walletAddress: string | null;
}

// Fallback mocks only used if contract address is missing or fetch fails
const MOCK_LEADERS = [
  { address: '0x32Be...4491', name: 'Jesse.base', score: 52000, verified: true },
  { address: '0x71C7...90A2', name: 'BaseGod', score: 48500, verified: true },
  { address: '0xA420...6969', name: 'Toshi_Fan', score: 32400, verified: true },
  { address: '0xB1C4...2291', name: 'CryptoPunt', score: 28000, verified: false },
  { address: '0x8888...8888', name: 'Whale.eth', score: 25000, verified: true },
];

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, userScore, walletAddress }) => {
  const [leaders, setLeaders] = useState<any[]>(MOCK_LEADERS);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
        if (!CONTRACT_ADDRESS || !window.ethereum) return;
        
        setIsLoading(true);
        try {
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
            setLeaders([]); 
            loadData();
        } else {
            setLeaders(MOCK_LEADERS);
        }
    }

    return () => { isMounted = false; };
  }, [isOpen, walletAddress]);

  // Handle Ranks based on the fetched (already sorted) data
  const { userRankData, topLeaderboard } = useMemo(() => {
    let allPlayers = [...leaders];
    
    // Check if current user is in the fetched list
    const existingUserIndex = walletAddress 
        ? allPlayers.findIndex(p => p.address.toLowerCase() === walletAddress.toLowerCase())
        : -1;

    let userEntry;

    if (existingUserIndex >= 0) {
        // User is found in chain data
        const player = allPlayers[existingUserIndex];
        // If current local score is higher than chain score, show local score optimistically
        if (userScore > player.score) {
            player.score = userScore;
        }
        player.isUser = true;
        userEntry = { ...player, rank: existingUserIndex + 1 };
    } else {
        // User not in top list yet
        userEntry = {
            address: walletAddress || 'You',
            name: walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'You',
            score: userScore,
            verified: false,
            isUser: true,
            rank: '-'
        };
        // We don't push them to the main list if they aren't in the top, 
        // we just show them in the pinned "You" section.
    }

    // Since `fetchChainLeaderboard` already sorts descending, we just take the top 50
    const topList = allPlayers.slice(0, 50);

    return {
        userRankData: userEntry,
        topLeaderboard: topList
    };
  }, [userScore, walletAddress, leaders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-fade-in-up flex flex-col max-h-[85vh]"
        style={{ backgroundColor: COLORS.surface, border: '1px solid #2B303B' }}
      >
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-gray-800 bg-[#15171C] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            {CONTRACT_ADDRESS && (
               <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full border border-blue-700 flex items-center gap-1">
                 {isLoading ? 'Loading...' : 'Base Mainnet'}
               </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 px-4 py-2 text-xs text-gray-500 uppercase font-semibold bg-[#15171C]/50 shrink-0">
          <div className="col-span-2">Rank</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-4 text-right">Score</div>
        </div>

        {/* PINNED USER ROW (Your Rank) */}
        <div className="bg-[#0052FF]/10 border-b border-[#0052FF]/20 shrink-0 relative overflow-hidden">
           {/* Active Indicator Line */}
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0052FF]" />
           
           <div className="grid grid-cols-12 px-4 py-4 items-center">
              <div className="col-span-2">
                <span className="font-bold text-blue-400 text-lg">
                  {userRankData.rank}
                </span>
              </div>
              <div className="col-span-6 flex flex-col justify-center">
                <span className="font-bold text-white flex items-center gap-2">
                  {userRankData.name} <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-bold tracking-wider">YOU</span>
                </span>
              </div>
              <div className="col-span-4 text-right">
                <span className="font-mono font-bold text-xl text-white tracking-wide">
                  {userRankData.score.toLocaleString()}
                </span>
              </div>
           </div>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="overflow-y-auto custom-scrollbar bg-[#1E2025] flex-grow relative min-h-[200px]">
          {isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
             </div>
          ) : topLeaderboard.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <span className="text-2xl">📉</span>
                <p>No scores yet. Be the first!</p>
             </div>
          ) : (
            <div className="flex flex-col">
                {topLeaderboard.map((player, index) => {
                const rank = index + 1;
                // Since we sorted freshly in smartContract.ts, index+1 is the correct rank
                const isUser = player.address.toLowerCase() === (walletAddress || '').toLowerCase();
                
                let rankDisplay = `#${rank}`;
                let rankColor = "text-gray-400 font-bold";
                
                if (rank === 1) { rankDisplay = '🥇'; rankColor = "text-yellow-400 text-lg"; }
                if (rank === 2) { rankDisplay = '🥈'; rankColor = "text-gray-300 text-lg"; }
                if (rank === 3) { rankDisplay = '🥉'; rankColor = "text-orange-400 text-lg"; }

                return (
                    <div 
                    key={`${player.address}-${index}`} 
                    className={`
                        grid grid-cols-12 px-4 py-3 items-center border-b border-gray-800/50
                        transition-colors
                        ${isUser ? 'bg-blue-900/10' : 'hover:bg-white/5'}
                    `}
                    >
                    <div className="col-span-2">
                        <span className={rankColor}>{rankDisplay}</span>
                    </div>
                    <div className="col-span-6">
                        <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className={`font-medium ${isUser ? 'text-blue-400' : 'text-gray-200'}`}>
                            {player.name}
                            </span>
                            {player.verified && (
                            <svg className="text-blue-500 w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            )}
                        </div>
                        </div>
                    </div>
                    <div className="col-span-4 text-right">
                        <span className={`font-mono font-bold tracking-wide ${isUser ? 'text-white' : 'text-gray-400'}`}>
                        {player.score.toLocaleString()}
                        </span>
                    </div>
                    </div>
                );
                })}
            </div>
          )}
          
          <div className="p-4 text-center text-[10px] text-gray-600">
             {CONTRACT_ADDRESS ? "Live Blockchain Data (Base)" : "Demo Mode"}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #15171C; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LeaderboardModal;
