import type { CallCase, NormalizedCallDetails } from "../../shared/callSchema";

type InitiateCallResponse = {
  conversationId: string;
  callSid: string | null;
  status: "initiated";
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

export async function initiateCall(caseId: string, toNumber: string): Promise<InitiateCallResponse> {
  return requestJson<InitiateCallResponse>("/api/calls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId, toNumber }),
  });
}

export async function fetchCall(conversationId: string, signal?: AbortSignal) {
  return requestJson<NormalizedCallDetails>(`/api/calls/${encodeURIComponent(conversationId)}`, {
    signal,
  });
}
