export interface Employee {
  id: string;
  name: string;
  email: string | null;
  role: "admin" | "manager" | "seller";
  appCode: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  routeIds: string[];
}

export interface EmployeeForm {
  name: string;
  appCode: string;
  password: string;
  phone: string;
  email: string;
  routeIds: string[];
}
