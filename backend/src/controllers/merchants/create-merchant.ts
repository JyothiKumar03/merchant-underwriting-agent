import type { Request, Response } from "express";
import { z } from "zod";
import { insert_merchant } from "../../models/schema.js";
import { ZMerchantInput } from "../../types/index.js";
import { HTTP } from "../../constants/index.js";

export const create_merchant = async (req: Request, res: Response): Promise<void> => {
  let input;
  try {
    input = ZMerchantInput.parse(req.body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(HTTP.BAD_REQUEST).json({ error: "Validation failed", details: z.treeifyError(err) });
      return;
    }
    throw err;
  }

  const merchant = await insert_merchant(input);
  res.status(HTTP.CREATED).json({ merchant });
};
