import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { TAiProvider, TAiGenerateObjectParams } from "../types/index.js";
import { AI_SERVICE } from "../constants/index.js";
import { ENV } from "../constants/env.js";
import { write_llm_log } from "../utils/llm-logger.js";

// Returns the correct Vercel AI SDK model instance based on provider

const get_model = (provider: TAiProvider, model_id: string) => {
  if (provider === "anthropic") {
    return createAnthropic({ apiKey: ENV.ANTHROPIC_API_KEY })(model_id);
  }
  if (provider === "open_router") {
    return createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: ENV.OPENROUTER_API_KEY,
    })(model_id);
  }
  // Default: openai
  return createOpenAI({ apiKey: ENV.OPENAI_API_KEY })(model_id);
};

const with_retry = async <T>(
  fn: () => Promise<T>,
  max_retries: number,
  base_delay_ms: number
): Promise<T> => {
  let last_error: unknown;
  for (let attempt = 0; attempt <= max_retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last_error = err;
      if (attempt < max_retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, base_delay_ms * Math.pow(2, attempt))
        );
      }
    }
  }
  throw last_error;
};

/**
 * Generic structured output call using Vercel AI SDK generateObject.
 * Tries each model in order; first success wins.
 * Callers pass a Zod schema — the returned object is fully typed.
 */
export const generate_object = async <T>(params: TAiGenerateObjectParams<T>): Promise<T> => {
  const { models, system, prompt, schema, max_tokens, temperature } = params;

  for (const { provider, model_id } of models) {
    try {
      const { output, usage } = await with_retry(
        () =>
          generateText({
            model: get_model(provider, model_id),
            output: Output.object({
              schema: schema
            }),
            system,
            prompt,
            maxOutputTokens: max_tokens ?? AI_SERVICE.MAX_OUTPUT_TOKENS,
            temperature: temperature ?? AI_SERVICE.TEMPERATURE,
          }),
        AI_SERVICE.MAX_RETRIES,
        AI_SERVICE.RETRY_BASE_DELAY_MS
      );
      write_llm_log({
        provider,
        model_id,
        usage: {
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          total_tokens: usage.totalTokens,
        },
        output,
        timestamp: new Date().toISOString(),
      });
      return output;
    } catch (err) {
      console.error(`[ai-service] ${provider}/${model_id} failed:`, err);
    }
  }

  throw new Error("[ai-service] All models failed to generate a response");
};
