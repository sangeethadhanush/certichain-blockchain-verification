// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Decentralized, tamper-evident registry for academic and professional certificates.
 * Implements deterministic SHA-256 hash storage, issuer authorization, and revocation control.
 */
contract CertificateRegistry {
    // --- Data Structures ---

    struct Certificate {
        string verificationId;      // Unique non-sequential identifier (e.g. CERT-7F4A92C1)
        bytes32 certificateHash;    // SHA-256 hash of canonical certificate data
        address issuer;             // Wallet address of issuing authority
        uint256 issuedAt;           // Unix timestamp when registered on-chain
        string certificateType;     // e.g. Degree, Professional Certificate, Diploma
        bytes32 recipientHash;      // Privacy-preserving hash of recipient ID
        bool revoked;               // Revocation state flag
        uint256 revokedAt;          // Timestamp of revocation (0 if active)
        string revocationReason;    // Reason for revocation
    }

    // --- State Variables ---

    address public owner;
    
    // Mapping from verification ID to Certificate
    mapping(string => Certificate) private certificates;
    
    // Mapping to check if a verification ID already exists
    mapping(string => bool) public certificateExists;
    
    // Mapping of authorized issuer addresses
    mapping(address => bool) public authorizedIssuers;
    
    // Mapping of issuer metadata (Institution name)
    mapping(address => string) public issuerInstitutions;

    // Total certificate counter
    uint256 public totalCertificates;
    
    // Total revoked counter
    uint256 public totalRevoked;

    // Array of all verification IDs for enumeration
    string[] public allVerificationIds;

    // --- Events ---

    event CertificateIssued(
        string indexed verificationId,
        bytes32 indexed certificateHash,
        address indexed issuer,
        uint256 issuedAt,
        string certificateType
    );

    event CertificateRevoked(
        string indexed verificationId,
        address indexed revokedBy,
        uint256 revokedAt,
        string reason
    );

    event IssuerAuthorized(address indexed issuer, string institutionName);
    event IssuerDeauthorized(address indexed issuer);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "CertiChain: Caller is not contract owner");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "CertiChain: Caller is not an authorized issuer"
        );
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
        // Authorize deployer by default
        authorizedIssuers[msg.sender] = true;
        issuerInstitutions[msg.sender] = "CertiChain Root Authority";
        emit IssuerAuthorized(msg.sender, "CertiChain Root Authority");
    }

    // --- Issuer Management ---

    function authorizeIssuer(address _issuer, string calldata _institutionName) external onlyOwner {
        require(_issuer != address(0), "CertiChain: Invalid address");
        authorizedIssuers[_issuer] = true;
        issuerInstitutions[_issuer] = _institutionName;
        emit IssuerAuthorized(_issuer, _institutionName);
    }

    function deauthorizeIssuer(address _issuer) external onlyOwner {
        require(_issuer != owner, "CertiChain: Cannot deauthorize contract owner");
        authorizedIssuers[_issuer] = false;
        emit IssuerDeauthorized(_issuer);
    }

    function isIssuerAuthorized(address _issuer) external view returns (bool) {
        return authorizedIssuers[_issuer];
    }

    function getIssuerInstitution(address _issuer) external view returns (string memory) {
        return issuerInstitutions[_issuer];
    }

    // --- Certificate Issuance ---

    /**
     * @notice Registers a new certificate on the blockchain.
     * @param _verificationId Unique identifier (e.g. CERT-7F4A92C1)
     * @param _certificateHash Cryptographic SHA-256 hash of canonical certificate data
     * @param _certificateType Classification of the credential
     * @param _recipientHash SHA-256 hash of the recipient's identifier (privacy protection)
     */
    function issueCertificate(
        string calldata _verificationId,
        bytes32 _certificateHash,
        string calldata _certificateType,
        bytes32 _recipientHash
    ) external onlyAuthorizedIssuer {
        require(bytes(_verificationId).length > 0, "CertiChain: Verification ID cannot be empty");
        require(!certificateExists[_verificationId], "CertiChain: Verification ID already registered");
        require(_certificateHash != bytes32(0), "CertiChain: Invalid certificate hash");

        certificates[_verificationId] = Certificate({
            verificationId: _verificationId,
            certificateHash: _certificateHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            certificateType: _certificateType,
            recipientHash: _recipientHash,
            revoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        certificateExists[_verificationId] = true;
        allVerificationIds.push(_verificationId);
        totalCertificates++;

        emit CertificateIssued(
            _verificationId,
            _certificateHash,
            msg.sender,
            block.timestamp,
            _certificateType
        );
    }

    // --- Certificate Revocation ---

    /**
     * @notice Revokes a previously issued certificate.
     * Only the original issuer or the contract owner can revoke.
     * @param _verificationId Identifier of the certificate
     * @param _reason Justification for revocation
     */
    function revokeCertificate(
        string calldata _verificationId,
        string calldata _reason
    ) external {
        require(certificateExists[_verificationId], "CertiChain: Certificate does not exist");
        Certificate storage cert = certificates[_verificationId];
        
        require(!cert.revoked, "CertiChain: Certificate is already revoked");
        require(
            msg.sender == cert.issuer || msg.sender == owner,
            "CertiChain: Only original issuer or contract owner can revoke"
        );

        cert.revoked = true;
        cert.revokedAt = block.timestamp;
        cert.revocationReason = _reason;
        totalRevoked++;

        emit CertificateRevoked(_verificationId, msg.sender, block.timestamp, _reason);
    }

    // --- Verification & Read Queries ---

    /**
     * @notice Verifies whether a given certificate hash matches the stored on-chain record.
     * @param _verificationId Certificate identifier
     * @param _candidateHash Hash calculated from candidate certificate data
     * @return exists Whether the certificate is registered
     * @return isValid Whether the candidate hash matches the on-chain hash
     * @return isRevoked Whether the certificate has been revoked
     * @return issuer Address of the issuer
     * @return issuedAt Timestamp when issued
     */
    function verifyCertificate(
        string calldata _verificationId,
        bytes32 _candidateHash
    ) external view returns (
        bool exists,
        bool isValid,
        bool isRevoked,
        address issuer,
        uint256 issuedAt
    ) {
        if (!certificateExists[_verificationId]) {
            return (false, false, false, address(0), 0);
        }

        Certificate storage cert = certificates[_verificationId];
        bool hashMatches = (cert.certificateHash == _candidateHash);

        return (
            true,
            hashMatches && !cert.revoked,
            cert.revoked,
            cert.issuer,
            cert.issuedAt
        );
    }

    /**
     * @notice Retrieves full on-chain details for a certificate.
     */
    function getCertificate(string calldata _verificationId)
        external
        view
        returns (
            string memory verificationId,
            bytes32 certificateHash,
            address issuer,
            uint256 issuedAt,
            string memory certificateType,
            bytes32 recipientHash,
            bool revoked,
            uint256 revokedAt,
            string memory revocationReason
        )
    {
        require(certificateExists[_verificationId], "CertiChain: Certificate does not exist");
        Certificate storage cert = certificates[_verificationId];

        return (
            cert.verificationId,
            cert.certificateHash,
            cert.issuer,
            cert.issuedAt,
            cert.certificateType,
            cert.recipientHash,
            cert.revoked,
            cert.revokedAt,
            cert.revocationReason
        );
    }

    function isRevoked(string calldata _verificationId) external view returns (bool) {
        require(certificateExists[_verificationId], "CertiChain: Certificate does not exist");
        return certificates[_verificationId].revoked;
    }

    function getAllVerificationIds() external view returns (string[] memory) {
        return allVerificationIds;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "CertiChain: Invalid address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
