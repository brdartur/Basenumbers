// Configuration
// ------------------------------------------------------------------
// 1. В REMIX (remix.ethereum.org):
//    - Создай файл `contracts/Base2048Leaderboard.sol`.
//    - Вставь туда код контракта лидерборда.
//    - Скомпилируй (версия компилятора 0.8.20+).
//    - Выбери Environment: "Injected Provider - MetaMask".
//    - Нажми Deploy (убедись, что ты в сети Base или Base Sepolia).
//
// 2. ПОСЛЕ ДЕПЛОЯ:
//    - Скопируй адрес контракта (Deployed Contracts -> Copy Address).
//    - Вставь его в переменную CONTRACT_ADDRESS ниже.
// ------------------------------------------------------------------

// Адрес лидерборда (оставь как есть или замени на свой)
export const CONTRACT_ADDRESS = "0x8Be283140d2a9b3707B2381Da240dAa0D33A57D7"; 

// ABI for Leaderboard (Submit Score)
export const LEADERBOARD_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "score", "type": "uint256" }],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "wallet", "type": "address" },
          { "internalType": "uint256", "name": "score", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct Base2048Leaderboard.PlayerScore[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export interface ChainLeader {
  address: string;
  name: string;
  score: number;
  timestamp: number;
  verified: boolean;
}

// Helper to encode Submit Score Data
export const encodeSubmitScore = (score: number): string => {
    // selector: submitScore(uint256) -> 0x9e122247
    const selector = "0x9e122247"; 
    const scoreHex = score.toString(16).padStart(64, '0');
    return selector + scoreHex;
};

/**
 * Robust Raw ABI Decoder for PlayerScore[] struct
 */
const decodeLeaderboard = (hexData: string): ChainLeader[] => {
    try {
        let cleanHex = hexData.startsWith("0x") ? hexData.slice(2) : hexData;
        if (cleanHex.length === 0) return [];

        const offsetHex = cleanHex.slice(0, 64);
        const offsetBytes = parseInt(offsetHex, 16);
        const offsetChars = offsetBytes * 2;

        if (offsetChars >= cleanHex.length) return [];

        const lengthHex = cleanHex.slice(offsetChars, offsetChars + 64);
        const length = parseInt(lengthHex, 16);

        if (isNaN(length) || length === 0) return [];
        const safeLength = Math.min(length, 50); 

        const leaders: ChainLeader[] = [];
        let pointer = offsetChars + 64; 
        const wordLength = 64; 

        for (let i = 0; i < safeLength; i++) {
            if (pointer + (wordLength * 3) > cleanHex.length) break;

            const addrChunk = cleanHex.substring(pointer, pointer + wordLength);
            const address = "0x" + addrChunk.slice(24);
            
            const scoreChunk = cleanHex.substring(pointer + wordLength, pointer + (wordLength * 2));
            const score = parseInt(scoreChunk, 16);
            
            const timeChunk = cleanHex.substring(pointer + (wordLength * 2), pointer + (wordLength * 3));
            const timestamp = parseInt(timeChunk, 16);

            leaders.push({
                address: address,
                name: `${address.slice(0, 6)}...${address.slice(-4)}`,
                score: score || 0,
                timestamp: timestamp || 0,
                verified: true
            });

            pointer += (wordLength * 3);
        }

        return leaders.sort((a, b) => b.score - a.score);

    } catch (e) {
        console.error("Decoder error:", e);
        return [];
    }
};

export const fetchChainLeaderboard = async (ethereum: any): Promise<ChainLeader[] | null> => {
    if (!CONTRACT_ADDRESS || !ethereum) return null;

    try {
        const data = "0x3d06941d"; // getLeaderboard()
        const result = await ethereum.request({
            method: 'eth_call',
            params: [{
                to: CONTRACT_ADDRESS,
                data: data
            }, 'latest']
        });
        
        if (!result || result === "0x") return [];

        return decodeLeaderboard(result);
    } catch (e) {
        console.error("Failed to fetch chain leaderboard", e);
        return null;
    }
};
