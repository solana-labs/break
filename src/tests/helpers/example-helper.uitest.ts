import { exampleHelper } from "../../helpers/example";

describe("test pure function exampleHelper", () => {
  it("success", () => {
    const result = exampleHelper("Ben");
    expect(result).toEqual("Hello, Ben");
  });
});
