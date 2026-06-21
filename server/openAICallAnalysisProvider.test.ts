// @vitest-environment node

import { generateText } from "ai";
import { describe, expect, it, vi } from "vitest";
import type { StructuredCallResult } from "../shared/callSchema";
import { OpenAICallAnalysisProvider } from "./openAICallAnalysisProvider";

const result: StructuredCallResult = {
  outcome: "processing_confirmed",
  vorgangsnummer: "V-123",
  stall_reason: null,
  expected_resolution: "Tomorrow",
  resubmission_required: false,
  next_action: "Wait for confirmation",
  summary: "The registration will be processed tomorrow.",
};

describe("OpenAICallAnalysisProvider", () => {
  it("returns the schema-validated structured extraction", async () => {
    const generateMock = vi.fn().mockResolvedValue({ output: result });
    const generateTextImpl = generateMock as unknown as typeof generateText;
    const provider = new OpenAICallAnalysisProvider({
      apiKey: "server-secret",
      model: "gpt-5.4-mini",
      generateTextImpl,
    });

    await expect(
      provider.analyze({
        callCase: {
          id: "CASE-B",
          case_title: "Reminder / Nachfassen",
          lieferant: "Nomos GmbH",
          vnb_name: "Rheinland Netz AG",
          malo_id: "48820037615",
        },
        transcript: [
          { role: "user", message: "It will be processed tomorrow. No resubmission is needed.", timeInCallSeconds: 8 },
        ],
      }),
    ).resolves.toEqual(result);

    const options = generateMock.mock.calls[0]?.[0];
    expect(options?.providerOptions).toEqual({ openai: { store: false } });
    expect(options?.system).toContain("Never infer or invent");
  });
});
