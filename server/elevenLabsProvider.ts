import {
  callStatusSchema,
  toDynamicVariables,
  type CallStatus,
  type NormalizedCallDetails,
  type TranscriptTurn,
} from "../shared/callSchema";
import type {
  CallProvider,
  InitiateProviderCallInput,
  InitiateProviderCallResult,
} from "./types";

const API_BASE_URL = "https://api.elevenlabs.io/v1/convai";

type ElevenLabsProviderConfig = {
  apiKey: string;
  agentId: string;
  phoneNumberId: string;
  fetchImpl?: typeof fetch;
};

type ElevenLabsTranscriptTurn = {
  role?: unknown;
  message?: unknown;
  time_in_call_secs?: unknown;
};

type ElevenLabsConversation = {
  conversation_id?: unknown;
  status?: unknown;
  transcript?: unknown;
  metadata?: {
    start_time_unix_secs?: unknown;
    call_duration_secs?: unknown;
    termination_reason?: unknown;
  };
  analysis?: {
    data_collection_results?: unknown;
  } | null;
};

export class ProviderRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

export class ElevenLabsProvider implements CallProvider {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: ElevenLabsProviderConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async initiateCall(input: InitiateProviderCallInput): Promise<InitiateProviderCallResult> {
    const response = await this.fetchImpl(`${API_BASE_URL}/twilio/outbound-call`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xi-api-key": this.config.apiKey,
      },
      body: JSON.stringify({
        agent_id: this.config.agentId,
        agent_phone_number_id: this.config.phoneNumberId,
        to_number: input.toNumber,
        conversation_initiation_client_data: {
          dynamic_variables: toDynamicVariables(input.callCase),
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok) {
      throw new ProviderRequestError(readProviderError(payload, "Unable to start the call"), response.status);
    }

    const conversationId = typeof payload?.conversation_id === "string" ? payload.conversation_id : null;
    if (!conversationId) {
      throw new ProviderRequestError("ElevenLabs did not return a conversation ID");
    }

    return {
      conversationId,
      callSid: typeof payload?.callSid === "string" ? payload.callSid : null,
      status: "initiated",
    };
  }

  async getCall(conversationId: string): Promise<NormalizedCallDetails> {
    const response = await this.fetchImpl(`${API_BASE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
      headers: { "xi-api-key": this.config.apiKey },
    });

    const payload = (await response.json().catch(() => null)) as ElevenLabsConversation | null;
    if (!response.ok) {
      throw new ProviderRequestError(
        readProviderError(payload as Record<string, unknown> | null, "Unable to retrieve the call"),
        response.status,
      );
    }

    return normalizeConversation(payload, conversationId);
  }
}

export function normalizeConversation(
  payload: ElevenLabsConversation | null,
  fallbackConversationId: string,
): NormalizedCallDetails {
  const parsedStatus = callStatusSchema.safeParse(payload?.status);
  const status: CallStatus = parsedStatus.success ? parsedStatus.data : "processing";
  const metadata = payload?.metadata;
  const transcript = Array.isArray(payload?.transcript)
    ? payload.transcript.flatMap(normalizeTranscriptTurn)
    : [];
  const startTime = numberOrNull(metadata?.start_time_unix_secs);
  const structuredResult = isRecord(payload?.analysis?.data_collection_results)
    ? payload.analysis.data_collection_results
    : null;

  return {
    conversationId:
      typeof payload?.conversation_id === "string" ? payload.conversation_id : fallbackConversationId,
    status,
    transcript,
    durationSeconds: numberOrNull(metadata?.call_duration_secs),
    startedAt: startTime === null ? null : new Date(startTime * 1000).toISOString(),
    structuredResult,
    error:
      status === "failed" && typeof metadata?.termination_reason === "string"
        ? metadata.termination_reason || "The call failed"
        : null,
  };
}

function normalizeTranscriptTurn(value: unknown): TranscriptTurn[] {
  if (!isRecord(value)) return [];

  const turn = value as ElevenLabsTranscriptTurn;
  if (typeof turn.message !== "string" || turn.message.trim().length === 0) return [];

  const role = turn.role === "agent" || turn.role === "user" ? turn.role : "system";
  return [
    {
      role,
      message: turn.message,
      timeInCallSeconds: numberOrNull(turn.time_in_call_secs),
    },
  ];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readProviderError(payload: Record<string, unknown> | null, fallback: string): string {
  const detail = payload?.detail;
  if (typeof detail === "string") return detail;
  if (isRecord(detail) && typeof detail.message === "string") return detail.message;
  return fallback;
}
