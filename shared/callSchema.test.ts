import { describe, expect, it } from "vitest";
import {
  callCaseSchema,
  e164Schema,
  structuredCallResultSchema,
  toDynamicVariables,
} from "./callSchema";

const validCase = {
  id: "CASE-B",
  case_title: "Reminder / Nachfassen",
  lieferant: "Nomos GmbH",
  vnb_name: "Rheinland Netz AG",
  malo_id: "48820037615",
  lieferstelle: "Musterstraße 211, Köln-Ehrenfeld",
  zaehlernummer: "",
  anmeldung_datum: "{{anmeldung_datum}}",
};

describe("call case validation", () => {
  it("accepts an eleven-digit MaLo", () => {
    expect(callCaseSchema.parse(validCase).malo_id).toBe("48820037615");
  });

  it("rejects malformed MaLo values", () => {
    expect(() => callCaseSchema.parse({ ...validCase, malo_id: "4882" })).toThrow(
      "MaLo must contain exactly 11 digits",
    );
  });

  it("omits empty and unresolved dynamic variables without inventing values", () => {
    expect(toDynamicVariables(callCaseSchema.parse(validCase))).toEqual({
      id: "CASE-B",
      case_title: "Reminder / Nachfassen",
      lieferant: "Nomos GmbH",
      vnb_name: "Rheinland Netz AG",
      malo_id: "48820037615",
      lieferstelle: "Musterstraße 211, Köln-Ehrenfeld",
    });
  });
});

describe("E.164 validation", () => {
  it.each(["+493012345678", "+14155552671"])("accepts %s", (value) => {
    expect(e164Schema.safeParse(value).success).toBe(true);
  });

  it.each(["030123456", "+49 30 123", "+012345678"])("rejects %s", (value) => {
    expect(e164Schema.safeParse(value).success).toBe(false);
  });
});

describe("structured call result", () => {
  it("accepts explicit nulls for information that was not stated", () => {
    expect(
      structuredCallResultSchema.parse({
        outcome: "processing_confirmed",
        vorgangsnummer: null,
        stall_reason: null,
        expected_resolution: "Tomorrow",
        resubmission_required: false,
        next_action: "Wait for the confirmation email",
        summary: "Processing was confirmed for tomorrow.",
      }),
    ).toMatchObject({ outcome: "processing_confirmed", vorgangsnummer: null });
  });
});
