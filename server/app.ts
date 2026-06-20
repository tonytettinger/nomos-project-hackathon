import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { initiateCallSchema, type CallCase } from "../shared/callSchema";
import { ProviderRequestError } from "./elevenLabsProvider";
import type { CallProvider } from "./types";

export type AppDependencies = {
  cases: CallCase[];
  provider: CallProvider;
  providerMode: "elevenlabs" | "mock";
};

export class CaseNotFoundError extends Error {
  constructor() {
    super("Selected case was not found");
    this.name = "CaseNotFoundError";
  }
}

export function resolveCallRequest(cases: CallCase[], body: unknown) {
  const input = initiateCallSchema.parse(body);
  const callCase = cases.find((item) => item.id === input.caseId);
  if (!callCase) throw new CaseNotFoundError();
  return { input, callCase };
}

export function createApp({ cases, provider, providerMode }: AppDependencies) {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, providerMode });
  });

  app.get("/api/cases", (_request, response) => {
    response.json({ cases });
  });

  app.post("/api/calls", async (request, response, next) => {
    try {
      const { input, callCase } = resolveCallRequest(cases, request.body);

      response.status(201).json(
        await provider.initiateCall({
          toNumber: input.toNumber,
          callCase,
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/calls/:conversationId", async (request, response, next) => {
    try {
      response.json(await provider.getCall(request.params.conversationId));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    if (error instanceof CaseNotFoundError) {
      response.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof ProviderRequestError) {
      response.status(error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502).json({
        error: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    response.status(500).json({ error: message });
  });

  return app;
}
