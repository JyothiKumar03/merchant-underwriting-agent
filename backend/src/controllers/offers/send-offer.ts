import type { Request, Response } from "express";
import { z } from "zod";
import { ZSendOfferBody, type TUnderWritingMode } from "../../types/index.js";
import { get_merchant_by_id } from "../../data/merchants.js";
import {
  get_result_by_merchant,
  update_whatsapp_status,
  insert_whatsapp_log,
  get_db_merchant_by_id,
} from "../../models/schema.js";
import { send_whatsapp_offer } from "../../services/twilio-service.js";
import { HTTP } from "../../constants/index.js";

export const send_offer = async (req: Request, res: Response): Promise<void> => {
  // 1. Zod validation
  let merchantId: string;
  let mode: TUnderWritingMode;

  try {
    ({ merchantId, mode } = ZSendOfferBody.parse(req.body));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(HTTP.BAD_REQUEST).json({ error: "Validation failed", details: z.treeifyError(err) });
      return;
    }
    throw err;
  }

  // 2. Check DB for underwriting result
  const db_result = await get_result_by_merchant(merchantId);
  if (!db_result) {
    res.status(HTTP.NOT_FOUND).json({ error: `No underwriting result found for merchant ${merchantId}` });
    return;
  }

  const merchant = get_merchant_by_id(merchantId) ?? await get_db_merchant_by_id(merchantId);
  if (!merchant) {
    res.status(HTTP.NOT_FOUND).json({ error: `Merchant ${merchantId} not found` });
    return;
  }

  const has_rationale = mode === "credit"
    ? db_result.credit_rationale.length > 0
    : db_result.insurance_rationale.length > 0;

  if (!has_rationale && db_result.risk_tier !== "rejected") {
    res.status(HTTP.BAD_REQUEST).json({
      error: `Rationale for ${mode} mode not generated. Call POST /api/v1/underwrite/${merchantId} with mode="${mode}" first.`,
    });
    return;
  }

  // 3. Send via Twilio — pass the DB row directly
  const delivery = await send_whatsapp_offer(merchant.contact_whatsapp, db_result, mode);

  // 4. Persist log + update status
  await insert_whatsapp_log({
    merchant_id: merchantId,
    message_sid: delivery.messageSid ?? null,
    to_number: merchant.contact_whatsapp,
    message_body: delivery.messageBody,
    mode,
    status: delivery.status,
    error_message: delivery.errorMessage ?? null,
  });

  await update_whatsapp_status(merchantId, delivery.status, delivery.messageSid);

  res.status(HTTP.OK).json({
    whatsapp_status: delivery.status,
    message_sid: delivery.messageSid ?? null,
    error: delivery.errorMessage ?? null,
  });
};
