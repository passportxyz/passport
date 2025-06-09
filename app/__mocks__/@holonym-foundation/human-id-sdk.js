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
mockRequestSBT.mockResolvedValue({ recipient: "0x123456789..." });
mockPrivateRequestSBT.mockResolvedValue({ recipient: "0x123456789..." });

// Mock query functions
mockGetPhoneSBTByAddress.mockResolvedValue({
  address: "0x123456789...",
  timestamp: Date.now(),
  isValid: true,
});
mockGetKycSBTByAddress.mockResolvedValue(null);
mockUncheckedGetMinimalPhoneSBTByAddress.mockResolvedValue({
  exists: true,
  address: "0x123456789...",
});
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
