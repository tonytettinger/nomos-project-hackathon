# Nomos Clearing Voice Agent

A local voice-agent console for testing German energy-market clearing cases. Select a case, start a browser conversation with the configured ElevenLabs agent, and speak through your laptop microphone and speakers—no phone number or Twilio account is needed.

The app:

- loads clearing cases from `resources/call-cases.json`;
- passes the selected case to ElevenLabs as dynamic variables;
- formats the MaLo for slow digit-by-digit speech while preserving its raw value;
- records and displays the conversation transcript;
- ends the browser session automatically after the agent's final farewell; and
- optionally uses OpenAI to extract a compact structured result from the transcript.

## Requirements

- Node.js 20 or newer
- npm
- an ElevenLabs agent and API key
- microphone permission in the browser
- an OpenAI API key only if structured result extraction is required

## Setup

Install dependencies and create a local environment file:

```bash
npm install
cp .env.example .env
```

Add your ElevenLabs credentials to `.env`:

```dotenv
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

To enable the structured result shown beside the transcript, also add:

```dotenv
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini
```

`OPENAI_MODEL` is optional and defaults to `gpt-5.4-mini`. `API_PORT` is also optional and defaults to `8787`.

## Run the app

```bash
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173), select a case, click **Start voice test**, and allow microphone access. The command starts both the Vite frontend and the local Express API. ElevenLabs and OpenAI API keys remain on the server; the frontend receives only a short-lived ElevenLabs conversation token.

## ElevenLabs agent setup

The agent prompt and first message are managed in ElevenLabs. Case values are available to the agent as dynamic variables. For example:

- `malo_id` contains numeric digits separated by long pause markers for slow speech;
- `malo_id_raw` contains the unchanged 11-digit identifier; and
- the remaining valid fixture properties retain their original names and values.

Empty or unresolved optional properties are omitted. The app does not invent replacement case data.

For the cleanest ending, enable ElevenLabs' built-in `end_call` system tool and instruct the agent to call it immediately after its final farewell. The frontend also has a fallback that closes the WebRTC session after detecting a final English or German goodbye.

## Add or edit cases

Edit `resources/call-cases.json`. Each case requires:

- `id`
- `case_title`
- `lieferant`
- `vnb_name`
- an 11-digit `malo_id`

Additional supported properties are optional and are passed through unchanged when they contain valid values.

## Project structure

```text
src/        React frontend and browser voice-session logic
server/     Express API and provider integrations
shared/     Shared TypeScript types, validation, and result schemas
resources/  Clearing-case fixtures
```

## Verification

```bash
npm test
npm run typecheck
npm run build
```
