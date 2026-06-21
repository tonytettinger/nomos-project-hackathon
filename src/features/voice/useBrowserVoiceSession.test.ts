import { describe, expect, it } from "vitest";
import type { TranscriptTurn } from "../../../shared/callSchema";
import { appendDistinctTurn, isFarewellMessage } from "./useBrowserVoiceSession";

const turn: TranscriptTurn = {
  role: "agent",
  message: "Hello",
  timeInCallSeconds: 1,
};

describe("browser voice transcript", () => {
  it("does not append duplicate SDK messages", () => {
    expect(appendDistinctTurn([turn], turn)).toEqual([turn]);
  });

  it("appends a new conversation turn", () => {
    const next: TranscriptTurn = { role: "user", message: "Hi", timeInCallSeconds: 2 };
    expect(appendDistinctTurn([turn], next)).toEqual([turn, next]);
  });
});

describe("farewell detection", () => {
  it.each([
    "Thank you. Goodbye!",
    "Okay, bye.",
    "Vielen Dank und auf Wiedersehen.",
    "Thank you for your help. Have a great day!",
    "Goodbye, and thank you for your help.",
    "Auf Wiedersehen und vielen Dank für Ihre Hilfe.",
  ])("detects a final farewell in: %s", (message) => {
    expect(isFarewellMessage(message)).toBe(true);
  });

  it("does not end when goodbye is mentioned without concluding", () => {
    expect(isFarewellMessage("Before I say goodbye, do you have the Vorgangsnummer?")).toBe(false);
  });
});
