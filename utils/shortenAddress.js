export const shortenAddress = (address) => (
  `${address.slice(0, 5)}...${address.length - 4}`
);
