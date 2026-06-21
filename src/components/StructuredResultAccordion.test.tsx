import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StructuredResultAccordion } from "./StructuredResultAccordion";

describe("StructuredResultAccordion", () => {
  it("renders the extracted result as a table", () => {
    render(
      <StructuredResultAccordion
        status="done"
        error={null}
        result={{
          outcome: "processing_confirmed",
          vorgangsnummer: null,
          stall_reason: null,
          expected_resolution: "Tomorrow",
          resubmission_required: false,
          next_action: "Wait for confirmation",
          summary: "Processing was confirmed.",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Structured result/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Processing Confirmed")).toBeInTheDocument();
    expect(screen.getAllByText("Not stated")).toHaveLength(2);
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("shows analysis progress", () => {
    render(<StructuredResultAccordion status="loading" result={null} error={null} />);
    expect(screen.getByText("Analyzing transcript…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Structured result/i })).toBeDisabled();
  });
});
