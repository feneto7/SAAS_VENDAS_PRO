export interface Route {
  id: string;
  code: number;
  name: string;
  description: string | null;
  periodicity: number;
  active: boolean;
  clientCount: number;
  createdAt: string;
}

export interface RouteFilters {
  name: string;
}
