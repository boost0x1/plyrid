// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract UGI is zContract, ERC721, OnlySystem {
    SystemContract public systemContract;
    error CallerNotOwnerNotApproved();
    error AlreadyMinted();

    struct GameData {
        uint256 totalGamesPlayed;
        uint256 achievementCount;
        mapping(uint256 => Achievement) achievements;
    }

    struct Achievement {
        uint256 gameId;
        uint256 achievementId;
        uint256 timestamp;
        bytes metadata;
    }

    mapping(uint256 => GameData) public tokenGameData;
    mapping(uint256 => uint256) public tokenChains;
    mapping(uint256 => uint256) public tokenAmounts;
    mapping(address => bool) public hasMinted;
    uint256 private _nextTokenId;
    uint256 constant BITCOIN = 18332;
    event UGIMinted(uint256 tokenId, address user);
    event GameDataUpdated(uint256 tokenId);

    constructor(address systemContractAddress) ERC721("UniversalGamingIdentity", "UGI") {
        systemContract = SystemContract(systemContractAddress);
        _nextTokenId = 1;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlySystem(systemContract) {
        address recipient;

        if (context.chainID == BITCOIN) {
            recipient = BytesHelperLib.bytesToAddress(message, 0);
        } else {
            recipient = abi.decode(message, (address));
        }

        _mintUGI(recipient, context.chainID, amount);
    }

    function _mintUGI(address recipient, uint256 chainId, uint256 amount) private {
        if (hasMinted[recipient]) {
            revert AlreadyMinted();
        }
        
        uint256 tokenId = _nextTokenId;
        _safeMint(recipient, tokenId);
        tokenChains[tokenId] = chainId;
        tokenAmounts[tokenId] = amount;
        hasMinted[recipient] = true;
        _nextTokenId++;
        emit UGIMinted(tokenId, recipient);
    }

    function mintUGI(address user, uint256 amount) external {
        _mintUGI(user, block.chainid, amount);
    }

    function updateGameData(uint256 tokenId, bytes calldata gameData) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not owner or approved");
        
        (uint256 gamesPlayed, Achievement[] memory newAchievements) = abi.decode(gameData, (uint256, Achievement[]));
        
        GameData storage data = tokenGameData[tokenId];
        data.totalGamesPlayed += gamesPlayed;

        for (uint i = 0; i < newAchievements.length; i++) {
            uint256 achievementId = data.achievementCount;
            data.achievements[achievementId] = newAchievements[i];
            data.achievementCount++;
        }

        emit GameDataUpdated(tokenId);
    }

    function getGameData(uint256 tokenId) external view returns (uint256 totalGamesPlayed, Achievement[] memory achievements) {
        GameData storage data = tokenGameData[tokenId];
        totalGamesPlayed = data.totalGamesPlayed;
        
        achievements = new Achievement[](data.achievementCount);
        for (uint i = 0; i < data.achievementCount; i++) {
            achievements[i] = data.achievements[i];
        }
    }

    function burnUGI(uint256 tokenId, bytes memory recipient) public {
        if (!_isApprovedOrOwner(_msgSender(), tokenId)) {
            revert CallerNotOwnerNotApproved();
        }
        
        address zrc20 = systemContract.gasCoinZRC20ByChainId(tokenChains[tokenId]);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();
        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(recipient, gasFee);

        _burn(tokenId);
        delete tokenGameData[tokenId];
        delete tokenChains[tokenId];
        delete hasMinted[ownerOf(tokenId)];
    }
}