// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Base2048Leaderboard {
    struct PlayerScore {
        address wallet;
        uint256 score;
        uint256 timestamp;
    }

    PlayerScore[] public leaderboard;
    mapping(address => uint256) public bestScores;

    event ScoreSubmitted(address indexed player, uint256 score);

    function submitScore(uint256 score) external {
        // Обновляем только если новый счет выше
        if (score > bestScores[msg.sender]) {
            bestScores[msg.sender] = score;
            
            bool exists = false;
            for (uint i = 0; i < leaderboard.length; i++) {
                if (leaderboard[i].wallet == msg.sender) {
                    leaderboard[i].score = score;
                    leaderboard[i].timestamp = block.timestamp;
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                leaderboard.push(PlayerScore(msg.sender, score, block.timestamp));
            }

            emit ScoreSubmitted(msg.sender, score);
        }
    }

    function getLeaderboard() external view returns (PlayerScore[] memory) {
        return leaderboard;
    }
}
