import { z } from "zod";

const requiredText = z.string().refine((value) => value.trim().length > 0, {
  message: "Required value is empty",
});

const optionalText = z.string().optional();

export const callCaseSchema = z.object({
  id: requiredText,
  case_title: requiredText,
  lieferant: requiredText,
  vnb_name: requiredText,
  malo_id: z.string().regex(/^\d{11}$/, "MaLo must contain exactly 11 digits"),
  lieferstelle: optionalText,
  zaehlernummer: optionalText,
  anmeldung_datum: optionalText,
  lieferbeginn: optionalText,
  statustext: optionalText,
  symptom: optionalText,
  goal: optionalText,
});

export const callCasesSchema = z.array(callCaseSchema).min(1);
export type CallCase = z.infer<typeof callCaseSchema>;

export const e164Schema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid international number, for example +493012345678");

export const initiateCallSchema = z.object({
  caseId: requiredText,
  toNumber: e164Schema,
});

export const callStatusSchema = z.enum([
  "initiated",
  "in-progress",
  "processing",
  "done",
  "failed",
]);

export const telephonyStatusSchema = z.enum([
  "queued",
  "initiated",
  "ringing",
  "in-progress",
  "completed",
  "busy",
  "failed",
  "no-answer",
  "canceled",
]);

export type TelephonyStatus = z.infer<typeof telephonyStatusSchema>;

export type CallStatus = z.infer<typeof callStatusSchema>;

export const transcriptTurnSchema = z.object({
  role: z.enum(["agent", "user", "system"]),
  message: z.string().min(1).max(10_000),
  timeInCallSeconds: z.number().nonnegative().nullable(),
});

export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;

export const structuredCallResultSchema = z.object({
  outcome: z
    .enum(["processing_confirmed", "stall_explained", "unresolved"])
    .describe("The clearest overall outcome explicitly supported by the conversation."),
  vorgangsnummer: z
    .string()
    .max(200)
    .nullable()
    .describe("The explicitly stated Vorgangsnummer, otherwise null."),
  stall_reason: z
    .string()
    .max(1_000)
    .nullable()
    .describe("The explicitly stated reason for the processing stall, otherwise null."),
  expected_resolution: z
    .string()
    .max(1_000)
    .nullable()
    .describe("The explicitly stated processing or resolution timeframe, otherwise null."),
  resubmission_required: z
    .boolean()
    .nullable()
    .describe("Whether resubmission was explicitly required; null when not stated."),
  next_action: z
    .string()
    .max(1_000)
    .nullable()
    .describe("The next action explicitly agreed during the conversation, otherwise null."),
  summary: z
    .string()
    .min(1)
    .max(1_000)
    .describe("A concise factual summary containing no inferred or invented facts."),
});

export type StructuredCallResult = z.infer<typeof structuredCallResultSchema>;

export const analyzeConversationSchema = z.object({
  caseId: requiredText,
  transcript: z.array(transcriptTurnSchema).min(1).max(200),
});

export type NormalizedCallDetails = {
  conversationId: string;
  status: CallStatus;
  transcript: TranscriptTurn[];
  durationSeconds: number | null;
  startedAt: string | null;
  structuredResult: Record<string, unknown> | null;
  telephonyStatus: TelephonyStatus | null;
  error: string | null;
};

export const cancelCallSchema = z.object({
  callSid: z.string().regex(/^CA[0-9a-fA-F]{32}$/, "A valid Twilio call SID is required"),
});

const unresolvedValuePattern = /^(?:null|undefined|n\/a|\{\{.*\}\}|\[.*\])$/i;

export function toDynamicVariables(callCase: CallCase): Record<string, string> {
  return Object.fromEntries(
    Object.entries(callCase).filter((entry): entry is [string, string] => {
      const value = entry[1];
      return typeof value === "string" && value.trim().length > 0 && !unresolvedValuePattern.test(value.trim());
    }),
  );
}
