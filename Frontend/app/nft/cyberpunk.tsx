import React from "react"
import { motion } from "framer-motion"
import { Flame, Send, Zap, Cpu, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface CyberpunkNFTCardProps {
  asset: any;
  transfer: (id: string) => void;
  burn: (id: string) => void;
  recipient: string;
  setRecipient: (value: string) => void;
  assetsUpdating: string[];
  coins: any[];
  formatAmount: any;
  getChainName: any;
}

const CyberpunkNFTCard: React.FC<CyberpunkNFTCardProps> = ({ 
  asset, 
  transfer, 
  burn, 
  recipient, 
  setRecipient, 
  assetsUpdating, 
  coins, 
  formatAmount, 
  getChainName 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="cyberpunk-card-container"
    >
      <Card className="relative h-full overflow-hidden border-2 border-neon-blue shadow-neon">
        <div className="absolute inset-0 bg-circuit-pattern opacity-10"></div>
        <div className="relative z-10 p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <p className="text-3xl font-bold text-neon-blue glitch-text">#{asset.id}</p>
            <span className="px-3 py-1 bg-neon-purple/20 rounded-full text-sm font-semibold text-neon-purple border border-neon-purple">
              {coins.find((c) => c.chain_id == asset?.chain)?.symbol}
            </span>
          </div>
          
          <div className="flex-grow">
            <div className="bg-black/50 rounded-lg p-4 mb-4 border border-neon-blue">
              <p className="text-4xl font-bold text-neon-green mb-2">{formatAmount(asset?.amount)}</p>
              <p className="text-sm text-neon-blue">Minted on {getChainName(asset?.chain)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/30 p-2 rounded border border-neon-purple">
                <p className="text-xs text-neon-purple mb-1">Power Level</p>
                <p className="text-lg font-bold text-neon-green flex items-center">
                  <Zap size={16} className="mr-1 text-neon-yellow" />
                  {Math.floor(Math.random() * 1000)}
                </p>
              </div>
              <div className="bg-black/30 p-2 rounded border border-neon-purple">
                <p className="text-xs text-neon-purple mb-1">Rarity</p>
                <p className="text-lg font-bold text-neon-green flex items-center">
                  <Cpu size={16} className="mr-1 text-neon-yellow" />
                  {['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)]}
                </p>
              </div>
            </div>

            <div className="bg-black/30 p-2 rounded border border-neon-purple mb-4">
              <p className="text-xs text-neon-purple mb-1">Network Strength</p>
              <div className="flex items-center">
                <Wifi size={16} className="mr-1 text-neon-yellow" />
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-neon-green h-2.5 rounded-full" style={{ width: `${Math.floor(Math.random() * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[48%] border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-colors duration-300">
                  <Send className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 bg-black border border-neon-blue">
                <Input
                  placeholder="Recipient address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mb-2 bg-gray-800 text-neon-green border-neon-blue"
                />
                <Button 
                  onClick={() => transfer(asset.id)}
                  disabled={assetsUpdating.includes(asset.id)}
                  className="w-full bg-neon-blue text-black hover:bg-neon-green transition-colors duration-300"
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
              className="w-[48%] bg-neon-red hover:bg-red-700 transition-colors duration-300"
            >
              <Flame className="h-4 w-4 mr-2" />
              Burn
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default CyberpunkNFTCard