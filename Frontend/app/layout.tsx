"use client"

import "@/styles/globals.css"
import { Inter as FontSans } from "next/font/google"
import {
  injectedWallet,
  metaMaskWallet,
  okxWallet,
  xdefiWallet,
} from "@rainbow-me/rainbowkit/wallets"

import { ZetaChainProvider } from "@/hooks/useZetaChainClient"
import Index from "@/app/index"

import "@rainbow-me/rainbowkit/styles.css"
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit"
import { WagmiConfig, configureChains, createConfig } from "wagmi"
import { bscTestnet, sepolia, zetachainAthensTestnet } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

interface RootLayoutProps {
  children: React.ReactNode
}

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    sepolia,
    bscTestnet,
    {
      ...zetachainAthensTestnet,
      iconUrl: "https://www.zetachain.com/favicon/favicon.png",
    },
  ],
  [publicProvider()]
)

const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId: "dd13975ba8f862e48d36fccd385fb2ee", chains }),
      xdefiWallet({ chains }),
      okxWallet({ projectId: "dd13975ba8f862e48d36fccd385fb2ee", chains }),
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`min-h-screen bg-background font-sans antialiased ${fontSans.variable}`}
      >
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            <ZetaChainProvider>
              <Index>{children}</Index>
            </ZetaChainProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </body>
    </html>
  )
}
