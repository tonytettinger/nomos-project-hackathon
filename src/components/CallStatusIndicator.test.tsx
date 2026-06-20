import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallStatusIndicator } from "./CallStatusIndicator";

describe("CallStatusIndicator", () => {
  it.each([
    ["ready", "Ready to call"],
    ["in-progress", "Call in progress"],
    ["processing", "Finalizing transcript"],
    ["done", "Call finished"],
    ["failed", "Call could not be completed"],
  ] as const)("renders the %s state", (phase, label) => {
    render(<CallStatusIndicator phase={phase} elapsedSeconds={18} error={null} />);
    expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
  });
});
