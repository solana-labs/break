export function toIds(bytes: Uint8Array): Array<number> {
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

export function fromId(id: number, length: number): Uint8Array {
  if (id >= 8 * length || id < 0 || !Number.isInteger(id)) {
    throw new Error("invalid id");
  }

  const bytes = new Uint8Array(length);
  const byteIndex = Math.floor(id / 8);
  const bitIndex = id % 8;
  bytes[byteIndex] = 1 << (7 - bitIndex);
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
