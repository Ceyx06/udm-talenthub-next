import type { DeanRecommendation, RenewalStatus } from "@prisma/client";

export type RenewalRow = {
  id: string;
  facultyId: string;
  facultyName: string;
  college?: string | null;
  position: string;
  type: string;
  contractNo?: string | null;
  contractEndDate?: string | null; // ISO
  deanRecommendation: DeanRecommendation; // PENDING | RENEW | NOT_RENEW
  deanRemarks?: string | null;
  status: RenewalStatus; // PENDING_DEAN | APPROVED | REJECTED
  createdAt: string;
  updatedAt: string;
};

export type RenewalListResponse = {
  items: RenewalRow[];
  total: number;
  skip: number;
  take: number;
};