import { telephonyStatusSchema, type TelephonyStatus } from "../shared/callSchema";
import { ProviderRequestError } from "./elevenLabsProvider";

type TwilioClientConfig = {
  accountSid: string;
  authToken: string;
  fetchImpl?: typeof fetch;
};

export class TwilioCallClient {
  private readonly fetchImpl: typeof fetch;
  private readonly authorization: string;

  constructor(private readonly config: TwilioClientConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.authorization = `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`;
  }

  async getStatus(callSid: string): Promise<TelephonyStatus | null> {
    const response = await this.fetchImpl(this.callUrl(callSid), {
      headers: { authorization: this.authorization },
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
      throw new ProviderRequestError(readTwilioError(payload, "Unable to retrieve Twilio call status"), response.status);
    }

    const parsed = telephonyStatusSchema.safeParse(payload?.status);
    return parsed.success ? parsed.data : null;
  }

  async endCall(callSid: string): Promise<void> {
    const response = await this.fetchImpl(this.callUrl(callSid), {
      method: "POST",
      headers: {
        authorization: this.authorization,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Status: "completed" }),
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
      throw new ProviderRequestError(readTwilioError(payload, "Unable to cancel the Twilio call"), response.status);
    }
  }

  private callUrl(callSid: string) {
    return `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(this.config.accountSid)}/Calls/${encodeURIComponent(callSid)}.json`;
  }
}

function readTwilioError(payload: Record<string, unknown> | null, fallback: string) {
  return typeof payload?.message === "string" ? payload.message : fallback;
}
