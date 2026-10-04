import { ethers } from 'ethers';
import type { CertificateData } from '../types/certificate';

/**
 * Builds a deterministic canonical string from certificate data.
 * Adheres to strict field ordering and whitespace trimming.
 */
export function buildCanonicalCertificateString(cert: CertificateData): string {
  const normalize = (val?: string) => (val ?? '').trim().replace(/\r\n/g, '\n');

  return [
    `certificateTitle:${normalize(cert.certificateTitle)}`,
    `certificateType:${normalize(cert.certificateType)}`,
    `recipientName:${normalize(cert.recipientName)}`,
    `recipientId:${normalize(cert.recipientId)}`,
    `course:${normalize(cert.course)}`,
    `institution:${normalize(cert.institution)}`,
    `issueDate:${normalize(cert.issueDate)}`,
    `expiryDate:${normalize(cert.expiryDate)}`,
  ].join('\n');
}

/**
 * Computes standard SHA-256 hash formatted as a 0x-prefixed 32-byte hex string.
 */
export function computeCertificateHash(cert: CertificateData): string {
  const canonicalString = buildCanonicalCertificateString(cert);
  const bytes = ethers.toUtf8Bytes(canonicalString);
  return ethers.sha256(bytes);
}

/**
 * Privacy-preserving recipient identifier hash (e.g. Student ID / SSN).
 */
export function computeRecipientHash(recipientId: string): string {
  const normalized = recipientId.trim().toLowerCase();
  const bytes = ethers.toUtf8Bytes(normalized);
  return ethers.sha256(bytes);
}

/**
 * Generates an unpredictable, non-sequential verification ID.
 * Example: CERT-7F4A92C1
 */
export function generateVerificationId(): string {
  const randomBytes = ethers.randomBytes(4);
  const hex = ethers.hexlify(randomBytes).slice(2).toUpperCase();
  return `CERT-${hex}`;
}

/**
 * Formats an Ethereum address for clean UI display.
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Formats a 0x-prefixed hash for clean display.
 */
export function formatHash(hash: string, lead = 8, trail = 8): string {
  if (!hash || hash.length < lead + trail + 4) return hash || '';
  return `${hash.substring(0, lead + 2)}...${hash.substring(hash.length - trail)}`;
}

/**
 * Compares two hashes character-by-character to identify exact divergence points.
 */
export function diffHashes(hashA: string, hashB: string): {
  matches: boolean;
  mismatchIndices: number[];
} {
  const cleanA = hashA.toLowerCase();
  const cleanB = hashB.toLowerCase();
  const mismatchIndices: number[] = [];
  const maxLen = Math.max(cleanA.length, cleanB.length);

  for (let i = 0; i < maxLen; i++) {
    if (cleanA[i] !== cleanB[i]) {
      mismatchIndices.push(i);
    }
  }

  return {
    matches: mismatchIndices.length === 0,
    mismatchIndices,
  };
}
