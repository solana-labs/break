import loaderReducer from "../../reducers/loader";

describe("test function loaderReducer", () => {
  it("set status loader", () => {
    const expectedState = {
      isActive: true
    };

    const action = {
      payload: true,
      type: "SET_STATUS_LOADER"
    };

    const result = loaderReducer(undefined, action);

    expect(result).toEqual(expectedState);
  });

  it("set status loader", () => {
    const expectedState = {
      isActive: false
    };

    const action = {
      payload: false,
      type: "SET_STATUS_LOADER"
    };

    const result = loaderReducer(undefined, action);

    expect(result).toEqual(expectedState);
  });

  it("set status loader", () => {
    const initState = {
      isActive: false
    };

    const action = {
      payload: false,
      type: "SET_STATUS_LOADER_1"
    };

    const result = loaderReducer(initState, action);

    expect(result).toEqual(initState);
  });
});
