
import { ethers } from 'ethers';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
export const CONTRACT_ADDRESS = "0xFF1b843175b4C820D06D79EbCa23fDE06bDF9841"; 

// ⚠️ ПОСЛЕ ДЕПЛОЯ НОВОГО КОНТРАКТА Base2048Badges.sol ВСТАВЬ ЕГО АДРЕС СЮДА ⚠️
export const NFT_CONTRACT_ADDRESS = "0x508bF1F8b412a215c1695887D5cA76bdc8C43b20"; 

// ABI for Leaderboard - Added checkIn
const LEADERBOARD_ABI = [
  "function submitScore(uint256 score)",
  "function bestScores(address) view returns (uint256)",
  "function getLeaderboardView(address player) view returns (tuple(address wallet, uint256 score, uint256 timestamp)[])",
  "function checkIn()"
];

// ABI for Badges (NFT)
const NFT_ABI = [
    "function mintBadge(uint256 id)",
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
    "function setURI(string newuri)",
    "function setBaseURI(string baseURI)"
];

export const CONTRACT_INTERFACE = new ethers.Interface(LEADERBOARD_ABI);
export const NFT_INTERFACE = new ethers.Interface(NFT_ABI);

export interface ChainLeader {
  address: string;
  name: string;
  score: number;
  timestamp: number;
  verified: boolean;
}

// ------------------------------------------------------------------
// LEADERBOARD & GAME FUNCTIONS
// ------------------------------------------------------------------

export const encodeSubmitScore = (score: number): string => {
  return CONTRACT_INTERFACE.encodeFunctionData("submitScore", [score]);
};

export const fetchCurrentOnChainScore = async (ethereum: any, address: string): Promise<number> => {
    if (!CONTRACT_ADDRESS || !address) return 0;
    try {
        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LEADERBOARD_ABI, provider);
        const scoreBigInt = await contract.bestScores(address);
        return Number(scoreBigInt);
    } catch (e) {
        console.warn("Failed to fetch best score:", e);
        return 0;
    }
};

export const executeCheckIn = async (ethereum: any) => {
    if (!CONTRACT_ADDRESS) throw new Error("Contract not configured");
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, LEADERBOARD_ABI, signer);
    return await contract.checkIn();
};

export const fetchChainLeaderboard = async (ethereum: any, userAddress?: string): Promise<ChainLeader[]> => {
    if (!CONTRACT_ADDRESS) return [];
    try {
        const targetAddr = userAddress || "0x0000000000000000000000000000000000000000";
        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LEADERBOARD_ABI, provider);
        const rawData = await contract.getLeaderboardView(targetAddr);
        
        const rawLeaders: ChainLeader[] = rawData.map((item: any) => ({
            address: item.wallet,
            name: `${item.wallet.substring(0, 6)}...${item.wallet.substring(38)}`,
            score: Number(item.score),
            timestamp: Number(item.timestamp),
            verified: true
        }));

        const uniqueLeadersMap = new Map<string, ChainLeader>();
        rawLeaders.forEach(leader => {
            const addrLower = leader.address.toLowerCase();
            if (addrLower === "0x0000000000000000000000000000000000000000" && leader.score === 0) return;
            if (!uniqueLeadersMap.has(addrLower)) {
                uniqueLeadersMap.set(addrLower, leader);
            } else {
                const existing = uniqueLeadersMap.get(addrLower)!;
                if (leader.score > existing.score) {
                    uniqueLeadersMap.set(addrLower, leader);
                }
            }
        });

        const filtered = Array.from(uniqueLeadersMap.values());
        filtered.sort((a, b) => b.score - a.score);
        return filtered;
    } catch (e) {
        console.error("Failed to fetch chain leaderboard", e);
        return [];
    }
};

// ------------------------------------------------------------------
// NFT FUNCTIONS
// ------------------------------------------------------------------

export const checkBadgeBalances = async (ethereum: any, address: string, badgeIds: number[]): Promise<boolean[]> => {
    if (!NFT_CONTRACT_ADDRESS || NFT_CONTRACT_ADDRESS.includes("PLACEHOLDER") || !address) {
        return badgeIds.map(() => false);
    }
    try {
        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
        const accounts = badgeIds.map(() => address);
        const balances: bigint[] = await contract.balanceOfBatch(accounts, badgeIds);
        return balances.map(b => b > 0n);
    } catch (e) {
        console.error("Failed to check badge balances", e);
        return badgeIds.map(() => false);
    }
};

export const mintBadgeAction = async (ethereum: any, address: string, badgeId: number) => {
    if (!NFT_CONTRACT_ADDRESS) throw new Error("Contract not configured");
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
    return await contract.mintBadge(badgeId);
};

export const setContractURI = async (ethereum: any, newUri: string) => {
    if (!NFT_CONTRACT_ADDRESS) throw new Error("Contract not configured");
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
    try {
        return await contract.setURI(newUri);
    } catch (e) {
        return await contract.setBaseURI(newUri);
    }
};
