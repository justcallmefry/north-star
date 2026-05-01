import { detectAligned } from "./aligned";

describe("detectAligned", () => {
  it("returns none when no shared meaningful words", () => {
    expect(detectAligned("love coffee morning", "night sleep dark")).toBe("none");
  });

  it("returns none for 1 shared word", () => {
    expect(detectAligned("coffee morning light", "morning dark cold")).toBe("none");
  });

  it("returns aligned for 2 shared meaningful words", () => {
    expect(detectAligned("morning coffee ritual", "every morning coffee helps")).toBe("aligned");
  });

  it("returns aligned for 3 shared words", () => {
    expect(detectAligned("morning coffee ritual walk", "coffee ritual morning peaceful")).toBe("aligned");
  });

  it("returns deeplyAligned for 4+ shared words", () => {
    expect(
      detectAligned("morning coffee ritual walk together", "coffee morning walk ritual together peaceful")
    ).toBe("deeplyAligned");
  });

  it("ignores common stopwords", () => {
    expect(detectAligned("this that from with", "this that from with")).toBe("none");
  });

  it("is case-insensitive", () => {
    expect(detectAligned("Coffee Morning Walk Together", "coffee morning walk peaceful")).toBe("aligned");
  });

  it("returns none for empty strings", () => {
    expect(detectAligned("", "")).toBe("none");
  });

  it("deduplicates repeated words within one answer", () => {
    expect(detectAligned("coffee coffee coffee coffee coffee", "morning coffee light")).toBe("none");
  });
});
