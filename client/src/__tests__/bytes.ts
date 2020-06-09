import * as Bytes from "../utils/bytes";
import { expect } from "chai";

describe("programDataToIds", () => {
  it("ids = []", () => {
    const ids = Bytes.programDataToIds(new Uint8Array([0]));
    expect(ids).to.eql([]);
  });

  it("ids = [0]", () => {
    const ids = Bytes.programDataToIds(new Uint8Array([128]));
    expect(ids).to.eql([0]);
  });

  it("ids = [8]", () => {
    const ids = Bytes.programDataToIds(new Uint8Array([0, 128]));
    expect(ids).to.eql([8]);
  });

  it("ids = [7, 8]", () => {
    const ids = Bytes.programDataToIds(new Uint8Array([1, 128]));
    expect(ids).to.eql([7, 8]);
  });
});

describe("instructionDataFromId", () => {
  it("id = 0", () => {
    const data = Bytes.instructionDataFromId(0);
    expect(data).to.eql(new Uint8Array([0, 0]));
  });

  it("id = 8", () => {
    const data = Bytes.instructionDataFromId(8);
    expect(data).to.eql(new Uint8Array([0, 8]));
  });

  it("id = 257", () => {
    const data = Bytes.instructionDataFromId(257);
    expect(data).to.eql(new Uint8Array([1, 1]));
  });
});
