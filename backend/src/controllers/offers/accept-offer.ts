import type { Request, Response } from "express";
import { z } from "zod";
import { ZAcceptOfferBody } from "../../types/index.js";
import { get_result_by_merchant, update_nach_status } from "../../models/schema.js";
import { HTTP, NACH } from "../../constants/index.js";

export const accept_offer = async (req: Request, res: Response): Promise<void> => {
  // 1. Zod validation
  let merchantId: string;

  try {
    ({ merchantId } = ZAcceptOfferBody.parse(req.body));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(HTTP.BAD_REQUEST).json({ error: "Validation failed", details: z.treeifyError(err) });
      return;
    }
    throw err;
  }

  // 2. Look up result from DB
  const db_result = await get_result_by_merchant(merchantId);
  if (!db_result) {
    res.status(HTTP.NOT_FOUND).json({ error: `No underwriting result found for merchant ${merchantId}` });
    return;
  }

  if (db_result.risk_tier === "rejected") {
    res.status(HTTP.BAD_REQUEST).json({ error: "Cannot accept offer for a rejected merchant" });
    return;
  }

  if (db_result.offer_status === "mandate_active") {
    res.status(HTTP.OK).json({ offer_status: "mandate_active", nach_umrn: db_result.nach_umrn });
    return;
  }

  // 3. Generate mock NACH UMRN
  const umrn = `${NACH.UMRN_PREFIX}-${merchantId}-${Date.now()}`;

  // 4. Update DB with mandate status
  await update_nach_status(merchantId, umrn);

  // 5. Response
  res.status(HTTP.OK).json({ offer_status: "mandate_active", nach_umrn: umrn });
};
