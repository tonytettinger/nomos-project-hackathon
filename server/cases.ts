import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { callCasesSchema, type CallCase } from "../shared/callSchema";

const defaultCasesUrl = new URL("../resources/call-cases.json", import.meta.url);

export async function loadCases(filePath = fileURLToPath(defaultCasesUrl)): Promise<CallCase[]> {
  const source = await readFile(filePath, "utf8");
  return callCasesSchema.parse(JSON.parse(source));
}
