export type Faculty = {
  id: string;
  name: string;
  position: string;
  type: string;
  contract: string;
  recommendation: string;
  actions: string;
};

export type FacultyListResponse = {
  items: Faculty[];
  total: number;
  skip: number;
  take: number;
};

export type CreateFacultyInput = Omit<Faculty, "id">; 