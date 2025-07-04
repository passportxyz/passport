export enum OnChainStatus {
  LOADING,
  NOT_MOVED,
  MOVED_OUT_OF_DATE, // Moved but score does not match
  MOVED_UP_TO_DATE,
  MOVED_EXPIRED,
}

export const onChainStatusString = (status: OnChainStatus): string => {
  switch (status) {
    case OnChainStatus.LOADING:
      return "LOADING";
    case OnChainStatus.NOT_MOVED:
      return "NOT_MOVED";
    case OnChainStatus.MOVED_OUT_OF_DATE:
      return "MOVED_OUT_OF_DATE";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "MOVED_UP_TO_DATE";
    case OnChainStatus.MOVED_EXPIRED:
      return "MOVED_EXPIRED";
    default:
      return "unknown";
  }
};
