import type { CallCase, NormalizedCallDetails } from "../../shared/callSchema";

type InitiateCallResponse = {
  conversationId: string;
  callSid: string | null;
  status: "initiated";
};

export type ApiHealth = {
  ok: boolean;
  providerMode: "elevenlabs" | "mock";
  cancelEnabled: boolean;
  browserVoiceEnabled: boolean;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "The request could not be completed");
  }

  return payload as T;
}

export async function fetchCases(signal?: AbortSignal): Promise<CallCase[]> {
  const payload = await requestJson<{ cases: CallCase[] }>("/api/cases", { signal });
  return payload.cases;
}

export async function fetchHealth(signal?: AbortSignal): Promise<ApiHealth> {
  return requestJson<ApiHealth>("/api/health", { signal });
}

export async function fetchConversationToken(): Promise<string> {
  const payload = await requestJson<{ token: string }>("/api/agent/session-token", {
    method: "POST",
  });
  return payload.token;
}

export async function initiateCall(caseId: string, toNumber: string): Promise<InitiateCallResponse> {
  return requestJson<InitiateCallResponse>("/api/calls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId, toNumber }),
  });
}

export async function fetchCall(conversationId: string, callSid: string | null, signal?: AbortSignal) {
  const query = callSid ? `?callSid=${encodeURIComponent(callSid)}` : "";
  return requestJson<NormalizedCallDetails>(`/api/calls/${encodeURIComponent(conversationId)}${query}`, {
    signal,
  });
}

export async function cancelCall(conversationId: string, callSid: string) {
  return requestJson<{ success: true; message: string }>(
    `/api/calls/${encodeURIComponent(conversationId)}/cancel`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callSid }),
    },
  );
}
