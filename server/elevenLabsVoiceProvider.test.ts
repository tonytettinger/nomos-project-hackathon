// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { ElevenLabsVoiceProvider } from "./elevenLabsVoiceProvider";

describe("ElevenLabsVoiceProvider", () => {
  it("creates a WebRTC conversation token without exposing the API key", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ token: "short-lived-token" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const provider = new ElevenLabsVoiceProvider({
      apiKey: "server-secret",
      agentId: "agent-1",
      fetchImpl,
    });

    await expect(provider.createConversationToken()).resolves.toBe("short-lived-token");
    expect(fetchImpl.mock.calls[0]?.[0]).toContain("agent_id=agent-1");
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toEqual({ "xi-api-key": "server-secret" });
  });

  it("falls back to public-agent authentication when the key lacks convai_write", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ detail: { message: "The API key is missing the permission convai_write" } }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "public-agent-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const provider = new ElevenLabsVoiceProvider({
      apiKey: "restricted-key",
      agentId: "agent-public",
      fetchImpl,
    });

    await expect(provider.createConversationToken()).resolves.toBe("public-agent-token");
    expect(fetchImpl.mock.calls[1]?.[1]?.headers).toBeUndefined();
  });
});
