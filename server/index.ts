import "dotenv/config";
import { createApp } from "./app";
import { loadCases } from "./cases";
import { ElevenLabsProvider } from "./elevenLabsProvider";
import { MockCallProvider } from "./mockProvider";

const port = Number(process.env.API_PORT ?? 8787);
const cases = await loadCases();

const hasProviderConfig = Boolean(
  process.env.ELEVENLABS_API_KEY &&
    process.env.ELEVENLABS_AGENT_ID &&
    process.env.ELEVENLABS_PHONE_NUMBER_ID,
);

const provider = hasProviderConfig
  ? new ElevenLabsProvider({
      apiKey: process.env.ELEVENLABS_API_KEY!,
      agentId: process.env.ELEVENLABS_AGENT_ID!,
      phoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID!,
    })
  : new MockCallProvider();

createApp({
  cases,
  provider,
  providerMode: hasProviderConfig ? "elevenlabs" : "mock",
}).listen(port, "127.0.0.1", () => {
  console.log(`Nomos call API listening on http://127.0.0.1:${port} (${hasProviderConfig ? "ElevenLabs" : "mock"})`);
});
