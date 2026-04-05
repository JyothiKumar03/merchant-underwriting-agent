import { ENV } from "@/constants/env";
import type {
  TGetMerchantsResponse,
  TUnderwriteResponse,
  TSendOfferResponse,
  TAcceptOfferResponse,
  TUnderwriteRequest,
  TSendOfferRequest,
  TAcceptOfferRequest,
  TMerchantInput,
  TCreateMerchantResponse,
  TBulkUploadResponse,
} from "@/types";

const post = async <TBody, TResponse>(
  url: string,
  body: TBody
): Promise<TResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<TResponse>;
};

export const api = {
  get_merchants: async (): Promise<TGetMerchantsResponse> => {
    const res = await fetch(`${ENV.NEXT_PUBLIC_BASE_URL}/merchants`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<TGetMerchantsResponse>;
  },

  underwrite: async (
    merchant_id: string,
    body: TUnderwriteRequest
  ): Promise<TUnderwriteResponse> =>
    post(`${ENV.NEXT_PUBLIC_BASE_URL}/underwrite/${merchant_id}`, body),

  send_offer: async (body: TSendOfferRequest): Promise<TSendOfferResponse> =>
    post(`${ENV.NEXT_PUBLIC_BASE_URL}/send-offer`, body),

  accept_offer: async (
    body: TAcceptOfferRequest
  ): Promise<TAcceptOfferResponse> =>
    post(`${ENV.NEXT_PUBLIC_BASE_URL}/accept-offer`, body),

  create_merchant: async (body: TMerchantInput): Promise<TCreateMerchantResponse> =>
    post(`${ENV.NEXT_PUBLIC_BASE_URL}/merchants`, body),

  bulk_upload: async (csv_text: string): Promise<TBulkUploadResponse> => {
    const res = await fetch(`${ENV.NEXT_PUBLIC_BASE_URL}/merchants/bulk-upload`, {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csv_text,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<TBulkUploadResponse>;
  },
};
