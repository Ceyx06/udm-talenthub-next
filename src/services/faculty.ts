import { http } from "@/lib/http";
import type { Faculty, FacultyListResponse, CreateFacultyInput } from "@/types/faculty";

export async function listFaculty(params?: {
  search?: string;
  skip?: number;
  take?: number;
}): Promise<FacultyListResponse> {
  const { data } = await http.get<FacultyListResponse>("/api/hr/faculty", {
    params: {
      search: params?.search ?? "",
      skip: params?.skip ?? 0,
      take: params?.take ?? 20,
    },
  });
  return data;
}

export async function createFaculty(payload: CreateFacultyInput): Promise<Faculty> {
  const { data } = await http.post<Faculty>("/api/hr/faculty", payload);
  return data;
}
