import React, { useState, useEffect } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { formatAddress } from '../utils/crypto';
import { ShieldCheck, ChevronDown, Check, RefreshCw, Cpu, Wallet } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [activeAccount, setActiveAccount] = useState(blockchainService.getActiveAccount());
  const [config, setConfig] = useState(blockchainService.getConfig());
  const [issuers, setIssuers] = useState(blockchainService.getAuthorizedIssuers());
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = blockchainService.subscribe(() => {
      setActiveAccount(blockchainService.getActiveAccount());
      setConfig(blockchainService.getConfig());
      setIssuers(blockchainService.getAuthorizedIssuers());
    });
    return unsub;
  }, []);

  const handleConnectMetaMask = async () => {
    setIsConnectingWallet(true);
    setWalletError(null);
    try {
      await blockchainService.connectMetaMask();
      setIsAccountDropdownOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setWalletError(msg);
      // Auto dismiss error after 4s
      setTimeout(() => setWalletError(null), 4000);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleSelectIssuer = (addr: string) => {
    blockchainService.setActiveAccount(addr);
    setIsAccountDropdownOpen(false);
  };

  const activeIssuerProfile = issuers.find(
    (i) => i.address.toLowerCase() === activeAccount.toLowerCase()
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('/')}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span>CertiChain</span>
        </button>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('/verify')}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentPath.startsWith('/verify') ? 'text-white' : ''
            }`}
          >
            Verify Certificate
          </button>
          <button
            onClick={() => onNavigate('/issuer')}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentPath === '/issuer' ? 'text-white' : ''
            }`}
          >
            Issuer Dashboard
          </button>
          <button
            onClick={() => onNavigate('/issuer/issue')}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentPath === '/issuer/issue' ? 'text-white' : ''
            }`}
          >
            Issue Credential
          </button>
          <button
            onClick={() => onNavigate('/issuer/certificates')}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentPath === '/issuer/certificates' ? 'text-white' : ''
            }`}
          >
            Registry Ledger
          </button>
          <button
            onClick={() => onNavigate('/issuer/settings')}
            className={`hover:text-white transition-colors cursor-pointer ${
              currentPath === '/issuer/settings' ? 'text-white' : ''
            }`}
          >
            Smart Contract
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions (Wallet & Network Status) */}
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-200 transition-colors whitespace-nowrap"
            >
              <span className={`w-2 h-2 rounded-full ${config.networkMode === 'injected-metamask' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
              <span className="font-medium text-slate-300">
                {activeIssuerProfile?.institution.split(' ')[0] || 'Issuer'}:
              </span>
              <span className="text-cyan-400 font-semibold">
                {formatAddress(activeAccount)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Active Blockchain Network
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{config.networkName}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">ID: {config.chainId}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                    Contract: {config.contractAddress}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Authorized Issuer Wallet
                </div>
                <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                  {issuers.map((iss) => {
                    const isSelected = iss.address.toLowerCase() === activeAccount.toLowerCase();
                    return (
                      <button
                        key={iss.address}
                        onClick={() => handleSelectIssuer(iss.address)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-cyan-950/40 border border-cyan-800/60 text-white' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-medium text-white truncate">{iss.institution}</div>
                          <div className="font-mono text-[10px] text-slate-400">{formatAddress(iss.address)}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <button
                    onClick={handleConnectMetaMask}
                    disabled={isConnectingWallet}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isConnectingWallet ? 'Connecting...' : 'Connect MetaMask / Web3'}</span>
                  </button>

                  {config.networkMode === 'injected-metamask' && (
                    <button
                      onClick={() => {
                        blockchainService.switchToLocalNode();
                        setIsAccountDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Switch back to Local EVM Node
                    </button>
                  )}

                  <button
                    onClick={() => {
                      blockchainService.resetToDefaults();
                      setIsAccountDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset seeded demo data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {walletError && (
        <div className="bg-amber-950/90 border-t border-b border-amber-800/80 px-4 py-1.5 text-center text-xs text-amber-200">
          {walletError}
        </div>
      )}
    </header>
  );
};
