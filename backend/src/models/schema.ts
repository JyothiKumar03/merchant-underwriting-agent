import { getDb } from "./db.js";
import type {
  TUnderwritingResult,
  TUnderwritingResultRow,
  TWhatsAppLogRow,
  TWhatsAppStatus,
  TOfferStatus,
  TUnderWritingMode,
  TRiskTier,
  TScoringBreakdown,
  TCreditOffer,
  TInsuranceOffer,
} from "../types/index.js";

export const run_migrations = async (): Promise<void> => {
  const db = getDb();

  await db`
    CREATE TABLE IF NOT EXISTS underwriting_results (
      id                       SERIAL PRIMARY KEY,
      merchant_id              VARCHAR(20)   NOT NULL UNIQUE,
      merchant_name            VARCHAR(255)  NOT NULL,
      risk_tier                VARCHAR(20)   NOT NULL
                                 CHECK (risk_tier IN ('tier_1', 'tier_2', 'tier_3', 'rejected')),
      scoring                  JSONB         NOT NULL,
      credit_offer             JSONB,
      insurance_offer          JSONB,
      credit_rationale         TEXT          NOT NULL DEFAULT '',
      credit_user_message      TEXT          NOT NULL DEFAULT '',
      insurance_rationale      TEXT          NOT NULL DEFAULT '',
      insurance_user_message   TEXT          NOT NULL DEFAULT '',
      offer_status             VARCHAR(25)   NOT NULL DEFAULT 'not_underwritten'
                                 CHECK (offer_status IN (
                                   'not_underwritten', 'underwritten', 'offer_sent', 'mandate_active'
                                 )),
      whatsapp_status          VARCHAR(10)   NOT NULL DEFAULT 'not_sent'
                                 CHECK (whatsapp_status IN ('not_sent', 'sent', 'failed')),
      whatsapp_message_sid     VARCHAR(64),
      nach_umrn                VARCHAR(64),
      created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  // Idempotent column additions for existing tables
  await db`
    ALTER TABLE underwriting_results
      ADD COLUMN IF NOT EXISTS credit_user_message    TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS insurance_user_message TEXT NOT NULL DEFAULT ''
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_underwriting_merchant
      ON underwriting_results (merchant_id)
  `;

  await db`
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id            SERIAL PRIMARY KEY,
      merchant_id   VARCHAR(20)   NOT NULL,
      message_sid   VARCHAR(64),
      to_number     VARCHAR(20)   NOT NULL,
      message_body  TEXT          NOT NULL,
      mode          VARCHAR(10)   NOT NULL CHECK (mode IN ('credit', 'insurance')),
      status        VARCHAR(10)   NOT NULL DEFAULT 'not_sent'
                      CHECK (status IN ('not_sent', 'sent', 'failed')),
      error_message TEXT,
      sent_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_merchant
      ON whatsapp_logs (merchant_id, sent_at DESC)
  `;
};

export const runMigrations = run_migrations;

export const upsert_underwriting_result = async (
  result: TUnderwritingResult
): Promise<TUnderwritingResultRow> => {
  const db = getDb();
  const rows = await db`
    INSERT INTO underwriting_results (
      merchant_id, merchant_name, risk_tier,
      scoring, credit_offer, insurance_offer,
      credit_rationale, credit_user_message,
      insurance_rationale, insurance_user_message,
      offer_status, whatsapp_status, whatsapp_message_sid, nach_umrn
    ) VALUES (
      ${result.merchant_id},
      ${result.merchant_name},
      ${result.risk_tier},
      ${JSON.stringify(result.scoring)},
      ${result.credit_offer ? JSON.stringify(result.credit_offer) : null},
      ${result.insurance_offer ? JSON.stringify(result.insurance_offer) : null},
      ${result.credit_rationale},
      ${result.credit_user_message},
      ${result.insurance_rationale},
      ${result.insurance_user_message},
      ${result.offer_status},
      ${result.whatsapp_status},
      ${result.whatsapp_message_sid ?? null},
      ${result.nach_umrn ?? null}
    )
    ON CONFLICT (merchant_id) DO UPDATE SET
      merchant_name            = EXCLUDED.merchant_name,
      risk_tier                = EXCLUDED.risk_tier,
      scoring                  = EXCLUDED.scoring,
      credit_offer             = EXCLUDED.credit_offer,
      insurance_offer          = EXCLUDED.insurance_offer,
      credit_rationale         = EXCLUDED.credit_rationale,
      credit_user_message      = EXCLUDED.credit_user_message,
      insurance_rationale      = EXCLUDED.insurance_rationale,
      insurance_user_message   = EXCLUDED.insurance_user_message,
      offer_status             = EXCLUDED.offer_status,
      whatsapp_status          = EXCLUDED.whatsapp_status,
      whatsapp_message_sid     = EXCLUDED.whatsapp_message_sid,
      nach_umrn                = EXCLUDED.nach_umrn,
      updated_at               = NOW()
    RETURNING *
  `;
  return map_result_row(rows[0]);
};

export const upsertUnderwritingResult = upsert_underwriting_result;

export const patch_rationale = async (
  merchant_id: string,
  mode: TUnderWritingMode,
  rationale: string,
  user_message: string
): Promise<void> => {
  const db = getDb();
  if (mode === "credit") {
    await db`
      UPDATE underwriting_results
      SET credit_rationale    = ${rationale},
          credit_user_message = ${user_message},
          updated_at          = NOW()
      WHERE merchant_id = ${merchant_id}
    `;
  } else {
    await db`
      UPDATE underwriting_results
      SET insurance_rationale    = ${rationale},
          insurance_user_message = ${user_message},
          updated_at             = NOW()
      WHERE merchant_id = ${merchant_id}
    `;
  }
};

export const get_result_by_merchant = async (
  merchant_id: string
): Promise<TUnderwritingResultRow | null> => {
  const db = getDb();
  const rows = await db`
    SELECT * FROM underwriting_results
    WHERE merchant_id = ${merchant_id}
  `;
  return rows.length > 0 ? map_result_row(rows[0]) : null;
};

export const getResultByMerchant = get_result_by_merchant;

export const get_all_results = async (): Promise<TUnderwritingResultRow[]> => {
  const db = getDb();
  const rows = await db`
    SELECT * FROM underwriting_results
    ORDER BY updated_at DESC
  `;
  return rows.map(map_result_row);
};

export const getAllResults = get_all_results;

export const update_whatsapp_status = async (
  merchant_id: string,
  status: TWhatsAppStatus,
  message_sid?: string
): Promise<void> => {
  const db = getDb();
  await db`
    UPDATE underwriting_results
    SET
      whatsapp_status      = ${status},
      whatsapp_message_sid = ${message_sid ?? null},
      offer_status         = CASE
                               WHEN ${status} = 'sent' THEN 'offer_sent'::VARCHAR
                               ELSE offer_status
                             END,
      updated_at           = NOW()
    WHERE merchant_id = ${merchant_id}
  `;
};

export const updateWhatsAppStatus = update_whatsapp_status;

export const update_nach_status = async (
  merchant_id: string,
  umrn: string
): Promise<void> => {
  const db = getDb();
  await db`
    UPDATE underwriting_results
    SET
      offer_status = 'mandate_active',
      nach_umrn    = ${umrn},
      updated_at   = NOW()
    WHERE merchant_id = ${merchant_id}
  `;
};

export const updateNachStatus = update_nach_status;

export const insert_whatsapp_log = async (
  log: Omit<TWhatsAppLogRow, "id" | "sent_at">
): Promise<TWhatsAppLogRow> => {
  const db = getDb();
  const rows = await db`
    INSERT INTO whatsapp_logs (
      merchant_id, message_sid, to_number, message_body, mode, status, error_message
    ) VALUES (
      ${log.merchant_id},
      ${log.message_sid ?? null},
      ${log.to_number},
      ${log.message_body},
      ${log.mode},
      ${log.status},
      ${log.error_message ?? null}
    )
    RETURNING *
  `;
  return rows[0] as TWhatsAppLogRow;
};

export const insertWhatsAppLog = insert_whatsapp_log;

export const get_whatsapp_logs_by_merchant = async (
  merchant_id: string,
  limit = 10
): Promise<TWhatsAppLogRow[]> => {
  const db = getDb();
  const rows = await db`
    SELECT * FROM whatsapp_logs
    WHERE merchant_id = ${merchant_id}
    ORDER BY sent_at DESC
    LIMIT ${limit}
  `;
  return rows as TWhatsAppLogRow[];
};

export const getWhatsAppLogsByMerchant = get_whatsapp_logs_by_merchant;

// Looks up a merchant_id by their WhatsApp number — used by the reply webhook.
// Prefers merchants with offer_status = 'offer_sent' (awaiting acceptance) at that number.
// Falls back to most recently messaged merchant if none are pending.
export const get_merchant_id_by_whatsapp = async (
  whatsapp_number: string
): Promise<string | null> => {
  const db = getDb();
  // Twilio sends "From" as "whatsapp:+91..." — strip the prefix before querying
  const clean = whatsapp_number.replace(/^whatsapp:/i, "").trim();

  // Prefer the merchant at this number who has an outstanding offer
  const pending_rows = await db`
    SELECT wl.merchant_id
    FROM whatsapp_logs wl
    JOIN underwriting_results ur ON ur.merchant_id = wl.merchant_id
    WHERE wl.to_number = ${clean}
      AND ur.offer_status = 'offer_sent'
    ORDER BY wl.sent_at DESC
    LIMIT 1
  `;
  if (pending_rows.length > 0) return pending_rows[0]["merchant_id"] as string;

  // Fallback: most recently messaged merchant at this number
  const fallback_rows = await db`
    SELECT merchant_id FROM whatsapp_logs
    WHERE to_number = ${clean}
    ORDER BY sent_at DESC
    LIMIT 1
  `;
  return fallback_rows.length > 0 ? (fallback_rows[0]["merchant_id"] as string) : null;
};

const map_result_row = (row: Record<string, unknown>): TUnderwritingResultRow => ({
  id: row["id"] as number,
  merchant_id: row["merchant_id"] as string,
  merchant_name: row["merchant_name"] as string,
  risk_tier: row["risk_tier"] as TRiskTier,
  scoring: row["scoring"] as TScoringBreakdown,
  credit_offer: row["credit_offer"] as TCreditOffer | null,
  insurance_offer: row["insurance_offer"] as TInsuranceOffer | null,
  credit_rationale: row["credit_rationale"] as string,
  credit_user_message: (row["credit_user_message"] ?? "") as string,
  insurance_rationale: row["insurance_rationale"] as string,
  insurance_user_message: (row["insurance_user_message"] ?? "") as string,
  offer_status: row["offer_status"] as TOfferStatus,
  whatsapp_status: row["whatsapp_status"] as TWhatsAppStatus,
  whatsapp_message_sid: row["whatsapp_message_sid"] as string | null,
  nach_umrn: row["nach_umrn"] as string | null,
  created_at: new Date(row["created_at"] as string),
  updated_at: new Date(row["updated_at"] as string),
});
