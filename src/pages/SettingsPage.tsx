import React, { useState, useEffect } from 'react';
import { blockchainService } from '../blockchain/blockchainService';
import { formatAddress } from '../utils/crypto';
import type { BlockchainConfig, IssuerProfile } from '../types/certificate';
import { CERTIFICATE_REGISTRY_ABI } from '../blockchain/contractAbi';
import { 
  Cpu, 
  Wallet, 
  ShieldCheck, 
  Check, 
  Copy, 
  RefreshCw, 
  UserPlus, 
  Trash2, 
  Code2, 
  Layers,
  FileCode,
  AlertCircle
} from 'lucide-react';

const SOLIDITY_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Decentralized, tamper-evident registry for academic and professional certificates.
 */
contract CertificateRegistry {
    struct Certificate {
        string verificationId;
        bytes32 certificateHash;
        address issuer;
        uint256 issuedAt;
        string certificateType;
        bytes32 recipientHash;
        bool revoked;
        uint256 revokedAt;
        string revocationReason;
    }

    address public owner;
    mapping(string => Certificate) private certificates;
    mapping(string => bool) public certificateExists;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => string) public issuerInstitutions;

    event CertificateIssued(string indexed verificationId, bytes32 indexed certificateHash, address indexed issuer, uint256 issuedAt, string certificateType);
    event CertificateRevoked(string indexed verificationId, address indexed revokedBy, uint256 revokedAt, string reason);
    event IssuerAuthorized(address indexed issuer, string institutionName);

    modifier onlyOwner() {
        require(msg.sender == owner, "CertiChain: Caller not owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner, "CertiChain: Caller not authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        issuerInstitutions[msg.sender] = "CertiChain Root Authority";
    }

    function authorizeIssuer(address _issuer, string calldata _institution) external onlyOwner {
        authorizedIssuers[_issuer] = true;
        issuerInstitutions[_issuer] = _institution;
        emit IssuerAuthorized(_issuer, _institution);
    }

    function issueCertificate(
        string calldata _verificationId,
        bytes32 _certificateHash,
        string calldata _certificateType,
        bytes32 _recipientHash
    ) external onlyAuthorizedIssuer {
        require(!certificateExists[_verificationId], "Already exists");
        certificates[_verificationId] = Certificate(_verificationId, _certificateHash, msg.sender, block.timestamp, _certificateType, _recipientHash, false, 0, "");
        certificateExists[_verificationId] = true;
        emit CertificateIssued(_verificationId, _certificateHash, msg.sender, block.timestamp, _certificateType);
    }

    function revokeCertificate(string calldata _verificationId, string calldata _reason) external {
        require(certificateExists[_verificationId], "Does not exist");
        Certificate storage cert = certificates[_verificationId];
        require(!cert.revoked, "Already revoked");
        require(msg.sender == cert.issuer || msg.sender == owner, "Unauthorized");
        cert.revoked = true;
        cert.revokedAt = block.timestamp;
        cert.revocationReason = _reason;
        emit CertificateRevoked(_verificationId, msg.sender, block.timestamp, _reason);
    }

    function verifyCertificate(string calldata _verificationId, bytes32 _candidateHash)
        external
        view
        returns (bool exists, bool isValid, bool isRevoked, address issuer, uint256 issuedAt)
    {
        if (!certificateExists[_verificationId]) return (false, false, false, address(0), 0);
        Certificate storage cert = certificates[_verificationId];
        return (true, cert.certificateHash == _candidateHash && !cert.revoked, cert.revoked, cert.issuer, cert.issuedAt);
    }
}`;

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<BlockchainConfig>(blockchainService.getConfig());
  const [issuers, setIssuers] = useState<IssuerProfile[]>(blockchainService.getAuthorizedIssuers());
  const [activeAccount, setActiveAccount] = useState(blockchainService.getActiveAccount());
  
  // New issuer form
  const [newIssuerAddress, setNewIssuerAddress] = useState('');
  const [newIssuerName, setNewIssuerName] = useState('');
  const [newIssuerInstitution, setNewIssuerInstitution] = useState('');
  const [issuerError, setIssuerError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const unsub = blockchainService.subscribe(() => {
      setConfig(blockchainService.getConfig());
      setIssuers(blockchainService.getAuthorizedIssuers());
      setActiveAccount(blockchainService.getActiveAccount());
    });
    return unsub;
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    blockchainService.saveConfig(config);
  };

  const handleAuthorizeIssuer = (e: React.FormEvent) => {
    e.preventDefault();
    setIssuerError(null);
    try {
      blockchainService.authorizeIssuer(newIssuerAddress, newIssuerInstitution, newIssuerName);
      setNewIssuerAddress('');
      setNewIssuerName('');
      setNewIssuerInstitution('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to authorize';
      setIssuerError(msg);
    }
  };

  const handleDeauthorize = (address: string) => {
    blockchainService.deauthorizeIssuer(address);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Smart Contract & Network Architecture</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure blockchain RPC targets, manage authorized institutional keys, and audit contract source code.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Network & RPC Configuration */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              EVM Blockchain Environment
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              Chain ID: {config.chainId}
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Network Engine Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    blockchainService.switchToLocalNode();
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    config.networkMode === 'local-evm'
                      ? 'bg-cyan-950/40 border-cyan-800/80 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-white">Local EVM Testnet</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zero-setup built-in Hardhat state</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await blockchainService.connectMetaMask();
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'MetaMask unavailable';
                      alert(msg);
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    config.networkMode === 'injected-metamask'
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-white">Injected Web3 (MetaMask)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Live testnet / Sepolia / RPC</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Smart Contract Address</label>
              <input
                type="text"
                value={config.contractAddress}
                onChange={(e) => setConfig({ ...config, contractAddress: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Custom RPC Endpoint</label>
              <input
                type="text"
                value={config.rpcUrl}
                onChange={(e) => setConfig({ ...config, rpcUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => blockchainService.resetToDefaults()}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset ledger to default seed state
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save Network Config
              </button>
            </div>
          </form>
        </div>

        {/* Authorized Issuers Registry */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authorized Institutional Issuers
            </h2>
            <span className="text-xs text-slate-400">
              {issuers.filter(i => i.isAuthorized).length} Active Authorities
            </span>
          </div>

          {/* List of issuers */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {issuers.map((iss) => (
              <div
                key={iss.address}
                className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{iss.institution}</span>
                    {iss.isAuthorized ? (
                      <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-mono">REVOKED</span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    {formatAddress(iss.address, 6)} ({iss.name})
                  </div>
                </div>

                {iss.role !== 'owner' && iss.isAuthorized && (
                  <button
                    onClick={() => handleDeauthorize(iss.address)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Deauthorize Issuer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Authorize New Issuer Form */}
          <form onSubmit={handleAuthorizeIssuer} className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <span className="block font-semibold text-slate-300">Authorize New Signing Key</span>
            
            {issuerError && (
              <div className="p-2 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-[11px]">
                {issuerError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Wallet Address (0x...)"
                value={newIssuerAddress}
                onChange={(e) => setNewIssuerAddress(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
              />
              <input
                type="text"
                required
                placeholder="Institution Name (e.g. Harvard Credential Lab)"
                value={newIssuerInstitution}
                onChange={(e) => setNewIssuerInstitution(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Authorize Institutional Key</span>
            </button>
          </form>
        </div>
      </div>

      {/* Solidity Smart Contract Source Code Inspector */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">
              Solidity Smart Contract Source: CertificateRegistry.sol
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(SOLIDITY_SOURCE, 'sol')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copiedKey === 'sol' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Contract</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 leading-relaxed max-h-72 overflow-y-auto">
          {SOLIDITY_SOURCE}
        </pre>
      </div>
    </div>
  );
};
