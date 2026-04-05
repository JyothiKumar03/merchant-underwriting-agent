"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TMerchantWithResult } from "@/types";

export const useMerchants = () =>
  useQuery<TMerchantWithResult[]>({
    queryKey: ["merchants"],
    queryFn: async () => {
      const data = await api.get_merchants();
      return data.merchants;
    },
  });
