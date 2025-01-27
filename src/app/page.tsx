"use client"
import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import EVMLaunchpad from "@/contracts/EVMLaunchpad.json";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, switchChain } from '@/config/chains';
import type { ContractABI } from '@/types/ethereum';

declare global {
  interface Window {
    ethereum?: {
      on(event: string, callback: (...args: unknown[]) => void): void;
      removeListener(event: string, callback: (...args: unknown[]) => void): void;
    };
  }
}

// Define interfaces for state management
interface FormState {
  tokenAddress: string;
  softCap: string;
  hardCap: string;
  purchaseAmount: string;
  selectedToken: string;
}

interface SaleRoundState {
  pricePerToken: string;
  tokensAvailable: string;
  minContribution: string;
  maxContribution: string;
  startTime: string;
  endTime: string;
}

interface ComponentState {
  contract: Contract | null;
  account: string;
  loading: boolean;
  error: string;
  activeTab: 'register' | 'sale' | 'invest' | 'manage';
}


const EVMLaunchpadUI: React.FC = () => {
  // Add chain state
  const [chainId, setChainId] = useState<number>(DEFAULT_CHAIN_ID);
  
  // Component state
  const [contract, setContract] = useState<ComponentState['contract']>(null);
  const [account, setAccount] = useState<ComponentState['account']>('');
  const [loading, setLoading] = useState<ComponentState['loading']>(false);
  const [error, setError] = useState<ComponentState['error']>('');
  const [activeTab, setActiveTab] = useState<ComponentState['activeTab']>('register');
  
  // Form states
  const [tokenAddress, setTokenAddress] = useState<FormState['tokenAddress']>('');
  const [softCap, setSoftCap] = useState<FormState['softCap']>('');
  const [hardCap, setHardCap] = useState<FormState['hardCap']>('');
  const [purchaseAmount, setPurchaseAmount] = useState<FormState['purchaseAmount']>('');
  const [selectedToken, setSelectedToken] = useState<FormState['selectedToken']>('');
  
  // Sale round states
  const [pricePerToken, setPricePerToken] = useState<SaleRoundState['pricePerToken']>('');
  const [tokensAvailable, setTokensAvailable] = useState<SaleRoundState['tokensAvailable']>('');
  const [minContribution, setMinContribution] = useState<SaleRoundState['minContribution']>('');
  const [maxContribution, setMaxContribution] = useState<SaleRoundState['maxContribution']>('');
  const [startTime, setStartTime] = useState<SaleRoundState['startTime']>('');
  const [endTime, setEndTime] = useState<SaleRoundState['endTime']>('');

  useEffect(() => {
    const handleChainChanged = (newChainId: string | number) => {
      const chainIdNum = typeof newChainId === 'string' 
        ? parseInt(newChainId, 16) 
        : Number(newChainId);
      
      if (SUPPORTED_CHAINS[chainIdNum]) {
        setChainId(chainIdNum);
        initializeContract(chainIdNum);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged as (...args: unknown[]) => void);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged as (...args: unknown[]) => void);
      }
    };
  }, []);


  const initializeContract = async (chainIdNum: number): Promise<void> => {
    if (!window.ethereum) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const chainConfig = SUPPORTED_CHAINS[chainIdNum];
    
    if (chainConfig) {
      const contractABI = EVMLaunchpad as ContractABI;
      const launchpadContract = new ethers.Contract(
        chainConfig.contractAddress,
        contractABI,
        signer
      );
      setContract(launchpadContract);
    }
  };

  const connectWallet = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      // Get current chain ID
      const network = await provider.getNetwork();
      const currentChainId = network.chainId;
      
      // Switch to supported chain if needed
      if (!SUPPORTED_CHAINS[currentChainId]) {
        await switchChain(DEFAULT_CHAIN_ID);
      }
      
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      
      await initializeContract(currentChainId);
      setChainId(currentChainId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChainSwitch = async (newChainId: number) => {
    try {
      setLoading(true);
      await switchChain(newChainId);
      // Contract will be updated through the chainChanged event handler
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const registerToken = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.registerToken(
        tokenAddress,
        ethers.utils.parseEther(softCap),
        ethers.utils.parseEther(hardCap)
      );
      await tx.wait();
      setError('Token registered successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSaleRound = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const startTimeStamp: number = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimeStamp: number = Math.floor(new Date(endTime).getTime() / 1000);
      
      const tx = await contract.addSaleRound(
        selectedToken,
        ethers.utils.parseEther(pricePerToken),
        ethers.utils.parseEther(tokensAvailable),
        ethers.utils.parseEther(minContribution),
        ethers.utils.parseEther(maxContribution),
        startTimeStamp,
        endTimeStamp
      );
      await tx.wait();
      setError('Sale round added successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTokens = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.purchaseTokens(
        selectedToken,
        { value: ethers.utils.parseEther(purchaseAmount) }
      );
      await tx.wait();
      setError('Tokens purchased successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const claimTokens = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.claimTokens(selectedToken);
      await tx.wait();
      setError('Tokens claimed successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawFunds = async (): Promise<void> => {
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.withdrawFunds();
      await tx.wait();
      setError('Funds withdrawn successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">EVM Launchpad</h1>
        
        {/* Header Section with Network Selection and Wallet Connection */}
        <div className="flex flex-col space-y-4">
          {/* Network Selection */}
          {account && (
            <div className="flex items-center space-x-2">
              <select
                className="p-2 border rounded"
                value={chainId}
                onChange={(e) => handleChainSwitch(Number(e.target.value))}
              >
                {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                  <option key={id} value={id}>
                    {chain.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                Current Network: {SUPPORTED_CHAINS[chainId]?.name}
              </span>
            </div>
          )}
  
          {/* Wallet Connection */}
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Connect Wallet
            </button>
          ) : (
            <p className="text-sm">Connected: {account}</p>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
  
      {/* Main Content Section */}
      {account && (
        <div>
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded ${
                activeTab === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Register Token
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-4 py-2 rounded ${
                activeTab === 'sale' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Sale Rounds
            </button>
            <button
              onClick={() => setActiveTab('invest')}
              className={`px-4 py-2 rounded ${
                activeTab === 'invest' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Invest
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded ${
                activeTab === 'manage' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Manage
            </button>
          </div>
  
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'register' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Register New Token</h2>
                <form onSubmit={registerToken} className="space-y-4">
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Token Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Soft Cap (ETH)"
                    type="number"
                    value={softCap}
                    onChange={(e) => setSoftCap(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Hard Cap (ETH)"
                    type="number"
                    value={hardCap}
                    onChange={(e) => setHardCap(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Register Token
                  </button>
                </form>
              </div>
            )}
  
            {activeTab === 'sale' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Create Sale Round</h2>
                <form onSubmit={addSaleRound} className="space-y-4">
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Price Per Token (ETH)"
                    type="number"
                    value={pricePerToken}
                    onChange={(e) => setPricePerToken(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Tokens Available"
                    type="number"
                    value={tokensAvailable}
                    onChange={(e) => setTokensAvailable(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Min Contribution (ETH)"
                    type="number"
                    value={minContribution}
                    onChange={(e) => setMinContribution(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Max Contribution (ETH)"
                    type="number"
                    value={maxContribution}
                    onChange={(e) => setMaxContribution(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Create Sale Round
                  </button>
                </form>
              </div>
            )}
  
            {activeTab === 'invest' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Purchase Tokens</h2>
                <form onSubmit={purchaseTokens} className="space-y-4">
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Amount (ETH)"
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Purchase Tokens
                  </button>
                </form>
              </div>
            )}
  
            {activeTab === 'manage' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Manage Investments</h2>
                <div className="space-y-4">
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <button
                    onClick={claimTokens}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Claim Tokens
                  </button>
                  <button
                    onClick={withdrawFunds}
                    disabled={loading}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );}

export default EVMLaunchpadUI;