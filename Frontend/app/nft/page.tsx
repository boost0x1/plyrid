"use client"

import React, { useEffect, useState } from "react"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"
import { AnimatePresence, motion } from "framer-motion"
import { debounce } from "lodash"
import { Flame, Loader, RefreshCw, Send, Sparkles, GamepadIcon, Trophy } from "lucide-react"
import { Tilt } from "react-next-tilt"
import { ethers } from "ethers"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useBurn } from "./burn"
import { useFetchNFTs } from "./fetchNFTs"
import { useMint } from "./mint"
import { useTransfer } from "./transfer"
import { useNFT } from "./useNFT"
import abiJson from "../../public/abi/NFT.sol/UGI.json"
const abi = abiJson.abi
import { useEthersSigner } from "@/hooks/useEthersSigner"
import { useCCTXsContext } from "@/context/CCTXsContext"

type Achievement = {
  gameId: ethers.BigNumber;
  achievementId: ethers.BigNumber;
  timestamp: ethers.BigNumber;
  metadata: string;
};

type GameStats = {
  totalGamesPlayed: ethers.BigNumber;
  achievements: Achievement[];
};

const NFTPage = () => {
  const {
    assets,
    selectedChain,
    setSelectedChain,
    amount,
    setAmount,
    assetsReloading,
    assetsUpdating,
    assetsBurned,
    mintingInProgress,
    recipient,
    setRecipient,
    foreignCoins,
    omnichainContract,
  } = useNFT()
  const { cctxs } = useCCTXsContext()
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()
  const { transfer } = useTransfer()
  const { mint } = useMint()
  const { burn } = useBurn()
  const { fetchNFTs } = useFetchNFTs()
  const { address } = useAccount()
  const signer = useEthersSigner()

  const [gameStats, setGameStats] = useState<GameStats>({ totalGamesPlayed: ethers.BigNumber.from(0), achievements: [] })
  const [newGamesPlayed, setNewGamesPlayed] = useState("")
  const [newAchievement, setNewAchievement] = useState({ gameId: "", achievementId: "", metadata: "" })

  const handleSwitchNetwork = async () => {
    if (chain?.id) {
      switchNetwork?.(selectedChain)
    }
  }
  const getChainName = (chainId: string) => {
    const chainMap: {[key: string]: string} = {
      '5': 'Goerli',
      '97': 'BSC Testnet',
      '18332': 'Bitcoin Testnet',
      '80001': 'Mumbai',
      '7001': 'ZetaChain Athens',
    };
    return chainMap[chainId] || 'Unknown Chain';
  };
  const debouncedFetchNFTs = debounce(fetchNFTs, 1000)

  useEffect(() => {
    debouncedFetchNFTs()
  }, [address, JSON.stringify(cctxs)])

  useEffect(() => {
    if (address) {
      fetchGameStats()
    }
  }, [address])

  const fetchGameStats = async () => {
    if (!address || !signer) return
  
    const contract = new ethers.Contract(omnichainContract, abi, signer)
    try {
      const tokenId = 0; // Since you mentioned you own token ID 0
  
      // Check if the token exists and if you're the owner
      const ownerOf = await contract.ownerOf(tokenId);
      console.log("Owner of token:", ownerOf);
      if (ownerOf.toLowerCase() !== address.toLowerCase()) {
        console.error("You are not the owner of this token");
        return;
      }
  
      console.log("Fetching game stats for token ID:", tokenId);
  
      const stats = await contract.getGameData(tokenId);
      console.log("Raw game stats:", stats);
  
      // Decode the stats
      const totalGamesPlayed = stats[0];
      const achievements = stats[1];
  
      console.log("Total games played:", totalGamesPlayed.toString());
      console.log("Achievements:", achievements);
  
      // Format the achievements
      const formattedAchievements = achievements.map((achievement: any) => ({
        gameId: achievement.gameId.toString(),
        achievementId: achievement.achievementId.toString(),
        timestamp: new Date(achievement.timestamp.toNumber() * 1000).toLocaleString(),
        metadata: ethers.utils.toUtf8String(achievement.metadata)
      }));
  
      setGameStats({
        totalGamesPlayed: totalGamesPlayed,
        achievements: formattedAchievements
      });
  
    } catch (error) {
      console.error("Error fetching game stats:", error);
      if (error!) console.error("Error reason:", error);

    }
  }
  const handleUpdateStats = async () => {
    if (!signer || !address) return
  
    const contract = new ethers.Contract(omnichainContract, abi, signer)
    try {
      const tokenId = 0; // Since you mentioned you own token ID 0
  
      // Ensure all inputs are valid numbers
      if (newGamesPlayed === "" || newAchievement.gameId === "" || newAchievement.achievementId === "") {
        console.error("Please fill in all fields");
        return;
      }
  
      // Create the new achievement
      const achievement = [
        ethers.BigNumber.from(newAchievement.gameId),
        ethers.BigNumber.from(newAchievement.achievementId),
        ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
        ethers.utils.toUtf8Bytes(newAchievement.metadata)
      ];
  
      console.log("Structured achievement:", achievement);
  
      // Encode the game data
      const encodedData = ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'tuple(uint256,uint256,uint256,bytes)[]'],
        [ethers.BigNumber.from(newGamesPlayed), [achievement]]
      );
  
      console.log("Encoded data:", encodedData);
  
      const tx = await contract.updateGameData(tokenId, encodedData);
      await tx.wait();
      console.log("Game stats updated successfully");
      fetchGameStats();
    } catch (error) {
      console.error("Error updating stats:", error);
      if (error!) console.error("Error reason:", error);

    }
  };

  const colors: any = {
    5: "bg-gradient-to-bl from-[#141414] via-[#343434] to-[#3a3a3a]",
    97: "bg-gradient-to-br from-[#d6a000] via-[#f1bb1e] to-[#ffbe00]",
    18332: "bg-gradient-to-br from-[#f7931a] via-[#f7931a] to-[#ffb04f]",
    80001: "bg-gradient-to-bl from-[#7a40e5] via-[#8640e5] to-[#992fce]",
  }

  const coins = foreignCoins
    .filter((a: any) => a.coin_type === "Gas")
    .map((a: any) => ({ chain_id: a.foreign_chain_id, symbol: a.symbol }))

  const wrongNetwork =
    !selectedChain ||
    parseInt(selectedChain) === 18332 ||
    parseInt(selectedChain) === chain?.id

  const formatAmount = (amount: any) => {
    const a = Number(amount)
    let formatted = a.toPrecision(2)
    return a % 1 === 0 ? parseInt(formatted) : parseFloat(formatted)
  }

  return (
    <div className="container mx-auto px-6 py-12">
    <div className="flex items-center justify-between mb-12">
      <h1 className="text-4xl font-bold text-gray-800">NFT Library & Gaming Identity</h1>
      <Button size="icon" variant="outline" onClick={fetchNFTs}>
        <RefreshCw className={`h-5 w-5 ${assetsReloading && "animate-spin"}`} />
      </Button>
    </div>

    {/* Mint NFT Section */}
    <Card className="p-8 mb-12 bg-gradient-to-r from-purple-50 to-blue-50">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Mint New NFT</h2>
      <div className="flex gap-4 flex-wrap sm:flex-nowrap">
        <Input
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-grow"
        />
        <Select onValueChange={(e) => setSelectedChain(e)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select Chain" />
          </SelectTrigger>
          <SelectContent>
            {coins.map((c: any) => (
              <SelectItem key={c.chain_id} value={c.chain_id}>
                {c.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {setAmount(0.001); mint(selectedChain)}}
          disabled={!selectedChain || mintingInProgress}
          className="w-full sm:w-32"
        >
          {mintingInProgress ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Mint
        </Button>
      </div>
    </Card>

 {/* Owned NFTs Display */}
 <h2 className="text-3xl font-semibold mb-6 text-gray-800">Your NFTs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
        {assets.length > 0 ? (
          assets.map((asset: any) => (
            !assetsBurned.includes(asset.id) && (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                key={asset.id}
              >
                <Tilt lineGlareBlurAmount="40px" scale={1.05} className="h-full">
                  <Card className={`relative h-full p-6 ${colors[asset?.chain]} overflow-hidden border-2 border-white/10 shadow-lg`}>
                    <div className={`absolute inset-0 bg-black/75 flex items-center justify-center z-10 ${assetsUpdating.includes(asset.id) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                      <Loader className="text-white animate-spin" size={48} />
                    </div>
                    <div className="flex flex-col h-full justify-between relative z-0">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-2xl font-bold text-white">#{asset.id}</p>
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold text-white">
                            {coins.find((c: any) => c.chain_id == asset?.chain)?.symbol}
                          </span>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 mb-4">
                          <p className="text-4xl font-bold text-white mb-2">{formatAmount(asset?.amount)}</p>
                          <p className="text-sm text-white/60">Minted on {getChainName(asset?.chain)}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <img 
                          src={`https://picsum.photos/seed/${asset.id}/300/200`} 
                          alt={`NFT ${asset.id}`} 
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="flex justify-between items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="secondary" size="sm" className="w-[48%]">
                                <Send className="h-4 w-4 mr-2" />
                                Transfer
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4">
                              <Input
                                placeholder="Recipient address"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="mb-2"
                              />
                              <Button 
                                onClick={() => transfer(asset.id)}
                                disabled={assetsUpdating.includes(asset.id)}
                                className="w-full"
                              >
                                Confirm Transfer
                              </Button>
                            </PopoverContent>
                          </Popover>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => burn(asset.id)}
                            disabled={assetsUpdating.includes(asset.id)}
                            className="w-[48%]"
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            Burn
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Tilt>
              </motion.div>
            )
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center text-lg">{"You don't own any NFTs yet. Mint one to get started!"}</p>
        )}
      </div>

    {/* Game Stats Display */}
    <Card className="p-8 mb-12 bg-gradient-to-r from-green-50 to-blue-50">
      <h2 className="text-3xl font-semibold mb-6 flex items-center text-gray-800">
        <GamepadIcon className="mr-3" />
        Game Stats
      </h2>
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <p className="text-2xl font-semibold text-gray-700">Total Games Played: {gameStats.totalGamesPlayed?.toString() || '0'}</p>
      </div>
      <h3 className="text-2xl font-semibold mb-4 flex items-center text-gray-700">
        <Trophy className="mr-3" />
        Achievements
      </h3>
      <div className="space-y-6">
        {gameStats.achievements && gameStats.achievements.length > 0 ? (
          gameStats.achievements.map((achievement, index) => (
            <Card key={index} className="p-6 bg-white shadow-md">
              <p className="mb-2"><strong>Game ID:</strong> {achievement.gameId.toString()}</p>
              <p className="mb-2"><strong>Achievement ID:</strong> {achievement.achievementId.toString()}</p>
              <p className="mb-2"><strong>Timestamp:</strong> {achievement.timestamp.toString()}</p>
              <p><strong>Metadata:</strong> {achievement.metadata}</p>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 text-lg">No achievements yet. Keep playing to earn some!</p>
        )}
      </div>
    </Card>

    {/* Update Game Stats Section */}
    <Card className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Update Game Stats</h2>
      <div className="space-y-6">
        <Input
          type="number"
          placeholder="New Games Played"
          value={newGamesPlayed}
          onChange={(e) => setNewGamesPlayed(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Game ID"
          value={newAchievement.gameId}
          onChange={(e) => setNewAchievement({...newAchievement, gameId: e.target.value})}
        />
        <Input
          type="number"
          placeholder="Achievement ID"
          value={newAchievement.achievementId}
          onChange={(e) => setNewAchievement({...newAchievement, achievementId: e.target.value})}
        />
        <Input
          type="text"
          placeholder="Achievement Metadata"
          value={newAchievement.metadata}
          onChange={(e) => setNewAchievement({...newAchievement, metadata: e.target.value})}
        />
        <Button onClick={handleUpdateStats} className="w-full">
          Update Stats
        </Button>
      </div>
    </Card>
  </div>

  )
}

export default NFTPage