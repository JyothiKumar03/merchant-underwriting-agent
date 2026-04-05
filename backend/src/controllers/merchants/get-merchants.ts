import type { Request, Response } from "express";
import { get_all_static_merchants } from "../../data/merchants.js";
import { get_all_results, get_all_db_merchants } from "../../models/schema.js";
import { HTTP } from "../../constants/index.js";

export const get_merchants = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10) || 1);
  const limit_raw = parseInt(String(req.query["limit"] ?? "0"), 10) || 0;
  const paginate = limit_raw > 0;

  const [results, db_merchants] = await Promise.all([
    get_all_results(),
    get_all_db_merchants(),
  ]);

  const results_by_id = new Map(results.map((r) => [r.merchant_id, r]));
  const all_merchants = [...get_all_static_merchants(), ...db_merchants];
  const total = all_merchants.length;

  const data_full = all_merchants.map((m) => ({
    ...m,
    result: results_by_id.get(m.merchant_id) ?? null,
  }));

  const data = paginate
    ? data_full.slice((page - 1) * limit_raw, page * limit_raw)
    : data_full;

  res.status(HTTP.OK).json({
    merchants: data,
    total,
    ...(paginate && { page, limit: limit_raw, pages: Math.ceil(total / limit_raw) }),
  });
};
