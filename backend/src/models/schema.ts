import { getDb } from "./db.js";
import type {
  UnderwritingResult,
  UnderwritingResultRow,
  WhatsAppLogRow,
  WhatsAppStatus,
  OfferStatus,
  Mode,
  RiskTier,
  ScoringBreakdown,
  CreditOffer,
  InsuranceOffer,
} from "../types/index.js";

// ── DDL ──────────────────────────────────────────────────────────────────────

/**
 * Creates all application tables if they do not already exist.
 * Safe to call on every server start (idempotent).
 */
export async function runMigrations(): Promise<void> {
  const db = getDb();

  // underwriting_results: one row per merchant (upserted on each underwrite)
  await db`
    CREATE TABLE IF NOT EXISTS underwriting_results (
      id                    SERIAL PRIMARY KEY,
      merchant_id           VARCHAR(20)   NOT NULL UNIQUE,
      merchant_name         VARCHAR(255)  NOT NULL,
      risk_tier             VARCHAR(20)   NOT NULL
                              CHECK (risk_tier IN ('Tier 1', 'Tier 2', 'Tier 3', 'Rejected')),
      scoring               JSONB         NOT NULL,
      credit_offer          JSONB,
      insurance_offer       JSONB,
      credit_rationale      TEXT          NOT NULL DEFAULT '',
      insurance_rationale   TEXT          NOT NULL DEFAULT '',
      offer_status          VARCHAR(25)   NOT NULL DEFAULT 'not_underwritten'
                              CHECK (offer_status IN (
                                'not_underwritten', 'underwritten', 'offer_sent', 'mandate_active'
                              )),
      whatsapp_status       VARCHAR(10)   NOT NULL DEFAULT 'not_sent'
                              CHECK (whatsapp_status IN ('not_sent', 'sent', 'failed')),
      whatsapp_message_sid  VARCHAR(64),
      nach_umrn             VARCHAR(64),
      created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS idx_underwriting_merchant
      ON underwriting_results (merchant_id)
  `;

  // whatsapp_logs: delivery audit trail (one row per send attempt)
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
}

// ── underwriting_results queries ─────────────────────────────────────────────

/**
 * Upserts the underwriting result for a merchant.
 * Since scoring is done once per merchant (not per mode), we UNIQUE on merchant_id.
 */
export async function upsertUnderwritingResult(
  result: UnderwritingResult
): Promise<UnderwritingResultRow> {
  const db = getDb();
  const rows = await db`
    INSERT INTO underwriting_results (
      merchant_id, merchant_name, risk_tier,
      scoring, credit_offer, insurance_offer,
      credit_rationale, insurance_rationale,
      offer_status, whatsapp_status, whatsapp_message_sid, nach_umrn
    ) VALUES (
      ${result.merchant_id},
      ${result.merchant_name},
      ${result.risk_tier},
      ${JSON.stringify(result.scoring)},
      ${result.credit_offer ? JSON.stringify(result.credit_offer) : null},
      ${result.insurance_offer ? JSON.stringify(result.insurance_offer) : null},
      ${result.credit_rationale},
      ${result.insurance_rationale},
      ${result.offer_status},
      ${result.whatsapp_status},
      ${result.whatsapp_message_sid ?? null},
      ${result.nach_umrn ?? null}
    )
    ON CONFLICT (merchant_id) DO UPDATE SET
      merchant_name         = EXCLUDED.merchant_name,
      risk_tier             = EXCLUDED.risk_tier,
      scoring               = EXCLUDED.scoring,
      credit_offer          = EXCLUDED.credit_offer,
      insurance_offer       = EXCLUDED.insurance_offer,
      credit_rationale      = EXCLUDED.credit_rationale,
      insurance_rationale   = EXCLUDED.insurance_rationale,
      offer_status          = EXCLUDED.offer_status,
      whatsapp_status       = EXCLUDED.whatsapp_status,
      whatsapp_message_sid  = EXCLUDED.whatsapp_message_sid,
      nach_umrn             = EXCLUDED.nach_umrn,
      updated_at            = NOW()
    RETURNING *
  `;
  return mapResultRow(rows[0]);
}

export async function getResultByMerchant(
  merchantId: string
): Promise<UnderwritingResultRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM underwriting_results
    WHERE merchant_id = ${merchantId}
  `;
  return rows.length > 0 ? mapResultRow(rows[0]) : null;
}

export async function getAllResults(): Promise<UnderwritingResultRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM underwriting_results
    ORDER BY updated_at DESC
  `;
  return rows.map(mapResultRow);
}

export async function updateWhatsAppStatus(
  merchantId: string,
  status: WhatsAppStatus,
  messageSid?: string
): Promise<void> {
  const db = getDb();
  await db`
    UPDATE underwriting_results
    SET
      whatsapp_status      = ${status},
      whatsapp_message_sid = ${messageSid ?? null},
      offer_status         = CASE
                               WHEN ${status} = 'sent' THEN 'offer_sent'::VARCHAR
                               ELSE offer_status
                             END,
      updated_at           = NOW()
    WHERE merchant_id = ${merchantId}
  `;
}

export async function updateNachStatus(
  merchantId: string,
  umrn: string
): Promise<void> {
  const db = getDb();
  await db`
    UPDATE underwriting_results
    SET
      offer_status = 'mandate_active',
      nach_umrn    = ${umrn},
      updated_at   = NOW()
    WHERE merchant_id = ${merchantId}
  `;
}

// ── whatsapp_logs queries ─────────────────────────────────────────────────────

export async function insertWhatsAppLog(
  log: Omit<WhatsAppLogRow, "id" | "sent_at">
): Promise<WhatsAppLogRow> {
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
  return rows[0] as WhatsAppLogRow;
}

export async function getWhatsAppLogsByMerchant(
  merchantId: string,
  limit = 10
): Promise<WhatsAppLogRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM whatsapp_logs
    WHERE merchant_id = ${merchantId}
    ORDER BY sent_at DESC
    LIMIT ${limit}
  `;
  return rows as WhatsAppLogRow[];
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapResultRow(row: Record<string, unknown>): UnderwritingResultRow {
  return {
    id: row["id"] as number,
    merchant_id: row["merchant_id"] as string,
    merchant_name: row["merchant_name"] as string,
    risk_tier: row["risk_tier"] as RiskTier,
    scoring: row["scoring"] as ScoringBreakdown,
    credit_offer: row["credit_offer"] as CreditOffer | null,
    insurance_offer: row["insurance_offer"] as InsuranceOffer | null,
    credit_rationale: row["credit_rationale"] as string,
    insurance_rationale: row["insurance_rationale"] as string,
    offer_status: row["offer_status"] as OfferStatus,
    whatsapp_status: row["whatsapp_status"] as WhatsAppStatus,
    whatsapp_message_sid: row["whatsapp_message_sid"] as string | null,
    nach_umrn: row["nach_umrn"] as string | null,
    created_at: new Date(row["created_at"] as string),
    updated_at: new Date(row["updated_at"] as string),
  };
}
