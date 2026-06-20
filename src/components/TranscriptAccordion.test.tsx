import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TranscriptAccordion } from "./TranscriptAccordion";

describe("TranscriptAccordion", () => {
  it("starts collapsed and reveals conversation turns", () => {
    render(
      <TranscriptAccordion
        transcript={[{ role: "agent", message: "May I read the MaLo?", timeInCallSeconds: 2 }]}
      />,
    );

    const button = screen.getByRole("button", { name: /Transcript/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("May I read the MaLo?")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("May I read the MaLo?")).toBeInTheDocument();
  });
});
