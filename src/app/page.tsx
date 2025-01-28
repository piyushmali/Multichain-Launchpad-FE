"use client"
import React, { useState, useEffect } from 'react';
import { ethers, Contract } from 'ethers';
import EVMLaunchpad from "@/contracts/EVMLaunchpad.json";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN_ID, switchChain } from '@/config/chains';
import type { ContractABI } from '@/types/ethereum';
import { EthereumProvider, EthereumEventMap } from '@/types/ethereum';
import ERC20_ABI from "@/contracts/ERC20_ABI.json"; // Add this import for ERC20 ABI


// Update error handling types
type EVMLaunchpadError = {
  code?: number;
  message: string;
  data?: unknown;
};

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
    const handleChainChanged: EthereumEventMap['chainChanged'] = (chainId) => {
      const chainIdNum = parseInt(chainId, 16);
      
      if (SUPPORTED_CHAINS[chainIdNum]) {
        setChainId(chainIdNum);
        initializeContract(chainIdNum);
      }
    };
  
    const ethereum = window.ethereum;
    
    if (ethereum?.on) {
      ethereum.on('chainChanged', handleChainChanged);
    }
  
    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleError = (error: EVMLaunchpadError): string => {
    if (error.code) {
      switch (error.code) {
        case 4001:
          return 'Transaction rejected by user';
        case -32603:
          return 'Internal JSON-RPC error';
        default:
          return error.message || 'An unknown error occurred';
      }
    }
    return error.message || 'An unknown error occurred';
  };

  const initializeContract = async (chainIdNum: number): Promise<void> => {
    const ethereum = window.ethereum as EthereumProvider | undefined;
    if (!ethereum) return;

    const provider = new ethers.providers.Web3Provider(ethereum);
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

  const setupTokenTransfer = async (tokenAddress: string, amount: string): Promise<void> => {
    try {
      setLoading(true);
      if (!window.ethereum) throw new Error('MetaMask not installed');
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
      // Approve tokens for the launchpad contract
      const txApprove = await tokenContract.approve(contract?.address, ethers.utils.parseEther(amount));
      await txApprove.wait();
  
      // Transfer tokens to the launchpad contract
      const txTransfer = await tokenContract.transfer(contract?.address, ethers.utils.parseEther(amount));
      await txTransfer.wait();
  
      setError('Token transfer setup completed!');
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
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
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
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
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
    } finally {
      setLoading(false);
    }
  };

  const activateSaleRound = async (tokenAddress: string, roundIndex: number): Promise<void> => {
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const tx = await contract.activateSaleRound(tokenAddress, roundIndex);
      await tx.wait();
      setError('Sale round activated successfully!');
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
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
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
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
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
    } finally {
      setLoading(false);
    }
  };

  const checkVestingSchedule = async (investorAddress: string, tokenAddress: string): Promise<void> => {
    try {
      setLoading(true);
      if (!contract) throw new Error('Contract not initialized');
      
      const vestingSchedule = await contract.vestingSchedules(investorAddress, tokenAddress);
      console.log('Vesting Schedule:', vestingSchedule);
      setError('Vesting schedule fetched successfully!');
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
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
    } catch (err) {
      setError(handleError(err as EVMLaunchpadError));
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = (): void => {
    setAccount('');
    setContract(null);
    setError('');
    // Reset other relevant state if needed
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
              Zero Launchpad
            </h1>
            <p className="text-slate-400">Launch your tokens across multiple chains</p>
          </div>
          
          {/* Network Selection & Wallet Connection */}
          <div className="flex items-center gap-4">
            {account && (
              <select
                className="input max-w-[200px]"
                value={chainId}
                onChange={(e) => handleChainSwitch(Number(e.target.value))}
              >
                {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                  <option key={id} value={id}>
                    {chain.name}
                  </option>
                ))}
              </select>
            )}
            
            {!account ? (
              <button onClick={connectWallet} disabled={loading} className="button-primary">
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-700/50 text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button onClick={disconnectWallet} className="button-secondary">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      {account && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit">
            {['register', 'sale', 'invest', 'manage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ComponentState['activeTab'])}
                className="tab"
                data-active={activeTab === tab}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="card p-6">
            {activeTab === 'register' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Register New Token</h2>
                <form onSubmit={registerToken} className="space-y-4">
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Soft Cap (ETH)"
                    type="number"
                    value={softCap}
                    onChange={(e) => setSoftCap(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Hard Cap (ETH)"
                    type="number"
                    value={hardCap}
                    onChange={(e) => setHardCap(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
                  >
                    Register Token
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Token Transfer Setup</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setupTokenTransfer(tokenAddress, '10000'); // Adjust the amount as needed
                  }}
                  className="space-y-4"
                >
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
                  >
                    Setup Token Transfer
                  </button>
                </form>
              </div>
            )}
            
            {activeTab === 'sale' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Create Sale Round</h2>
                <form onSubmit={addSaleRound} className="space-y-4">
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Price Per Token (ETH)"
                    type="number"
                    value={pricePerToken}
                    onChange={(e) => setPricePerToken(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Tokens Available"
                    type="number"
                    value={tokensAvailable}
                    onChange={(e) => setTokensAvailable(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Min Contribution (ETH)"
                    type="number"
                    value={minContribution}
                    onChange={(e) => setMinContribution(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Max Contribution (ETH)"
                    type="number"
                    value={maxContribution}
                    onChange={(e) => setMaxContribution(e.target.value)}
                  />
                  <input
                    className="input"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <input
                    className="input"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
                  >
                    Create Sale Round
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'sale' && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Activate Sale Round</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    activateSaleRound(selectedToken, 0); // Adjust the roundIndex as needed
                  }}
                  className="space-y-4"
                >
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
                  >
                    Activate Sale Round
                  </button>
                </form>
              </div>
            )}
            
            {activeTab === 'invest' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Purchase Tokens</h2>
                <form onSubmit={purchaseTokens} className="space-y-4">
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Amount (ETH)"
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
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
                    className="input"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <button
                    onClick={claimTokens}
                    disabled={loading}
                    className="button-primary"
                  >
                    Claim Tokens
                  </button>
                  <button
                    onClick={withdrawFunds}
                    disabled={loading}
                    className="button-secondary"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'manage' && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Check Vesting Schedule</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    checkVestingSchedule(account, selectedToken);
                  }}
                  className="space-y-4"
                >
                  <input
                    className="input"
                    placeholder="Token Address"
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="button-primary"
                  >
                    Check Vesting Schedule
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EVMLaunchpadUI;