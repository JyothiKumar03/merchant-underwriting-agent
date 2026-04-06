type TEnv = {
  PORT: string;
  DB_URL: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  OPENROUTER_API_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_WHATSAPP_FROM: string;
  TWILIO_WHATSAPP_TO: string
};

export const ENV: TEnv = {
  PORT: process.env.PORT ?? "3001",
  DB_URL: process.env.DB_URL ?? "not-set",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "not-set",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "not-set",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "not-set",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "not-set",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "not-set",
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM ?? "not-set",
  TWILIO_WHATSAPP_TO: process.env.TWILIO_WHATSAPP_TO ?? "not-set"
} as const;
