"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TAcceptOfferResponse } from "@/types";

export const useAcceptOffer = (merchant_id: string) => {
  const query_client = useQueryClient();
  return useMutation<TAcceptOfferResponse, Error, void>({
    mutationFn: () => api.accept_offer({ merchantId: merchant_id }),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
};
