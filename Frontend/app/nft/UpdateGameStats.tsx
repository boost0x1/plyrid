'use client'
import React, { useState } from "react"
import { useNFT } from "./useNFT"

interface UpdateGameStatsProps {
  tokenId: string
}

const UpdateGameStats: React.FC<UpdateGameStatsProps> = ({ tokenId }) => {
  const { updateGameData } = useNFT()
  const [gamesPlayed, setGamesPlayed] = useState("")
  const [newAchievements, setNewAchievements] = useState<any[]>([])

  const handleUpdateGameData = async () => {
    await updateGameData(tokenId, gamesPlayed, newAchievements)
    setGamesPlayed("")
    setNewAchievements([])
  }

  return (
    <div>
      <h2>Update Game Stats</h2>
      <input
        type="number"
        placeholder="Games Played"
        value={gamesPlayed}
        onChange={(e) => setGamesPlayed(e.target.value)}
      />
      {/* Add inputs for new achievements */}
      <button onClick={handleUpdateGameData}>Update Game Stats</button>
    </div>
  )
}

export default UpdateGameStats