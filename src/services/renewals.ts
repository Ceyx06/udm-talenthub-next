import axios from "axios";
import type { RenewalListResponse, RenewalRow } from "@/types/renewals";

// HR — list (view only)
export async function hrListRenewals(params?: { search?: string; skip?: number; take?: number }) {
  const { data } = await axios.get<RenewalListResponse>("/api/hr/renewals", {
    params: { search: params?.search ?? "", skip: params?.skip ?? 0, take: params?.take ?? 20 },
  });
  return data;
}

// Dean — list (same payload; you can later filter by dean's college server-side)
export async function deanListRenewals(params?: { search?: string; skip?: number; take?: number }) {
  const { data } = await axios.get<RenewalListResponse>("/api/dean/renewals", {
    params: { search: params?.search ?? "", skip: params?.skip ?? 0, take: params?.take ?? 20 },
  });
  return data;
}

// Dean — submit recommendation
export async function deanSubmitRecommendation(id: string, payload: {
  deanRecommendation: "RENEW" | "NOT_RENEW";
  deanRemarks?: string;
}) {
  const { data } = await axios.patch<RenewalRow>(`/api/dean/renewals/${id}`, payload);
  return data;
}
