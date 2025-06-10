import { vi } from "vitest";

// Mock Human ID SDK functions
export const mockInitHumanID = vi.fn();
export const mockGetKeygenMessage = vi.fn();
export const mockRequestSBT = vi.fn();
export const mockPrivateRequestSBT = vi.fn();
export const mockSetOptimismRpcUrl = vi.fn();
export const mockGetPhoneSBTByAddress = vi.fn();
export const mockGetKycSBTByAddress = vi.fn();
export const mockUncheckedGetMinimalPhoneSBTByAddress = vi.fn();
export const mockUncheckedGetMinimalKycSBTByAddress = vi.fn();

// Mock Human ID provider instance
const mockHumanIDProvider = {
  getKeygenMessage: mockGetKeygenMessage,
  requestSBT: mockRequestSBT,
  privateRequestSBT: mockPrivateRequestSBT,
};

// Default mock implementations
mockInitHumanID.mockReturnValue(mockHumanIDProvider);
mockGetKeygenMessage.mockReturnValue("Sign this message to generate your HumanID verification key");
mockRequestSBT.mockResolvedValue({
  sbt: {
    recipient: "0x123456789...",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    chain: "Optimism",
  },
});
mockPrivateRequestSBT.mockResolvedValue({
  sbt: {
    recipient: "0x123456789...",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
    chain: "Optimism",
  },
});

// Mock query functions
mockGetPhoneSBTByAddress.mockResolvedValue({
  expiry: BigInt(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  publicValues: [BigInt("0x0"), BigInt("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")], // [0, nullifier]
  revoked: false,
});
mockGetKycSBTByAddress.mockResolvedValue(null);
mockUncheckedGetMinimalPhoneSBTByAddress.mockResolvedValue([BigInt(Date.now()), true]); // [expiry, hasPhone]
mockUncheckedGetMinimalKycSBTByAddress.mockResolvedValue(null);

// Export functions
export const initHumanID = mockInitHumanID;
export const setOptimismRpcUrl = mockSetOptimismRpcUrl;
export const getPhoneSBTByAddress = mockGetPhoneSBTByAddress;
export const getKycSBTByAddress = mockGetKycSBTByAddress;
export const uncheckedGetMinimalPhoneSBTByAddress = mockUncheckedGetMinimalPhoneSBTByAddress;
export const uncheckedGetMinimalKycSBTByAddress = mockUncheckedGetMinimalKycSBTByAddress;

// Reset all mocks function for tests
export const resetHumanIDMocks = () => {
  mockInitHumanID.mockClear();
  mockGetKeygenMessage.mockClear();
  mockRequestSBT.mockClear();
  mockPrivateRequestSBT.mockClear();
  mockSetOptimismRpcUrl.mockClear();
  mockGetPhoneSBTByAddress.mockClear();
  mockGetKycSBTByAddress.mockClear();
  mockUncheckedGetMinimalPhoneSBTByAddress.mockClear();
  mockUncheckedGetMinimalKycSBTByAddress.mockClear();
};
