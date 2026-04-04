Project 07: AI Merchant Underwriting Agent  for GrabCredit & GrabInsurance 
Build an AI agent that assesses GrabOn's 3,500 active merchant partners for embedded credit  limits and insurance coverage, generating explainable pre-approved offers delivered via  WhatsApp 

[GrabCredit] [GrabInsurance] [Claude Agent] [WhatsApp API] [Explainable AI]  
Difficulty 
Hard — 3 days
Vertical 
GrabCredit + GrabInsurance (Merchant-Facing Products)


The Challenge 
GrabCredit and GrabInsurance are not just consumer products — GrabOn's 3,500 merchant  partners are equally valuable targets for embedded financial products. A small fashion merchant  on GrabOn with stable GMV and growing return customers is a perfect candidate for a working  capital loan or business interruption insurance. This project builds the AI underwriting agent that  identifies them and makes an offer. 
Why This Matters for GrabOn 
Poonawalla Fincorp's NBFC license enables GrabOn to offer merchant lending. The  underwriting data advantage is enormous: GrabOn has 12 months of GMV, transaction velocity,  deal redemption quality, and customer return rates for every merchant on its platform.  Traditional banks don't have this. This project turns that data into a working credit and insurance  underwriting engine. 
Technical Requirements 
• Design a comprehensive merchant profile schema: merchant_id, category,  monthly_gmv_12m (array), coupon_redemption_rate, unique_customer_count,  customer_return_rate, avg_order_value, seasonality_index (peak vs. trough GMV ratio),  deal_exclusivity_rate, return_and_refund_rate 
• Build a Claude underwriting agent with two modes: GrabCredit mode (outputs working  capital credit limit in ₹ lakhs, interest rate tier, tenure options) and GrabInsurance mode  (outputs business interruption coverage amount, premium quote, suggested policy type) 
• The agent's decisions must be fully explainable: every offer must include a 3-5 sentence  rationale that references specific data points from the merchant's profile — 'We are  offering ₹15L at Tier 2 rates because your GMV has grown 38% YoY, your customer  return rate of 71% indicates demand stability, and your refund rate of 2.1% is below the  category average of 4.8%' 
• Build a risk tiering system: Tier 1 (low risk, best rates), Tier 2 (moderate risk, standard  rates), Tier 3 (high risk, requires manual review) — with clear criteria for each tier
GrabOn Vibe Coder Challenge | 8 Projects | GrabCredit & GrabInsurance | Page 16 
GrabOn | Vibe Coder Challenge 2025 — CONFIDENTIAL 
• Integrate with WhatsApp Business API (or Twilio sandbox): the agent sends a pre approved offer message to the merchant's registered WhatsApp number. Message must  be formatted as a proper business notification, not a text dump 
• Build a merchant dashboard showing all 10 sample merchants: offer status, credit limit,  insurance quote, risk tier, and a one-click 'Accept Offer' flow that triggers a mock NACH  mandate 
What to Submit 
A working underwriting agent processing 10 diverse merchant profiles (covering Tier 1 through  Tier 3 outcomes, different categories, including at least 2 rejection scenarios with clear  explanations). Live demo of WhatsApp offer delivery for at least 2 merchants. 
How It Will Be Evaluated 
• Risk tiering logic is coherent and data-driven — evaluators will stress-test edge cases • Explainability narratives are specific and reference actual data points, not template text • WhatsApp integration is functional (sandbox is acceptable but must show real message  delivery) 
• The dashboard clearly shows the full underwriting decision trail for each merchant

