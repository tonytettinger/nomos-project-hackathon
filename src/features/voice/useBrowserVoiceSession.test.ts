import { describe, expect, it } from "vitest";
import type { TranscriptTurn } from "../../../shared/callSchema";
import { appendDistinctTurn } from "./useBrowserVoiceSession";

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
