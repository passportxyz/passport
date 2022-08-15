module.exports = {
  utils: {
    getAddress: (address) => {
      return address;
    },
    verifyMessage: () => {
      return "0x0";
    },
    formatUnits: (num, power) => {
      return (num * 1.0) / Math.pow(10, power);
    },
  },
};
