const oneDay = 24 * 60 * 60 * 1000;

export const getDaysToExpiration = ({ expirationDate }: { expirationDate: Date | string }): number => {
  const now = new Date().getTime();
  const expirationMillis = new Date(expirationDate).getTime();

  const daysUntilExpiration = (expirationMillis - now) / oneDay;

  return Math.floor(daysUntilExpiration);
};
