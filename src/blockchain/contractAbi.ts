export const CERTIFICATE_REGISTRY_ABI = [
  "constructor()",
  "event CertificateIssued(string indexed verificationId, bytes32 indexed certificateHash, address indexed issuer, uint256 issuedAt, string certificateType)",
  "event CertificateRevoked(string indexed verificationId, address indexed revokedBy, uint256 revokedAt, string reason)",
  "event IssuerAuthorized(address indexed issuer, string institutionName)",
  "event IssuerDeauthorized(address indexed issuer)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  
  "function issueCertificate(string _verificationId, bytes32 _certificateHash, string _certificateType, bytes32 _recipientHash) external",
  "function revokeCertificate(string _verificationId, string _reason) external",
  "function verifyCertificate(string _verificationId, bytes32 _candidateHash) external view returns (bool exists, bool isValid, bool isRevoked, address issuer, uint256 issuedAt)",
  "function getCertificate(string _verificationId) external view returns (string verificationId, bytes32 certificateHash, address issuer, uint256 issuedAt, string certificateType, bytes32 recipientHash, bool revoked, uint256 revokedAt, string revocationReason)",
  "function isRevoked(string _verificationId) external view returns (bool)",
  "function authorizeIssuer(address _issuer, string _institutionName) external",
  "function deauthorizeIssuer(address _issuer) external",
  "function isIssuerAuthorized(address _issuer) external view returns (bool)",
  "function getIssuerInstitution(address _issuer) external view returns (string)",
  "function totalCertificates() external view returns (uint256)",
  "function totalRevoked() external view returns (uint256)",
  "function getAllVerificationIds() external view returns (string[])",
  "function owner() external view returns (address)"
];
