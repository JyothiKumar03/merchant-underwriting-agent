import { Router } from "express";
import { get_merchants } from "../controllers/merchants/get-merchants.js";
import { underwrite } from "../controllers/underwriting/underwrite.js";
import { send_offer } from "../controllers/offers/send-offer.js";
import { accept_offer } from "../controllers/offers/accept-offer.js";
import { whatsapp_webhook } from "../controllers/offers/whatsapp-webhook.js";

const router = Router();

// Merchants

router.get("/merchants", get_merchants);

// Underwriting

router.post("/underwrite/:id", underwrite);

// Offers

router.post("/send-offer", send_offer);
router.post("/accept-offer", accept_offer);

// WhatsApp reply webhook (Twilio posts here when merchant replies ACCEPT/REJECT)

router.post("/underwrite/send-offer/webhook", whatsapp_webhook);

export default router;
