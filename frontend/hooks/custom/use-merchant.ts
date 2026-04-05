"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TMerchantWithResult } from "@/types";

export const useMerchant = (merchant_id: string) =>
  useQuery({
    queryKey: ["merchants"],
    queryFn: async (): Promise<TMerchantWithResult[]> => {
      const data = await api.get_merchants();
      return data.merchants;
    },
    select: (merchants): TMerchantWithResult | null =>
      merchants.find((m) => m.merchant_id === merchant_id) ?? null,
  });
