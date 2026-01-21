import { ethers } from 'ethers';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
export const CONTRACT_ADDRESS = "0xb995bcaD89CE57734111481d1785016555f4e6fa"; // Ваш новый адрес

// Using ethers Interface for reliable encoding/decoding of structs
const ABI = [
  "function submitScore(uint256 score)",
  "function bestScores(address) view returns (uint256)",
  // The new view function that returns [User, ...Others]
  "function getLeaderboardView(address player) view returns (tuple(address wallet, uint256 score, uint256 timestamp)[])"
];

export const CONTRACT_INTERFACE = new ethers.Interface(ABI);

export interface ChainLeader {
  address: string;
  name: string;
  score: number;
  timestamp: number;
  verified: boolean;
}

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

export const encodeSubmitScore = (score: number): string => {
  return CONTRACT_INTERFACE.encodeFunctionData("submitScore", [score]);
};

/**
 * Fetches the current best score for a wallet directly from the blockchain.
 * This is used to prevent "Execution Reverted" errors by checking if the
 * new score is actually higher before sending the transaction.
 */
export const fetchCurrentOnChainScore = async (ethereum: any, address: string): Promise<number> => {
    if (!CONTRACT_ADDRESS || !address) return 0;
    
    try {
        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const scoreBigInt = await contract.bestScores(address);
        return Number(scoreBigInt);
    } catch (e) {
        console.warn("Failed to fetch best score:", e);
        return 0;
    }
};

/**
 * Fetches the leaderboard using the optimized `getLeaderboardView`.
 * Returns a sorted array of leaders.
 */
export const fetchChainLeaderboard = async (ethereum: any, userAddress?: string): Promise<ChainLeader[]> => {
    if (!CONTRACT_ADDRESS) return [];

    try {
        // If no user address is provided, use the zero address just to get the list
        // (The contract requires an address argument)
        const targetAddr = userAddress || "0x0000000000000000000000000000000000000000";
        
        const provider = new ethers.BrowserProvider(ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

        // Call the view function
        const rawData = await contract.getLeaderboardView(targetAddr);
        
        // rawData is an array of structs (Result object in ethers v6)
        // rawData[0] is always the `targetAddr` (the user)
        // rawData[1...] are the other players
        
        // Convert to our format
        const leaders: ChainLeader[] = rawData.map((item: any) => ({
            address: item.wallet,
            name: `${item.wallet.substring(0, 6)}...${item.wallet.substring(38)}`,
            score: Number(item.score),
            timestamp: Number(item.timestamp),
            verified: true
        }));

        // Filter out empty records (score 0 and address 0)
        // Except if it's the specific user checking their own stats
        const filtered = leaders.filter(l => l.score > 0 || l.address !== "0x0000000000000000000000000000000000000000");

        // Client-side Sorting (Descending)
        // We do this here to save Gas on the blockchain
        filtered.sort((a, b) => b.score - a.score);

        return filtered;

    } catch (e) {
        console.error("Failed to fetch chain leaderboard", e);
        return [];
    }
};
