import React from "react";
import TestRenderer, { act } from "react-test-renderer";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const mockGeist = jest.fn(
  (_options: { subsets: string[]; display: string }) => ({
    className: "geist-test-font",
  }),
);

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

jest.mock("next/font/google", () => ({
  Geist: (options: { subsets: string[]; display: string }) =>
    mockGeist(options),
}));

jest.mock("../OperationsPreviewClient", () => ({
  OperationsPreviewClient: () => <div data-testid="preview-client" />,
}));

describe("OperationsPreviewPage", () => {
  const previousFlag = process.env.OPERATIONS_PREVIEW_ENABLED;

  beforeEach(() => {
    jest.resetModules();
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
    mockGeist.mockReturnValue({ className: "geist-test-font" });
  });

  afterEach(() => {
    if (previousFlag === undefined) {
      delete process.env.OPERATIONS_PREVIEW_ENABLED;
    } else {
      process.env.OPERATIONS_PREVIEW_ENABLED = previousFlag;
    }
  });

  it.each([undefined, "false", "TRUE", "1"])(
    "returns not found when the server-only flag is %s",
    (flag) => {
      if (flag === undefined) {
        delete process.env.OPERATIONS_PREVIEW_ENABLED;
      } else {
        process.env.OPERATIONS_PREVIEW_ENABLED = flag;
      }
      const pageModule = require("../page") as typeof import("../page");

      expect(() => pageModule.default()).toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    },
  );

  it("renders only for exact true with force-dynamic and route-local Geist", async () => {
    process.env.OPERATIONS_PREVIEW_ENABLED = "true";
    const pageModule = require("../page") as typeof import("../page");

    expect(pageModule.dynamic).toBe("force-dynamic");
    expect(mockGeist).toHaveBeenCalledWith({
      subsets: ["latin"],
      display: "swap",
    });

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(pageModule.default());
    });
    const root = renderer.root;
    expect(root.findByProps({ className: "geist-test-font" })).toBeTruthy();
    expect(root.findByProps({ "data-testid": "preview-client" })).toBeTruthy();
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
