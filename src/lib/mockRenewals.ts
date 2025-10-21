import type { RenewalRow } from "@/types/renewals";

const KEY = "mockRenewals_v1";

// one source of truth for mocks (3 rows)
const DEFAULT_ROWS: RenewalRow[] = [
  {
    id: "mk-1",
    facultyId: "f-ana",
    facultyName: "Dr. Ana Lopez",
    college: "CAS",
    position: "Professor",
    type: "Full-time",
    contractNo: "CON-2025-001",
    contractEndDate: new Date().toISOString(),
    deanRecommendation: "RENEW",
    deanRemarks: "Strong teaching evaluations.",
    status: "APPROVED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mk-2",
    facultyId: "f-carlos",
    facultyName: "Prof. Carlos Reyes",
    college: "CHS",
    position: "Associate Professor",
    type: "Part-time",
    contractNo: "CON-2025-002",
    contractEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    deanRecommendation: "PENDING",
    deanRemarks: null,
    status: "PENDING_DEAN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mk-3",
    facultyId: "f-elena",
    facultyName: "Ms. Elena Cruz",
    college: "CBPM",
    position: "Instructor",
    type: "Full-time",
    contractNo: "CON-2025-003",
    contractEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    deanRecommendation: "NOT_RENEW",
    deanRemarks: "Performance below standard.",
    status: "REJECTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function readMock(): RenewalRow[] {
  if (typeof window === "undefined") return DEFAULT_ROWS;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_ROWS));
    return DEFAULT_ROWS;
  }
  try {
    const arr = JSON.parse(raw) as RenewalRow[];
    return Array.isArray(arr) ? arr : DEFAULT_ROWS;
  } catch {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_ROWS));
    return DEFAULT_ROWS;
  }
}

export function writeMock(rows: RenewalRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function filterMock(arr: RenewalRow[], q?: string) {
  const s = (q ?? "").trim().toLowerCase();
  if (!s) return arr;
  return arr.filter((r) =>
    [r.facultyName, r.college ?? "", r.contractNo ?? "", r.position]
      .some((x) => (x || "").toLowerCase().includes(s))
  );
}

// Update recommendation + remarks in the local mock
export function updateMockRecommendation(id: string, rec: "RENEW" | "NOT_RENEW", remarks?: string) {
  const rows = readMock().map((r) =>
    r.id === id
      ? {
          ...r,
          deanRecommendation: rec,
          deanRemarks: remarks ?? r.deanRemarks,
          // status remains PENDING_DEAN in HR until BOR/HR finalizes
          updatedAt: new Date().toISOString(),
        }
      : r
  );
  writeMock(rows);
  return rows;
}
