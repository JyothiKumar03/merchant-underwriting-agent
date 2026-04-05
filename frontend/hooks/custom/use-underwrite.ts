"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TUnderWritingMode, TUnderwritingResult } from "@/types";

export const useUnderwrite = (merchant_id: string) => {
  const query_client = useQueryClient();
  return useMutation<TUnderwritingResult, Error, TUnderWritingMode>({
    mutationFn: async (mode: TUnderWritingMode) => {
      const data = await api.underwrite(merchant_id, { mode });
      return data.result;
    },
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
};
