export const shortenAddress = (address) => (
  `${address.slice(0, 5)}...${address.length - 4}`
);

export const makeId = (lenght) => {
  let result = '';

  const charachters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charachtersLenght = charachters.length;

  for (let i = 0; i < lenght; i += 1) {
    result += charachters.charAt(Math.floor(Math.random()
      * charachtersLenght));
  }
  return result;
};
  /* eslint-disable no-param-reassign */
export const getCreators = (nfts) => {
  const craetors = nfts.reduce((creatorObject, nft) => {
    (creatorObject[nft.seller] = creatorObject[nft.seller] || []).push(nft);

    return creatorObject;
  }, {});
  return Object.entries(craetors).map((creator) => {
    const seller = creator[0];
    const sum = creator[1].map((item) => Number(item.price)).reduce((prev, curr) => prev + curr, 0);

    return ({ seller, sum });
  });
};
