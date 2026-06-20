import "dotenv/config";
import { createApp } from "./app";
import { loadCases } from "./cases";
import { ElevenLabsProvider } from "./elevenLabsProvider";
import { ElevenLabsVoiceProvider } from "./elevenLabsVoiceProvider";
import { MockCallProvider } from "./mockProvider";
import { TwilioCallClient } from "./twilioClient";

const port = Number(process.env.API_PORT ?? 8787);
const cases = await loadCases();

const forceMockProvider = process.env.CALL_PROVIDER === "mock";
const hasAgentConfig = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID);
const hasProviderConfig = Boolean(
  !forceMockProvider &&
    process.env.ELEVENLABS_API_KEY &&
    process.env.ELEVENLABS_AGENT_ID &&
    process.env.ELEVENLABS_PHONE_NUMBER_ID,
);

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? new TwilioCallClient({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
      })
    : undefined;

const provider = hasProviderConfig
  ? new ElevenLabsProvider({
      apiKey: process.env.ELEVENLABS_API_KEY!,
      agentId: process.env.ELEVENLABS_AGENT_ID!,
      phoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID!,
      twilioClient,
    })
  : new MockCallProvider();

const voiceSessionProvider = hasAgentConfig
  ? new ElevenLabsVoiceProvider({
      apiKey: process.env.ELEVENLABS_API_KEY!,
      agentId: process.env.ELEVENLABS_AGENT_ID!,
    })
  : undefined;

createApp({
  cases,
  provider,
  providerMode: hasProviderConfig ? "elevenlabs" : "mock",
  voiceSessionProvider,
}).listen(port, "127.0.0.1", () => {
  console.log(
    `Nomos call API listening on http://127.0.0.1:${port} (${hasProviderConfig ? "ElevenLabs" : "mock"}, cancellation ${provider.canCancel ? "enabled" : "disabled"})`,
  );
});
