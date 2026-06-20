import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CallStatusIndicator } from "./CallStatusIndicator";

const defaultProps = {
  elapsedSeconds: 18,
  error: null,
  isSpeaking: false,
  onEnd: () => undefined,
} as const;

describe("CallStatusIndicator", () => {
  it.each([
    ["ready", "Ready for voice test"],
    ["starting", "Connecting to ElevenLabs"],
    ["ending", "Ending voice test"],
    ["done", "Voice test finished"],
    ["failed", "Voice test could not start"],
  ] as const)("renders the %s state", (phase, label) => {
    render(<CallStatusIndicator {...defaultProps} phase={phase} />);
    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
  });

  it("shows whether the connected agent is listening or speaking", () => {
    const { rerender } = render(<CallStatusIndicator {...defaultProps} phase="connected" />);
    expect(screen.getByRole("heading", { name: "Agent is listening" })).toBeInTheDocument();

    rerender(<CallStatusIndicator {...defaultProps} phase="connected" isSpeaking />);
    expect(screen.getByRole("heading", { name: "Agent is speaking" })).toBeInTheDocument();
  });

  it("ends the browser voice session", () => {
    const onEnd = vi.fn();
    render(<CallStatusIndicator {...defaultProps} phase="connected" onEnd={onEnd} />);
    fireEvent.click(screen.getByRole("button", { name: "End voice test" }));
    expect(onEnd).toHaveBeenCalledOnce();
  });
});
