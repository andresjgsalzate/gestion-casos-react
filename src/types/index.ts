// Tipos de datos para la aplicación

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Opcional para no exponer en respuestas
  role_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Campos adicionales desde JOINs
  roles?: Role;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  // Relación con permisos desde la BD
  role_permissions?: RolePermission[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
  permissions?: Permission; // Opcional para cuando se hace JOIN
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module?: string;
  action?: string;
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Origin {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Priority {
  id: string;
  name: string;
  level: number;
  color: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Case {
  id: string;
  case_number: string;
  description: string;
  complexity: 'ALTO' | 'MEDIO' | 'BAJO';
  status: 'EN CURSO' | 'TERMINADA' | 'ESCALADA' | 'PENDIENTE';
  application_id: string;
  origin_id: string;
  priority_id: string;
  user_id: string;
  classification_score: number;
  classification: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TimeEntry {
  id: string;
  case_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned_to: string;
  created_by: string;
  due_date?: string;
  completed_at?: string;
  case_id?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionales desde JOINs
  priority_name?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  case_number?: string;
  priority?: { name: string };
  assigned_user?: { name: string };
  created_by_user?: { name: string };
  case?: { case_number: string };
}

export interface TimeTracking {
  id: string;
  todo_id?: string;
  case_id?: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  description?: string;
  created_at: string;
}

// Tipos para formularios
export interface CaseFormData {
  case_number: string;
  description: string;
  complexity: 'ALTO' | 'MEDIO' | 'BAJO';
  status: 'EN CURSO' | 'TERMINADA' | 'ESCALADA' | 'PENDIENTE';
  application_id: string;
  origin_id: string;
  priority_id: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role_id: string;
  password?: string; // Opcional para ediciones
}

export interface TodoFormData {
  title: string;
  description?: string;
  priority_id: string;
  assigned_to: string;
  due_date?: string;
  case_id?: string;
}

// Tipos para filtros y reportes
export interface DateRange {
  start: string;
  end: string;
}

export interface ReportFilter {
  date_range: DateRange;
  user_id?: string;
  application_id?: string;
  status?: string;
  priority_id?: string;
}

export interface CaseReport {
  total_cases: number;
  by_status: { [key: string]: number };
  by_complexity: { [key: string]: number };
  by_application: { [key: string]: number };
  average_resolution_time: number;
  total_time_spent: number;
}

export interface UserReport {
  user_id: string;
  user_name: string;
  total_cases: number;
  completed_cases: number;
  total_time_spent: number;
  average_case_time: number;
  todos_completed: number;
}

// Tipos para autenticación
export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
