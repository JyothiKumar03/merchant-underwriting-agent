"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useBulkUpload = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csv_text: string) => api.bulk_upload(csv_text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
};
