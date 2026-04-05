import type { Request, Response } from "express";
import { merchants } from "../../data/merchants.js";
import { get_all_results } from "../../models/schema.js";
import { HTTP } from "../../constants/index.js";

export const get_merchants = async (_req: Request, res: Response): Promise<void> => {
  // 1. Fetch all existing underwriting results from DB
  const results = await get_all_results();
  const results_by_id = new Map(results.map((r) => [r.merchant_id, r]));

  // 2. Join merchant profiles with their result (if any)
  const data = merchants.map((m) => ({
    ...m,
    result: results_by_id.get(m.merchant_id) ?? null,
  }));

  res.status(HTTP.OK).json({ merchants: data });
};
