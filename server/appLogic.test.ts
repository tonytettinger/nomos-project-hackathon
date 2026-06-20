// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { CallCase } from "../shared/callSchema";
import { CaseNotFoundError, resolveCallRequest } from "./app";

const callCase: CallCase = {
  id: "CASE-B",
  case_title: "Reminder / Nachfassen",
  lieferant: "Nomos GmbH",
  vnb_name: "Rheinland Netz AG",
  malo_id: "48820037615",
};

describe("call API request resolution", () => {
  it("resolves a valid request to the selected case", () => {
    expect(
      resolveCallRequest([callCase], { caseId: "CASE-B", toNumber: "+493012345678" }),
    ).toEqual({
      input: { caseId: "CASE-B", toNumber: "+493012345678" },
      callCase,
    });
  });

  it("rejects invalid destination numbers before provider use", () => {
    expect(() => resolveCallRequest([callCase], { caseId: "CASE-B", toNumber: "030123" })).toThrow(
      "Enter a valid international number",
    );
  });

  it("rejects unknown case identifiers", () => {
    expect(() =>
      resolveCallRequest([callCase], { caseId: "CASE-X", toNumber: "+493012345678" }),
    ).toThrow(CaseNotFoundError);
  });
});
