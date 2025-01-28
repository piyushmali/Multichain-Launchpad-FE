import { ChainConfig, EthereumProvider } from '@/types/ethereum';

export const SUPPORTED_CHAINS: { [key: number]: ChainConfig } = {
  // Holesky Testnet
  17000: {
    chainId: 17000,
    name: 'Holesky',
    rpcUrl: 'https://ethereum-holesky.publicnode.com',
    contractAddress: '0x961Bdef6E514dDEA530B3B2390ab2566076b6376',
    symbol: 'ETH'
  },
  // Polygon Amoy Testnet
  80002: {
    chainId: 80002, 
    name: 'Polygon Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology', //https://rpc-amoy.polygon.technology

    contractAddress: '0xAC7506a85bA1C7D8F8f2F654e395BfAc454790c1',
    symbol: 'MATIC'
  },
  // BSC Testnet
  97: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    contractAddress: '0x82a06C3dfFc8B6f8b90684963926D62398168205',
    symbol: 'tBNB'
  }
};

export const DEFAULT_CHAIN_ID = 17000;

export async function switchChain(chainId: number): Promise<void> {
  const chain = SUPPORTED_CHAINS[chainId];
  if (!chain) throw new Error('Unsupported chain');

  const ethereum = window.ethereum as EthereumProvider | undefined;
  if (!ethereum) throw new Error('No ethereum provider found');

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: unknown) {
    const switchError = error as { code: number };
    if (switchError.code === 4902) {
      await ethereum.request({
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