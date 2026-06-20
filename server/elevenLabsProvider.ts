import {
  callStatusSchema,
  toDynamicVariables,
  type CallStatus,
  type NormalizedCallDetails,
  type TranscriptTurn,
  type TelephonyStatus,
} from "../shared/callSchema";
import type {
  CancelProviderCallInput,
  CallProvider,
  GetProviderCallInput,
  InitiateProviderCallInput,
  InitiateProviderCallResult,
} from "./types";
import type { TwilioCallClient } from "./twilioClient";

const API_BASE_URL = "https://api.elevenlabs.io/v1/convai";

type ElevenLabsProviderConfig = {
  apiKey: string;
  agentId: string;
  phoneNumberId: string;
  twilioClient?: TwilioCallClient;
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
  readonly canCancel: boolean;

  constructor(private readonly config: ElevenLabsProviderConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.canCancel = Boolean(config.twilioClient);
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

    const callSid =
      typeof payload?.callSid === "string"
        ? payload.callSid
        : typeof payload?.call_sid === "string"
          ? payload.call_sid
          : null;

    return {
      conversationId,
      callSid,
      status: "initiated",
    };
  }

  async getCall({ conversationId, callSid }: GetProviderCallInput): Promise<NormalizedCallDetails> {
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

    let telephonyStatus: TelephonyStatus | null = null;
    if (this.config.twilioClient && callSid) {
      try {
        telephonyStatus = await this.config.twilioClient.getStatus(callSid);
      } catch (error) {
        console.warn("[calls] Twilio status lookup failed", {
          conversationId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return normalizeConversation(payload, conversationId, telephonyStatus);
  }

  async cancelCall({ conversationId, callSid }: CancelProviderCallInput): Promise<void> {
    if (!this.config.twilioClient) {
      throw new ProviderRequestError(
        "Cancellation is not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to the server environment.",
        501,
      );
    }
    await this.config.twilioClient.endCall(callSid);
    console.info("[calls] Twilio call cancelled", { conversationId, callSid });
  }
}

export function normalizeConversation(
  payload: ElevenLabsConversation | null,
  fallbackConversationId: string,
  telephonyStatus: TelephonyStatus | null = null,
): NormalizedCallDetails {
  const parsedStatus = callStatusSchema.safeParse(payload?.status);
  const providerStatus: CallStatus = parsedStatus.success ? parsedStatus.data : "processing";
  const status = reconcileStatus(providerStatus, telephonyStatus);
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
    telephonyStatus,
    error:
      status === "failed"
        ? terminalTelephonyError(telephonyStatus) ??
          (typeof metadata?.termination_reason === "string" ? metadata.termination_reason : null) ??
          "The call failed"
        : null,
  };
}

function reconcileStatus(providerStatus: CallStatus, telephonyStatus: TelephonyStatus | null): CallStatus {
  if (providerStatus === "done" || providerStatus === "failed") return providerStatus;
  if (telephonyStatus === "in-progress") return "in-progress";
  if (telephonyStatus === "completed") return "processing";
  if (
    telephonyStatus === "busy" ||
    telephonyStatus === "failed" ||
    telephonyStatus === "no-answer" ||
    telephonyStatus === "canceled"
  ) {
    return "failed";
  }
  return providerStatus;
}

function terminalTelephonyError(status: TelephonyStatus | null) {
  switch (status) {
    case "busy":
      return "The destination number was busy.";
    case "no-answer":
      return "The destination did not answer.";
    case "canceled":
      return "The call was cancelled before it connected.";
    case "failed":
      return "Twilio could not connect the call.";
    default:
      return null;
  }
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
