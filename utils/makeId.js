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
