import type { CallCase, NormalizedCallDetails } from "../shared/callSchema";

export type InitiateProviderCallInput = {
  toNumber: string;
  callCase: CallCase;
};

export type InitiateProviderCallResult = {
  conversationId: string;
  callSid: string | null;
  status: "initiated";
};

export type GetProviderCallInput = {
  conversationId: string;
  callSid: string | null;
};

export type CancelProviderCallInput = {
  conversationId: string;
  callSid: string;
};

export interface CallProvider {
  readonly canCancel: boolean;
  initiateCall(input: InitiateProviderCallInput): Promise<InitiateProviderCallResult>;
  getCall(input: GetProviderCallInput): Promise<NormalizedCallDetails>;
  cancelCall(input: CancelProviderCallInput): Promise<void>;
}

export interface VoiceSessionProvider {
  createConversationToken(): Promise<string>;
}
