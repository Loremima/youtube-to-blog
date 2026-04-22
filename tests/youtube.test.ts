import { describe, it, expect } from "vitest";
import {
  extractVideoId,
  normalizeUrl,
  InvalidYouTubeUrlError,
} from "../src/lib/youtube";

describe("extractVideoId", () => {
  it("accepts bare 11-char IDs", () => {
    expect(extractVideoId("z9CwM-DAe5Q")).toBe("z9CwM-DAe5Q");
  });
  it("parses youtu.be URLs", () => {
    expect(extractVideoId("https://youtu.be/z9CwM-DAe5Q")).toBe("z9CwM-DAe5Q");
    expect(extractVideoId("https://youtu.be/z9CwM-DAe5Q?si=abc")).toBe(
      "z9CwM-DAe5Q",
    );
  });
  it("parses youtube.com/watch URLs", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=z9CwM-DAe5Q")).toBe(
      "z9CwM-DAe5Q",
    );
    expect(
      extractVideoId("https://m.youtube.com/watch?v=z9CwM-DAe5Q&t=10"),
    ).toBe("z9CwM-DAe5Q");
  });
  it("parses /shorts/ URLs", () => {
    expect(extractVideoId("https://youtube.com/shorts/z9CwM-DAe5Q")).toBe(
      "z9CwM-DAe5Q",
    );
  });
  it("parses /embed/ URLs", () => {
    expect(extractVideoId("https://www.youtube.com/embed/z9CwM-DAe5Q")).toBe(
      "z9CwM-DAe5Q",
    );
  });
  it("rejects invalid URLs", () => {
    expect(() => extractVideoId("https://vimeo.com/abc")).toThrow(
      InvalidYouTubeUrlError,
    );
    expect(() => extractVideoId("not a url")).toThrow(InvalidYouTubeUrlError);
    expect(() => extractVideoId("https://youtube.com/watch?v=short")).toThrow();
  });
});

describe("normalizeUrl", () => {
  it("returns canonical watch URL", () => {
    expect(normalizeUrl("https://youtu.be/z9CwM-DAe5Q")).toBe(
      "https://www.youtube.com/watch?v=z9CwM-DAe5Q",
    );
  });
});
