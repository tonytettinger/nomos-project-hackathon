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

export type TranscriptTurn = {
  role: "agent" | "user" | "system";
  message: string;
  timeInCallSeconds: number | null;
};

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
