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

export interface CallProvider {
  initiateCall(input: InitiateProviderCallInput): Promise<InitiateProviderCallResult>;
  getCall(conversationId: string): Promise<NormalizedCallDetails>;
}
