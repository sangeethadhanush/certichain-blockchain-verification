export interface CertificateData {
  verificationId: string;
  certificateTitle: string;
  certificateType: 'Degree' | 'Diploma' | 'Professional Certificate' | 'Accreditation' | 'License';
  recipientName: string;
  recipientId: string; // e.g. Student ID or National Identifier
  course: string;
  institution: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD or empty
  gradeOrDistinction?: string;
  description?: string;
}

export interface BlockchainRecord {
  verificationId: string;
  certificateHash: string; // 0x... 32-byte hex
  issuer: string; // 0x... Ethereum address
  issuedAt: number; // Unix timestamp seconds
  certificateType: string;
  recipientHash: string; // 0x... 32-byte hex
  revoked: boolean;
  revokedAt?: number;
  revocationReason?: string;
  blockNumber: number;
  transactionHash: string;
  networkName: string;
  chainId: number;
  gasUsed?: string;
}

export interface VerificationCheck {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  details: string;
  dataPoint?: {
    expected: string;
    actual: string;
  };
}

export type VerificationStatus = 
  | 'VERIFIED'
  | 'TAMPERED'
  | 'REVOKED'
  | 'NOT_FOUND'
  | 'EXPIRED';

export interface VerificationResult {
  status: VerificationStatus;
  verificationId: string;
  candidateCertificate?: CertificateData;
  blockchainRecord?: BlockchainRecord;
  computedHash?: string;
  onChainHash?: string;
  hashMatches: boolean;
  issuerAuthorized: boolean;
  issuerName?: string;
  isRevoked: boolean;
  isExpired: boolean;
  checks: VerificationCheck[];
  timestamp: number;
}

export interface IssuerProfile {
  address: string;
  name: string;
  institution: string;
  isAuthorized: boolean;
  authorizedAt: number;
  role: 'owner' | 'issuer';
  totalIssued: number;
}

export interface BlockchainConfig {
  networkMode: 'local-evm' | 'injected-metamask' | 'custom-rpc';
  rpcUrl: string;
  chainId: number;
  networkName: string;
  contractAddress: string;
  explorerUrl?: string;
}
