import express, { Router } from "express";
import { get_merchants } from "../controllers/merchants/get-merchants.js";
import { create_merchant } from "../controllers/merchants/create-merchant.js";
import { bulk_upload } from "../controllers/merchants/bulk-upload.js";
import { underwrite } from "../controllers/underwriting/underwrite.js";
import { send_offer } from "../controllers/offers/send-offer.js";
import { accept_offer } from "../controllers/offers/accept-offer.js";
import { whatsapp_webhook } from "../controllers/offers/whatsapp-webhook.js";

const router = Router();

// Merchants

router.get("/merchants", get_merchants);
router.post("/merchants", create_merchant);
router.post("/merchants/bulk-upload", express.text({ type: "text/csv", limit: "2mb" }), bulk_upload);

// Underwriting (static routes before parameterised)

router.post("/underwrite/send-offer/webhook", whatsapp_webhook);
router.post("/underwrite/:id", underwrite);

// Offers

router.post("/send-offer", send_offer);
router.post("/accept-offer", accept_offer);

export default router;
