import * as Bytes from "../utils/bytes";
import { expect } from "chai";

const TEST_BYTES_LEN = 16;

it("ids = []", () => {
  const ids = Bytes.toIds(new Uint8Array([0]));
  expect(ids).to.eql([]);
});

it("ids = [1]", () => {
  const ids = Bytes.toIds(Bytes.fromId(1, TEST_BYTES_LEN));
  expect(ids).to.eql([1]);
});

it("ids = [8]", () => {
  const ids = Bytes.toIds(Bytes.fromId(8, TEST_BYTES_LEN));
  expect(ids).to.eql([8]);
});

it("ids = [1, 2]", () => {
  const bytes = Bytes.xor(
    Bytes.fromId(1, TEST_BYTES_LEN),
    Bytes.fromId(2, TEST_BYTES_LEN)
  );
  const ids = Bytes.toIds(bytes);
  expect(ids).to.eql([1, 2]);
});

it("ids = [1, ...]", () => {
  const bytes = new Uint8Array(TEST_BYTES_LEN);
  for (let i = 0; i < TEST_BYTES_LEN; i++) {
    bytes[i] = 255;
  }
  const expected = new Array<number>();
  for (let i = 1; i <= 8 * TEST_BYTES_LEN; i++) {
    expected.push(i);
  }
  const ids = Bytes.toIds(bytes);
  expect(ids).to.eql(expected);
});
