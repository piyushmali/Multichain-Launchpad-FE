export interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (args: unknown) => void) => void;
    removeListener: (event: string, handler: (args: unknown) => void) => void;
    isMetaMask?: boolean;
  }
  
  declare global {
    interface Window {
      ethereum?: EthereumProvider;
    }
  }
  
  export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    contractAddress: string;
    symbol: string;
  }
  
  export type ContractABI = Array<{
    type: string;
    name?: string;
    inputs?: Array<{
      name: string;
      type: string;
      indexed?: boolean;
      components?: Array<{
        name: string;
        type: string;
      }>;
    }>;
    outputs?: Array<{
      name: string;
      type: string;
    }>;
    stateMutability?: string;
    anonymous?: boolean;
  }>;