// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { TwilioCallClient } from "./twilioClient";

const callSid = `CA${"a".repeat(32)}`;

describe("TwilioCallClient", () => {
  it("reads the current carrier state", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "ringing" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new TwilioCallClient({ accountSid: "AC123", authToken: "secret", fetchImpl });

    await expect(client.getStatus(callSid)).resolves.toBe("ringing");
    expect(fetchImpl.mock.calls[0]?.[0]).toContain(`/Calls/${callSid}.json`);
  });

  it("ends an active call through Twilio", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ status: "completed" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new TwilioCallClient({ accountSid: "AC123", authToken: "secret", fetchImpl });

    await client.endCall(callSid);

    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      authorization: `Basic ${Buffer.from("AC123:secret").toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    });
    expect(String(init?.body)).toBe("Status=completed");
  });
});
