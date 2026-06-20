import type { NormalizedCallDetails, TranscriptTurn } from "../shared/callSchema";
import type {
  CallProvider,
  InitiateProviderCallInput,
  InitiateProviderCallResult,
} from "./types";

type MockConversation = {
  startedAt: number;
  toNumber: string;
  caseId: string;
  cancelled: boolean;
};

const transcript: TranscriptTurn[] = [
  {
    role: "agent",
    message: "Hello, I’m calling on behalf of Nomos about a registration that has not yet been confirmed.",
    timeInCallSeconds: 0,
  },
  {
    role: "user",
    message: "Yes, please give me the MaLo so I can find the registration.",
    timeInCallSeconds: 5,
  },
  {
    role: "agent",
    message: "The MaLo is four, eight, eight — two, zero, zero — three, seven, six — one, five.",
    timeInCallSeconds: 9,
  },
  {
    role: "user",
    message: "I found it. The registration is in process and the confirmation will be sent tomorrow.",
    timeInCallSeconds: 18,
  },
];

export class MockCallProvider implements CallProvider {
  readonly canCancel = true;
  private readonly conversations = new Map<string, MockConversation>();

  async initiateCall(input: InitiateProviderCallInput): Promise<InitiateProviderCallResult> {
    const conversationId = `demo-${crypto.randomUUID()}`;
    this.conversations.set(conversationId, {
      startedAt: Date.now(),
      toNumber: input.toNumber,
      caseId: input.callCase.id,
      cancelled: false,
    });

    return {
      conversationId,
      callSid: `CA${crypto.randomUUID().replaceAll("-", "")}`,
      status: "initiated",
    };
  }

  async getCall({ conversationId }: { conversationId: string; callSid: string | null }): Promise<NormalizedCallDetails> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error("Demo conversation not found");

    const elapsedSeconds = Math.floor((Date.now() - conversation.startedAt) / 1000);
    const status = conversation.cancelled
      ? "failed"
      : elapsedSeconds < 2
        ? "initiated"
        : elapsedSeconds < 7
          ? "in-progress"
          : elapsedSeconds < 10
            ? "processing"
            : "done";

    return {
      conversationId,
      status,
      transcript: status === "done" ? transcript : [],
      durationSeconds: status === "done" ? 24 : elapsedSeconds,
      startedAt: new Date(conversation.startedAt).toISOString(),
      structuredResult: null,
      telephonyStatus: conversation.cancelled
        ? "canceled"
        : status === "in-progress"
          ? "in-progress"
          : status === "done"
            ? "completed"
            : "ringing",
      error: conversation.cancelled ? "Call cancelled by user." : null,
    };
  }

  async cancelCall({ conversationId }: { conversationId: string; callSid: string }): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error("Demo conversation not found");
    conversation.cancelled = true;
  }
}
