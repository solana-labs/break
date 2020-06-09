// Program data is stored as little-endian
// [0x1, 0x0] -> id #0, [0x0, 0x1] -> id #8
export function programDataToIds(bytes: Uint8Array): Array<number> {
  const ids = new Array<number>();
  bytes.forEach((byte, i) => {
    for (let j = 7; j >= 0; j--) {
      if ((byte & (1 << j)) === 1 << j) {
        ids.push(8 * i + (7 - j));
      }
    }
  });
  return ids;
}

// Instruction data uses big-endian
// id #0 -> [0x0, 0x0], id #256 -> [0x1, 0x0]
const MAX_ID = Math.pow(2, 16) - 1;
export function instructionDataFromId(id: number): Uint8Array {
  if (id > MAX_ID || id < 0 || !Number.isInteger(id)) {
    throw new Error("invalid id");
  }

  const bytes = new Uint8Array(2);
  bytes[0] = Math.floor(id / 256);
  bytes[1] = id % 256;
  return bytes;
}

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length !== b.length) throw new Error("bytes are not the same length");
  const bytes = new Uint8Array(a);
  for (let i = 0; i < b.length; i++) {
    bytes[i] ^= b[i];
  }
  return bytes;
}
