export interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

// Define possible Ethereum event types
export type EthereumEventType =
  | 'chainChanged'
  | 'accountsChanged'
  | 'connect'
  | 'disconnect'
  | 'message';

// Type for different event handlers
export interface EthereumEventMap {
  chainChanged: (chainId: string) => void;
  accountsChanged: (accounts: string[]) => void;
  connect: (connectInfo: { chainId: string }) => void;
  disconnect: (error: { code: number; message: string }) => void;
  message: (message: { type: string; data: unknown }) => void;
}

export interface EthereumProvider {
  request<T = unknown>(args: RequestArguments): Promise<T>;
  on<K extends EthereumEventType>(
    eventName: K,
    handler: EthereumEventMap[K]
  ): void;
  removeListener<K extends EthereumEventType>(
    eventName: K,
    handler: EthereumEventMap[K]
  ): void;
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