export interface Client {
  id: string;
  code: number;
  name: string;
  cpf: string | null;
  phone: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  routeId: string | null;
  routeName: string | null;
  active: boolean;
  createdAt: string;
}

export interface ClientFilters {
  name: string;
  state: string;
  city: string;
  street: string;
  routeId: string;
}
