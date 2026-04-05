import type { Request, Response } from "express";
import { z } from "zod";
import { bulk_insert_merchants } from "../../models/schema.js";
import { ZMerchantInput } from "../../types/index.js";
import { HTTP } from "../../constants/index.js";

const EXPECTED_HEADERS = [
  "name", "category", "contact_whatsapp", "months_on_platform", "total_deals_listed",
  "gmv_m1", "gmv_m2", "gmv_m3", "gmv_m4", "gmv_m5", "gmv_m6",
  "gmv_m7", "gmv_m8", "gmv_m9", "gmv_m10", "gmv_m11", "gmv_m12",
  "coupon_redemption_rate", "unique_customer_count", "customer_return_rate",
  "avg_order_value", "seasonality_index", "deal_exclusivity_rate", "return_and_refund_rate",
] as const;

const parse_csv_row = (headers: string[], values: string[]) => {
  const record: Record<string, string> = {};
  headers.forEach((h, i) => { record[h] = (values[i] ?? "").trim(); });
  return record;
};

const to_num = (v: string) => {
  const n = Number(v);
  return isNaN(n) ? null : n;
};

export const bulk_upload = async (req: Request, res: Response): Promise<void> => {
  const csv_text: string = typeof req.body === "string" ? req.body : "";

  if (!csv_text.trim()) {
    res.status(HTTP.BAD_REQUEST).json({ error: "Empty CSV body" });
    return;
  }

  const lines = csv_text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    res.status(HTTP.BAD_REQUEST).json({ error: "CSV must have a header row and at least one data row" });
    return;
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    res.status(HTTP.BAD_REQUEST).json({ error: `Missing CSV columns: ${missing.join(", ")}` });
    return;
  }

  const validation_errors: { row: number; error: string }[] = [];
  const valid_rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    const r = parse_csv_row(headers, values);

    const raw = {
      name: r["name"],
      category: r["category"],
      contact_whatsapp: r["contact_whatsapp"],
      months_on_platform: to_num(r["months_on_platform"]),
      total_deals_listed: to_num(r["total_deals_listed"]),
      monthly_gmv_12m: [
        to_num(r["gmv_m1"]), to_num(r["gmv_m2"]), to_num(r["gmv_m3"]),
        to_num(r["gmv_m4"]), to_num(r["gmv_m5"]), to_num(r["gmv_m6"]),
        to_num(r["gmv_m7"]), to_num(r["gmv_m8"]), to_num(r["gmv_m9"]),
        to_num(r["gmv_m10"]), to_num(r["gmv_m11"]), to_num(r["gmv_m12"]),
      ],
      coupon_redemption_rate: to_num(r["coupon_redemption_rate"]),
      unique_customer_count: to_num(r["unique_customer_count"]),
      customer_return_rate: to_num(r["customer_return_rate"]),
      avg_order_value: to_num(r["avg_order_value"]),
      seasonality_index: to_num(r["seasonality_index"]),
      deal_exclusivity_rate: to_num(r["deal_exclusivity_rate"]),
      return_and_refund_rate: to_num(r["return_and_refund_rate"]),
    };

    const result = ZMerchantInput.safeParse(raw);
    if (!result.success) {
      validation_errors.push({ row: i + 1, error: z.treeifyError(result.error).toString() });
    } else {
      valid_rows.push(result.data);
    }
  }

  if (valid_rows.length === 0) {
    res.status(HTTP.BAD_REQUEST).json({
      error: "No valid rows found",
      validation_errors,
    });
    return;
  }

  const { inserted, failed } = await bulk_insert_merchants(valid_rows);

  res.status(HTTP.OK).json({
    inserted_count: inserted.length,
    failed_count: failed.length + validation_errors.length,
    inserted: inserted.map((m) => ({ merchant_id: m.merchant_id, name: m.name })),
    validation_errors,
    insert_errors: failed,
  });
};

