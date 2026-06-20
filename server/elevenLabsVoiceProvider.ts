import { ProviderRequestError } from "./elevenLabsProvider";
import type { VoiceSessionProvider } from "./types";

type ElevenLabsVoiceProviderConfig = {
  apiKey: string;
  agentId: string;
  fetchImpl?: typeof fetch;
};

export class ElevenLabsVoiceProvider implements VoiceSessionProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: ElevenLabsVoiceProviderConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async createConversationToken(): Promise<string> {
    const query = new URLSearchParams({ agent_id: this.config.agentId });
    const url = `https://api.elevenlabs.io/v1/convai/conversation/token?${query}`;
    const authenticated = await this.requestToken(url, true);

    if (authenticated.response.ok) return readToken(authenticated.payload);

    if (authenticated.response.status === 401 && isMissingConvaiWrite(authenticated.payload)) {
      const publicAgent = await this.requestToken(url, false);
      if (publicAgent.response.ok) return readToken(publicAgent.payload);
    }

    throw new ProviderRequestError(readError(authenticated.payload), authenticated.response.status);
  }

  private async requestToken(url: string, authenticated: boolean) {
    const response = await this.fetchImpl(url, {
      headers: authenticated ? { "xi-api-key": this.config.apiKey } : undefined,
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { response, payload };
  }
}

function readToken(payload: Record<string, unknown> | null) {
  if (typeof payload?.token !== "string" || payload.token.length === 0) {
    throw new ProviderRequestError("ElevenLabs did not return a conversation token");
  }
  return payload.token;
}

function isMissingConvaiWrite(payload: Record<string, unknown> | null) {
  return readError(payload).includes("convai_write");
}

function readError(payload: Record<string, unknown> | null) {
  const detail = payload?.detail;
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unable to create an ElevenLabs browser voice session";
}
