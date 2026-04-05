import type { Request, Response } from "express";
import {
  get_merchant_id_by_whatsapp,
  get_result_by_merchant,
  update_nach_status,
} from "../../models/schema.js";
import { HTTP, NACH, SUPPORT } from "../../constants/index.js";

// Respond via TwiML <Message> inline — same HTTP response, no separate API call.
// messages.create() for replies is unreliable in sandbox; TwiML is the correct approach.
const twiml_reply = (message: string): string => {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
};

const TWIML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

// Twilio posts form-encoded fields. Key fields from payload:
//   From  — "whatsapp:+xxxxx" — used as TwiML reply target
//   WaId  — "xxxxxxxx"           — clean number, used for DB lookup (we prepend +)
//   Body  — raw user text
export const whatsapp_webhook = async (req: Request, res: Response): Promise<void> => {
  const from: string = req.body?.From ?? "";
  const wa_id: string = req.body?.WaId ?? "";
  const lookup_number = wa_id ? `+${wa_id}` : from.replace(/^whatsapp:/i, "").trim();
  const body: string = (req.body?.Body ?? "").trim().toLowerCase();

  // Only react to accept or reject — ignore everything else silently
  if (body !== "accept" && body !== "reject") {
    res.status(HTTP.OK).type("text/xml").send(TWIML_EMPTY);
    return;
  }

  // Resolve merchant from the sender's WhatsApp number
  const merchant_id = await get_merchant_id_by_whatsapp(lookup_number);

  if (!merchant_id) {
    res.status(HTTP.OK).type("text/xml").send(TWIML_EMPTY);
    return;
  }

  if (body === "reject") {
    res.status(HTTP.OK).type("text/xml").send(
      twiml_reply(
        `No worries! Your offer has been noted as declined. You can request a new evaluation anytime from the GrabOn dashboard.\n\nGrabOn x Poonawalla Fincorp`
      )
    );
    return;
  }

  // ACCEPT flow
  const db_result = await get_result_by_merchant(merchant_id);
  if (!db_result || db_result.risk_tier === "rejected") {
    res.status(HTTP.OK).type("text/xml").send(TWIML_EMPTY);
    return;
  }

  // Idempotent — already active
  if (db_result.offer_status === "mandate_active" && db_result.nach_umrn) {
    res.status(HTTP.OK).type("text/xml").send(
      twiml_reply(
        `Your mandate is already active!\n\nNACH UMRN: ${db_result.nach_umrn}\n\nNo further action needed.\n\nGrabOn x Poonawalla Fincorp`
      )
    );
    return;
  }

  // Generate NACH UMRN and activate mandate
  const umrn = `${NACH.UMRN_PREFIX}-${merchant_id}-${Date.now()}`;
  await update_nach_status(merchant_id, umrn);

  res.status(HTTP.OK).type("text/xml").send(
    twiml_reply(
      [
        `Mandate Activated Successfully!`,
        ``,
        `Hi ${db_result.merchant_name}, your GrabOn offer has been accepted and your NACH mandate is now active.`,
        ``,
        `NACH UMRN: ${umrn}`,
        `Status: Active`,
        `Validity: ${NACH.MANDATE_VALIDITY_YEARS} years`,
        ``,
        `Our team will reach out within 24 hours with next steps. For queries, email us at ${SUPPORT.EMAIL}`,
        ``,
        `GrabOn x Poonawalla Fincorp`,
      ].join("\n")
    )
  );
};
