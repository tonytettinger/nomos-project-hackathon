import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import {
  analyzeConversationSchema,
  cancelCallSchema,
  initiateCallSchema,
  type CallCase,
} from "../shared/callSchema";
import { ProviderRequestError } from "./elevenLabsProvider";
import type { CallAnalysisProvider, CallProvider, VoiceSessionProvider } from "./types";

export type AppDependencies = {
  cases: CallCase[];
  provider: CallProvider;
  providerMode: "elevenlabs" | "mock";
  voiceSessionProvider?: VoiceSessionProvider;
  analysisProvider?: CallAnalysisProvider;
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

export function createApp({
  cases,
  provider,
  providerMode,
  voiceSessionProvider,
  analysisProvider,
}: AppDependencies) {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      providerMode,
      cancelEnabled: provider.canCancel,
      browserVoiceEnabled: Boolean(voiceSessionProvider),
      analysisEnabled: Boolean(analysisProvider),
    });
  });

  app.get("/api/cases", (_request, response) => {
    response.json({ cases });
  });

  app.post("/api/agent/session-token", async (_request, response, next) => {
    try {
      if (!voiceSessionProvider) {
        response.status(503).json({ error: "ElevenLabs browser voice is not configured" });
        return;
      }
      const token = await voiceSessionProvider.createConversationToken();
      response.json({ token });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/conversations/analyze", async (request, response, next) => {
    try {
      if (!analysisProvider) {
        response.status(503).json({ error: "OpenAI conversation analysis is not configured" });
        return;
      }
      const input = analyzeConversationSchema.parse(request.body);
      const callCase = cases.find((item) => item.id === input.caseId);
      if (!callCase) throw new CaseNotFoundError();
      const result = await analysisProvider.analyze({ callCase, transcript: input.transcript });
      response.json({ result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/calls", async (request, response, next) => {
    try {
      const { input, callCase } = resolveCallRequest(cases, request.body);

      const result = await provider.initiateCall({
        toNumber: input.toNumber,
        callCase,
      });
      console.info("[calls] initiated", {
        caseId: callCase.id,
        conversationId: result.conversationId,
        callSid: result.callSid,
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/calls/:conversationId", async (request, response, next) => {
    try {
      const callSid = typeof request.query.callSid === "string" ? request.query.callSid : null;
      const result = await provider.getCall({ conversationId: request.params.conversationId, callSid });
      console.info("[calls] status", {
        conversationId: result.conversationId,
        status: result.status,
        telephonyStatus: result.telephonyStatus,
      });
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/calls/:conversationId/cancel", async (request, response, next) => {
    try {
      const { callSid } = cancelCallSchema.parse(request.body);
      await provider.cancelCall({ conversationId: request.params.conversationId, callSid });
      response.json({ success: true, message: "Call cancelled" });
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
      response.status(error.statusCode >= 400 && error.statusCode <= 599 ? error.statusCode : 502).json({
        error: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("[api] request failed", { message });
    response.status(500).json({ error: message });
  });

  return app;
}
