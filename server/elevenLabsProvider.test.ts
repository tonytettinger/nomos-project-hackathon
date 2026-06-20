// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import type { CallCase } from "../shared/callSchema";
import { ElevenLabsProvider, normalizeConversation } from "./elevenLabsProvider";

const callCase: CallCase = {
  id: "CASE-B",
  case_title: "Reminder / Nachfassen",
  lieferant: "Nomos GmbH",
  vnb_name: "Rheinland Netz AG",
  malo_id: "48820037615",
  lieferstelle: "Musterstraße 211, Köln-Ehrenfeld",
};

describe("ElevenLabsProvider", () => {
  it("sends the selected case as dynamic variables", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ success: true, conversation_id: "conv-1", callSid: "CA1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const provider = new ElevenLabsProvider({
      apiKey: "secret",
      agentId: "agent-1",
      phoneNumberId: "phone-1",
      fetchImpl,
    });

    await expect(provider.initiateCall({ toNumber: "+493012345678", callCase })).resolves.toEqual({
      conversationId: "conv-1",
      callSid: "CA1",
      status: "initiated",
    });

    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.headers).toEqual({ "content-type": "application/json", "xi-api-key": "secret" });
    expect(JSON.parse(String(init?.body))).toEqual({
      agent_id: "agent-1",
      agent_phone_number_id: "phone-1",
      to_number: "+493012345678",
      conversation_initiation_client_data: { dynamic_variables: callCase },
    });
  });
});

describe("normalizeConversation", () => {
  it("normalizes transcript, metadata, and phase-two structured data", () => {
    expect(
      normalizeConversation(
        {
          conversation_id: "conv-1",
          status: "done",
          transcript: [
            { role: "agent", message: "Hello", time_in_call_secs: 0 },
            { role: "user", message: "Found it", time_in_call_secs: 4 },
          ],
          metadata: { start_time_unix_secs: 1_700_000_000, call_duration_secs: 12 },
          analysis: { data_collection_results: { outcome: "status_confirmed" } },
        },
        "fallback",
      ),
    ).toMatchObject({
      conversationId: "conv-1",
      status: "done",
      durationSeconds: 12,
      structuredResult: { outcome: "status_confirmed" },
      transcript: [
        { role: "agent", message: "Hello", timeInCallSeconds: 0 },
        { role: "user", message: "Found it", timeInCallSeconds: 4 },
      ],
    });
  });
});
