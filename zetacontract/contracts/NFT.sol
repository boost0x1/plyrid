// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract NFT is ERC721, ZetaInteractor, ZetaReceiver {
    event CrossChainTransfer(address from, address to, uint256 tokenId, uint256 destinationChainId);
    event CrossChainReceive(address to, uint256 tokenId, uint256 sourceChainId);

    uint256 private _tokenIds;

    struct PlayerData {
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

    mapping(uint256 => PlayerData) private _playerData;

    constructor(address connectorAddress) ERC721("OmniPlayerID", "OPID") ZetaInteractor(connectorAddress) {}

    function mint(address to) public onlyOwner returns (uint256) {
        _tokenIds++;
        _safeMint(to, _tokenIds);
        return _tokenIds;
    }

    function transferCrossChain(
        uint256 destinationChainId,
        address to,
        uint256 tokenId
    ) external payable {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not token owner or approved");
        require(_isValidChainId(destinationChainId), "Invalid destination chain ID");

        _burn(tokenId);

        bytes memory message = abi.encode(to, tokenId, msg.sender);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: message,
                zetaValueAndGas: msg.value,
                zetaParams: abi.encode("")
            })
        );

        emit CrossChainTransfer(_msgSender(), to, tokenId, destinationChainId);
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external override isValidMessageCall(zetaMessage) {
        (address to, uint256 tokenId) = abi.decode(zetaMessage.message, (address, uint256));
        _safeMint(to, tokenId);
        emit CrossChainReceive(to, tokenId, zetaMessage.sourceChainId);
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external override isValidRevertCall(zetaRevert) {
        (address to, uint256 tokenId, address from) = abi.decode(zetaRevert.message, (address, uint256, address));
        _safeMint(from, tokenId);
    }

    function updateGameData(uint256 tokenId, uint256 gamesPlayed, Achievement[] memory newAchievements) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not token owner or approved");
        
        PlayerData storage data = _playerData[tokenId];
        data.totalGamesPlayed += gamesPlayed;

        for (uint i = 0; i < newAchievements.length; i++) {
            uint256 achievementId = data.achievementCount;
            data.achievements[achievementId] = newAchievements[i];
            data.achievementCount++;
        }
    }

    function getGameData(uint256 tokenId) external view returns (uint256 totalGamesPlayed, Achievement[] memory achievements) {
        PlayerData storage data = _playerData[tokenId];
        totalGamesPlayed = data.totalGamesPlayed;
        
        achievements = new Achievement[](data.achievementCount);
        for (uint i = 0; i < data.achievementCount; i++) {
            achievements[i] = data.achievements[i];
        }
    }
}
