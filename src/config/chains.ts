import { ChainConfig } from '@/types/ethereum';

export const SUPPORTED_CHAINS: { [key: number]: ChainConfig } = {
  // Holesky Testnet
  17000: {
    chainId: 17000,
    name: 'Holesky',
    rpcUrl: 'https://ethereum-holesky.publicnode.com',
    contractAddress: '0x5B360Df3419F7A79e0F36cd8b7Dc45fC507DbD90',
    symbol: 'ETH'
  },
  // Polygon Amoy Testnet
  80001: {
    chainId: 80001,
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    contractAddress: 'YOUR_POLYGON_CONTRACT_ADDRESS',
    symbol: 'MATIC'
  },
  // BSC Testnet
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    contractAddress: 'YOUR_BSC_CONTRACT_ADDRESS',
    symbol: 'tBNB'
  }
};

export const DEFAULT_CHAIN_ID = 17000;

export async function switchChain(chainId: number): Promise<void> {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) throw new Error('Unsupported chain');
  
  if (!window.ethereum) throw new Error('No ethereum provider found');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: unknown) {
    const switchError = error as { code: number };
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: {
              name: chain.symbol,
              symbol: chain.symbol,
              decimals: 18
            },
            rpcUrls: [chain.rpcUrl],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}