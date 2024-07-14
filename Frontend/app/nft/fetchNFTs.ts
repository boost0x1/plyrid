import abiJson from "../../public/abi/NFT.sol/UGI.json"
const abi = abiJson.abi;
import { getEndpoints } from "@zetachain/networks"
import { ethers } from "ethers"
import { gql, request } from "graphql-request"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"

import { useNFT } from "./useNFT"
import { useState } from "react"

const GOLDSKY_API =
  "https://api.goldsky.com/api/public/project_clyibjuabntqc01r1ha2m0h0e/subgraphs/nft-zetachain-testnet/v2/gn"

const query = (address: string) => {
  return gql`
      query {
        transfers(
          first: 100
          where: {
            or: [
              { to: "${address}" }
              { from: "${address}" }
            ]
          }
        ) {
          id
          to
          from
          block_number
          tokenId
        }
      }
    `
}

const findUserNFTs = (walletAddress: string, transfers: any) => {
  let currentOwnership: any = {}
  transfers.sort(
    (a: any, b: any) => parseInt(a.block_number) - parseInt(b.block_number)
  )

  transfers.forEach((transfer: any) => {
    if (transfer.to.toLowerCase() === walletAddress.toLowerCase()) {
      currentOwnership[transfer.tokenId] = true
    } else if (transfer.from.toLowerCase() === walletAddress.toLowerCase()) {
      currentOwnership[transfer.tokenId] = false
    }
  })

  return Object.keys(currentOwnership).filter((id) => currentOwnership[id])
}

export const useFetchNFTs = () => {
  const {
    setAssetsReloading,
    setAssets,
    omnichainContract,
    fetchForeignCoins,
  } = useNFT()
  const { address } = useAccount()

  const fetchNFTs = async () => {
    setAssetsReloading(true)
    try {
      let ownedNFTs: any = []
      const rpc = getEndpoints("evm", "zeta_testnet")[0]?.url

      if (address) {
        const transfers = (await request(
          GOLDSKY_API,
          query(address.toLowerCase())
        )) as any
        ownedNFTs = findUserNFTs(address, transfers?.transfers)
      }

      // Create a provider using ethers v5 syntax
      const provider = new ethers.providers.StaticJsonRpcProvider(rpc) ;

      const contract = new ethers.Contract(omnichainContract, abi, provider);

      const foreignCoins = await fetchForeignCoins()
      let assets = await Promise.all(
        ownedNFTs.map(async (id: any) => {
          const chain = (await contract.tokenChains(BigInt(id))).toString()
          const decimals = foreignCoins.find(
            (b: any) =>
              b.coin_type === "Gas" &&
              parseInt(b.foreign_chain_id) === parseInt(chain)
          )?.decimals
          const amount = formatUnits(
            await contract.tokenAmounts(BigInt(id)),
            parseInt(decimals)
          )
          return { id, amount, chain, decimals }
        })
      )
      assets = assets.filter((nft: any) => parseInt(nft.chain) > 0)
      assets.sort((a: any, b: any) => parseInt(b.id) - parseInt(a.id))
      setAssets(assets)
    } catch (e) {
      console.error("Error fetching NFTs:", e)
    } finally {
      setAssetsReloading(false)
    }
  }

  return { fetchNFTs }
}
