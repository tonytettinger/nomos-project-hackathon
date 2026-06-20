# Nomos Clearing Call Console

A local React console for selecting a synthetic clearing case, starting an ElevenLabs agent call through an imported Twilio number, and reviewing the transcript when the call finishes.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. With empty ElevenLabs credentials, the API automatically uses a local mock call that exercises the complete interface without dialing a phone number.

## Connect ElevenLabs and Twilio

1. Import a Twilio number in the ElevenLabs Phone Numbers settings.
2. Configure the Nomos follow-up agent and ensure its prompt uses the fixture variable names from `resources/call-cases.json`.
3. Add the following values to `.env`:

```dotenv
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...
ELEVENLABS_PHONE_NUMBER_ID=...
```

Restart the local dev process. The server will then use ElevenLabs instead of the mock provider.

## Add cases

Add objects to `resources/call-cases.json`. A case must have a non-empty `id`, `case_title`, `lieferant`, `vnb_name`, and an 11-digit `malo_id`. Optional empty or unresolved values are omitted from the dynamic variables sent to ElevenLabs; the app never creates replacement case data.

## Checks

```bash
npm test
npm run typecheck
npm run build
```
