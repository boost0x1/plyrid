'use client'
import React, { useEffect, useState } from "react"
import { useNFT } from "./useNFT"

interface GameStatsProps {
  tokenId: string
}

const GameStats: React.FC<GameStatsProps> = ({ tokenId }) => {
  const { getGameData } = useNFT()
  const [gameData, setGameData] = useState<any>(null)

  useEffect(() => {
    const fetchGameData = async () => {
      const data = await getGameData(tokenId)
      setGameData(data)
    }
    fetchGameData()
  }, [tokenId])

  if (!gameData) {
    return <div>Loading game data...</div>
  }

  return (
    <div>
      <h2>Game Stats</h2>
      <p>Total Games Played: {gameData.totalGamesPlayed}</p>
      <h3>Achievements:</h3>
      <ul>
        {gameData.achievements.map((achievement: any, index: number) => (
          <li key={index}>
            Game ID: {achievement.gameId}, Achievement ID:{" "}
            {achievement.achievementId}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GameStats