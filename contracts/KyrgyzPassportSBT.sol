// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title KyrgyzPassportSBT
 * @notice Educational/satirical Soulbound Token contract representing Kyrgyz Republic passport.
 */
contract KyrgyzPassportSBT is ERC721, ERC721URIStorage {
    /// @notice Mapping from passport PIN to token ID (to prevent duplicate PINs)
    mapping(string => bool) private _pinUsed;
    /// @notice Mapping from address to whether they have minted a passport
    mapping(address => bool) private _hasPassport;
    /// @notice Mapping from token ID to passport PIN
    mapping(uint256 => string) private _tokenIdToPin;
    /// @notice Error thrown when trying to transfer a soulbound token
    error TokenIsSoulbound();
    /// @notice Error thrown when passport PIN is already used
    error PinAlreadyUsed();
    /// @notice Error thrown when address already has a passport
    error AddressAlreadyHasPassport();
    /// @notice Error thrown when passport PIN length is invalid (must be 14 characters)
    error InvalidPinLength();
    /**
     * @notice Emitted when a new passport is issued
     * @param citizen Address of the citizen receiving the passport
     * @param tokenId The token ID of the minted passport
     * @param passportPin The passport PIN used for minting
     */
    event PassportIssued(
        address indexed citizen,
        uint256 indexed tokenId,
        string passportPin
    );

    constructor() ERC721("Kyrgyz Passport SBT", "KGPASSPORT") {}

    function mint(string memory passportPin) public {
        bytes memory pinBytes = bytes(passportPin);
        if (pinBytes.length != 14) {
            revert InvalidPinLength();
        }
        if (_hasPassport[msg.sender]) {
            revert AddressAlreadyHasPassport();
        }


        uint256 tokenId = calculateTokenId(passportPin);

        if (_pinUsed[passportPin]) {
            revert PinAlreadyUsed();
        }
        _pinUsed[passportPin] = true;

        _hasPassport[msg.sender] = true;
        _tokenIdToPin[tokenId] = passportPin;

        // Mint the token
        _safeMint(msg.sender, tokenId);

        // emit event
        emit PassportIssued(msg.sender, tokenId, passportPin);
    }


    function calculateTokenId(
        string memory passportPin
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(passportPin)));
    }


    function hasPassport(address citizen) public view returns (bool) {
        return _hasPassport[citizen];
    }

    function isPinUsed(string memory passportPin) public view returns (bool) {
        return _pinUsed[passportPin];
    }


    function getPinByTokenId(
        uint256 tokenId
    ) public view returns (string memory) {
        return _tokenIdToPin[tokenId];
    }

 
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override(ERC721) {
        revert TokenIsSoulbound();
    }


    function safeTransferFrom(
        address,
        address,
        uint256
    ) public pure override(ERC721) {
        revert TokenIsSoulbound();
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override(ERC721) {
        revert TokenIsSoulbound();
    }


    function approve(address, uint256) public pure override(ERC721) {
        revert TokenIsSoulbound();
    }


    function setApprovalForAll(address, bool) public pure override(ERC721) {
        revert TokenIsSoulbound();
    }


    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return string(abi.encodePacked(BASE_URI, _toString(tokenId)));
    }


    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

