"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TMerchantInput } from "@/types";

export const useCreateMerchant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TMerchantInput) => api.create_merchant(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
};
