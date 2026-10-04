# CertiChain — Blockchain Digital Certificate Verification System

> **"Trust certificates through blockchain-backed verification."**

An enterprise-grade decentralized credential issuance and verification platform built to solve **ALG-BC-01**. CertiChain replaces forgeable PDF certificates with deterministic cryptographic hashes anchored permanently into EVM smart contracts.

---

## 1. Core Cryptographic Workflow

```
Issuer Dashboard
       │
       ▼
Input Credential Details (Title, Recipient, ID, Course, Institution, Issue Date)
       │
       ▼
Deterministic Canonical Serialization (Strict normalization & field ordering)
       │
       ▼
SHA-256 Digest Computation (0x... 32-byte hash)
       │
       ▼
Smart Contract Execution (`issueCertificate` on CertificateRegistry.sol)
       │
       ▼
Generate Unique Non-Sequential ID (`CERT-7F4A92C1`) + Public Verification QR
       │
       ▼
Public Verification Audit:
  1. Retrieve On-Chain Block Record
  2. Reconstruct Canonical Byte Stream
  3. Recompute SHA-256 Digest
  4. Compare Hashes (On-Chain Hash vs Recomputed Hash)
  5. Check Issuer Authority Signature
  6. Check Revocation Status & Expiry
       │
       ▼
Result: VERIFIED / TAMPERED (INTEGRITY FAILED) / REVOKED / EXPIRED / NOT FOUND
```

---

## 2. Smart Contract: `CertificateRegistry.sol`

Located at `/blockchain/contracts/CertificateRegistry.sol`:

- **Key Functions**:
  - `issueCertificate(string _verificationId, bytes32 _certificateHash, string _certificateType, bytes32 _recipientHash)`
  - `verifyCertificate(string _verificationId, bytes32 _candidateHash)`
  - `revokeCertificate(string _verificationId, string _reason)`
  - `isRevoked(string _verificationId)`
  - `getCertificate(string _verificationId)`
  - `authorizeIssuer(address _issuer, string _institutionName)`
  - `deauthorizeIssuer(address _issuer)`
- **Access Control**: Only authorized issuer addresses can issue or revoke credentials. Prevents duplicate verification IDs and unauthorized tampering.

---

## 3. Key Features

1. **Dual Blockchain Engine Architecture**:
   - **Local EVM Node Sandbox**: Built-in stateful Hardhat-compatible EVM execution engine with real ECDSA transaction hashes, mined blocks, gas accounting, and pre-seeded institutions (MIT Open Learning, Stanford Online, Oxford Credential Consortium).
   - **MetaMask / Web3 EIP-1193 Provider**: Connect any external EVM wallet to interact with live testnets (Sepolia, Hardhat local node at `127.0.0.1:8545`).
2. **Interactive Tamper Simulation Sandbox**:
   - Live testing suite on the verification page allowing anyone to alter certificate fields (e.g. changing course to "Cyber Security" or recipient name) and watch the SHA-256 digest diverge character-by-character in real time with an instant **⚠ INTEGRITY FAILED** status.
3. **On-Chain Revocation System**:
   - Authorized issuers can revoke credentials with recorded on-chain justification.
4. **QR Code Generation & Scanning**:
   - Instant QR code generation with direct verification link.
   - Built-in QR scanner supporting webcam and image drag-and-drop.
5. **High-Fidelity Diploma Presentation & Print**:
   - Guilloche borders, institution seals, verification badges, print stylesheet, and QR badges.
