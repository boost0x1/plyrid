import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json";
import { prepareData } from "@zetachain/toolkit/client";
import { ethers } from "ethers";
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json";

const NFT_ABI = [
  "function onCrossChainCall(tuple(uint256 chainID, address dstAddress, uint256 zrc20Amount, uint256 minGasLimit) context, address zrc20, uint256 amount, bytes calldata message) external",
  "function burnNFT(uint256 tokenId, bytes memory recipient) public",
  "function tokenChains(uint256 tokenId) public view returns (uint256)",
  "function tokenAmounts(uint256 tokenId) public view returns (uint256)"
];

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  const contract = new ethers.Contract(args.contract, NFT_ABI, signer);

  let tx;

  if (args.action === "mint") {
    const data = prepareData(args.contract, ["address"], [args.recipient]);
    if (args.token) {
      const custodyAddress = getAddress("erc20Custody", hre.network.name as any);
      if (!custodyAddress) {
        throw new Error(`No ERC20 Custody contract found for ${hre.network.name} network`);
      }
      const custodyContract = new ethers.Contract(custodyAddress, ERC20Custody.abi, signer);
      const tokenContract = new ethers.Contract(args.token, ERC20.abi, signer);
      const decimals = await tokenContract.decimals();
      const value = parseUnits(args.amount, decimals);
      const approve = await tokenContract.approve(custodyAddress, value);
      await approve.wait();
      tx = await custodyContract.deposit(signer.address, args.token, value, data);
    } else {
      const value = parseUnits(args.amount, 18);
      const to = getAddress("tss", hre.network.name as any);
      tx = await signer.sendTransaction({ data, to, value });
    }
  } else if (args.action === "burn") {
    const recipient = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(args.recipient));
    tx = await contract.burnNFT(args.tokenId, recipient);
  } else if (args.action === "getData") {
    const chain = await contract.tokenChains(args.tokenId);
    const amount = await contract.tokenAmounts(args.tokenId);
    console.log(`Token ID: ${args.tokenId}`);
    console.log(`Chain: ${chain}`);
    console.log(`Amount: ${amount}`);
    return;
  } else {
    throw new Error("Invalid action");
  }

  await tx.wait();

  if (args.json) {
    console.log(JSON.stringify(tx, null, 2));
  } else {
    console.log(`🔑 Using account: ${signer.address}\n`);
    console.log(`🚀 Successfully executed ${args.action} action on ${hre.network.name} network.
📝 Transaction hash: ${tx.hash}
    `);
  }
};

task("nft", "Interact with the NFT contract")
  .addParam("contract", "The address of the NFT contract")
  .addParam("action", "Action to perform: mint, burn, or getData")
  .addOptionalParam("recipient", "The address of the recipient (for mint and burn)")
  .addOptionalParam("amount", "Amount of tokens to send (for mint)")
  .addOptionalParam("tokenId", "The token ID (for burn and getData)")
  .addOptionalParam("token", "The address of the token to send (for mint)")
  .addFlag("json", "Output in JSON")
  .setAction(main);