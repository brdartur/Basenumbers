import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';

// Declare window.ethereum interface to prevent TypeErrors
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, onDisconnect }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Attempt to check if already connected on mount (safe check)
  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      try {
        if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000));
          const request = window.ethereum.request({ method: 'eth_accounts' });
          const accounts: any = await Promise.race([request, timeout]).catch(() => []);
          
          if (mounted && accounts && Array.isArray(accounts) && accounts.length > 0) {
            setAddress(accounts[0]);
            setStatus('connected');
            if (onConnect) onConnect(accounts[0]);
          }
        }
      } catch (e) {
        console.warn("Auto-connect check failed", e);
      }
    };
    checkConnection();
    return () => { mounted = false; };
  }, []);

  const triggerError = (msg: string) => {
    setStatus('error');
    setErrorMessage(msg);
    setTimeout(() => {
      setStatus('idle');
      setErrorMessage(null);
    }, 3000);
  };

  const connectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setStatus('connecting');
    setErrorMessage(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error("No Wallet");
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts retrieved");
      }

      const userAddress = accounts[0];
      setAddress(userAddress);
      setStatus('connected');
      if (onConnect) onConnect(userAddress);

      // Attempt to Switch to Base Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // 8453 (Base)
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base',
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Base network", addError);
          }
        }
      }

    } catch (err: any) {
      console.error("Connection failed", err);
      if (err.message === "No Wallet") {
        triggerError("Install Wallet");
      } else {
        triggerError("Failed");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setStatus('idle');
    if (onDisconnect) onDisconnect();
  };

  // Safe helper for address formatting
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  if (status === 'connected' && address) {
    return (
      <button 
        onClick={handleDisconnect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E2025] border border-[#2B303B] hover:bg-red-900/20 hover:border-red-500/30 transition-colors group"
        title="Disconnect"
      >
        <div className="w-2 h-2 rounded-full bg-[#0052FF] shadow-[0_0_8px_#0052FF]" />
        <span className="text-xs font-mono text-gray-300 group-hover:text-red-400 transition-colors">
          {formatAddress(address)}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs text-white 
          transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap
          ${isConnecting ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}
        `}
        style={{ backgroundColor: status === 'error' ? '#ef4444' : COLORS.primary }}
      >
        {status === 'error' ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            {errorMessage || "Error"}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </>
        )}
      </button>
      
      {/* Tooltip for missing wallet */}
      {status === 'error' && errorMessage === "Install Wallet" && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-800 text-white text-[10px] rounded-lg shadow-xl w-48 z-50 border border-gray-700 animate-fade-in text-center">
          Please install <span className="text-blue-300">Rabby</span>, <span className="text-blue-300">Coinbase</span>, or <span className="text-blue-300">MetaMask</span>.
        </div>
      )}
    </div>
  );
};

export default WalletConnect;