# Nomos Agent Voice Test

A local React console for selecting a clearing case and talking to the real ElevenLabs agent through the laptop microphone and speakers. It uses ElevenLabs WebRTC directly, so no phone number or Twilio account is required.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173` and allow microphone access when starting a voice test.

## Connect ElevenLabs

Add these server-only values to `.env`:

```dotenv
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...
```

The backend exchanges the API key for a short-lived WebRTC conversation token. The browser never receives the API key. The selected fixture is passed to the agent as dynamic variables when the session starts.

`ELEVENLABS_PHONE_NUMBER_ID` and Twilio credentials are not required for browser voice testing.

## Add cases

Add objects to `resources/call-cases.json`. A case must have a non-empty `id`, `case_title`, `lieferant`, `vnb_name`, and an 11-digit `malo_id`. Optional empty or unresolved values are omitted from the dynamic variables; the app never creates replacement case data.

## Checks

```bash
npm test
npm run typecheck
npm run build
```
