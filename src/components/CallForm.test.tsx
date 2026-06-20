import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CallForm } from "./CallForm";

describe("CallForm", () => {
  it("uses a fixed ElevenLabs browser connection instead of a phone number", () => {
    render(
      <CallForm
        cases={[{
          id: "CASE-B",
          case_title: "Reminder / Nachfassen",
          lieferant: "Nomos GmbH",
          vnb_name: "Rheinland Netz AG",
          malo_id: "48820037615",
        }]}
        selectedCaseId="CASE-B"
        disabled={false}
        canSubmit
        onCaseChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByLabelText("ElevenLabs browser voice connection")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start voice test" })).toBeEnabled();
  });
});
