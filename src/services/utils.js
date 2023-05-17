export function toHex(number) {
  const hexNumber = number.toString(16).toUpperCase();
  return hexNumber.length > 1 ? hexNumber : "0".concat(hexNumber);
}
