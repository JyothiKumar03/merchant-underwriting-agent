"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TSendOfferRequest, TSendOfferResponse } from "@/types";

export const useSendOffer = (merchant_id: string) => {
  const query_client = useQueryClient();
  return useMutation<TSendOfferResponse, Error, TSendOfferRequest>({
    mutationFn: (body: TSendOfferRequest) => api.send_offer(body),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
};
