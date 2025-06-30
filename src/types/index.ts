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

// ==========================================
// TIPOS PARA MÓDULO DE ARCHIVO
// ==========================================

export interface ArchivedCase {
  id: string;
  original_case_id: string;
  case_number: string;
  case_data: Case; // Datos completos del caso original
  archived_at: string;
  archived_by: string;
  archive_reason: ArchiveReasonType;
  archive_reason_text?: string;
  retention_until: string;
  retention_status: RetentionStatusType;
  tags: string[];
  reactivation_count: number;
  last_reactivated_at?: string;
  last_reactivated_by?: string;
  is_legal_hold: boolean;
  search_vector?: string;
  created_at: string;
  updated_at: string;
  // Campos de JOIN
  archived_by_user?: User;
  reactivated_by_user?: User;
}

export interface ArchivedTodo {
  id: string;
  original_todo_id: string;
  todo_data: Todo; // Datos completos del TODO original
  case_id?: string;
  archived_case_id?: string;
  archived_at: string;
  archived_by: string;
  archive_reason: ArchiveReasonType;
  archive_reason_text?: string;
  retention_until: string;
  retention_status: RetentionStatusType;
  tags: string[];
  is_legal_hold: boolean;
  search_vector?: string;
  created_at: string;
  updated_at: string;
  // Campos de JOIN
  archived_by_user?: User;
  archived_case?: ArchivedCase;
}

export interface ArchivePolicy {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  auto_archive_enabled: boolean;
  days_after_completion?: number;
  inactivity_days?: number;
  default_retention_days: number;
  apply_to_cases: boolean;
  apply_to_todos: boolean;
  conditions: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Nuevos campos de configuración general
  warning_days_before_expiry?: number;
  allow_user_archive?: boolean;
  allow_user_restore?: boolean;
  require_reason_for_archive?: boolean;
  require_reason_for_restore?: boolean;
  enable_notifications?: boolean;
  enable_legal_hold?: boolean;
  max_retention_days?: number;
  bulk_operation_limit?: number;
  // Campos de JOIN
  created_by_user?: User;
}

export interface ArchiveOperationLog {
  id: string;
  operation_type: ArchiveOperationType;
  item_type: 'CASE' | 'TODO';
  item_id: string;
  original_item_id?: string;
  performed_by: string;
  reason?: string;
  operation_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  performed_at: string;
  // Campos de JOIN
  performed_by_user?: User;
}

export interface ArchiveNotification {
  id: string;
  notification_type: ArchiveNotificationType;
  recipient_id: string;
  item_type: 'CASE' | 'TODO';
  item_id: string;
  message: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
  // Campos de JOIN
  recipient?: User;
}

// Enums para el módulo de archivo
export type ArchiveReasonType = 
  | 'MANUAL'
  | 'AUTO_TIME_BASED'
  | 'AUTO_INACTIVITY'
  | 'POLICY_COMPLIANCE'
  | 'BULK_OPERATION'
  | 'USER_REQUEST'
  | 'LEGAL_HOLD_EXPIRED'
  | 'OTHER';

export type RetentionStatusType = 
  | 'ACTIVE'
  | 'WARNING'
  | 'EXPIRED'
  | 'LEGAL_HOLD'
  | 'PENDING_DELETION';

export type ArchiveOperationType = 
  | 'ARCHIVE'
  | 'RESTORE'
  | 'DELETE'
  | 'BULK_ARCHIVE'
  | 'PERMANENT_DELETE'
  | 'POLICY_UPDATE'
  | 'RETENTION_UPDATE';

export type ArchiveNotificationType = 
  | 'BEFORE_ARCHIVE'
  | 'AFTER_ARCHIVE'
  | 'BEFORE_DELETE'
  | 'RETENTION_WARNING'
  | 'RESTORE_NOTIFICATION';

// Interfaces para filtros y criterios
export interface ArchiveCriteria {
  daysAfterCompletion?: number;
  inactivityDays?: number;
  priority?: string;
  status?: string;
  userId?: string;
  applicationId?: string;
  complexity?: string;
}

export interface ArchiveFilters {
  startDate?: string;
  endDate?: string;
  archivedBy?: string;
  archiveReason?: ArchiveReasonType;
  retentionStatus?: RetentionStatusType;
  searchQuery?: string;
  itemType?: 'case' | 'todo';
  tags?: string[];
  isLegalHold?: boolean;
  page?: number;
  limit?: number;
}

export interface ArchiveSearchResult {
  id: string;
  type: 'case' | 'todo';
  title: string;
  case_number?: string;
  archived_at: string;
  archived_by: string;
  archived_by_name?: string;
  rank: number;
  highlight?: string;
}

export interface ArchiveStats {
  totalArchivedCases: number;
  totalArchivedTodos: number;
  archivesThisMonth: number;
  nearingRetention: number;
  reactivatedCases: number;
  storageUsed?: string;
  oldestArchived?: string;
  retentionBreakdown?: {
    active: number;
    warning: number;
    expired: number;
    legalHold: number;
  };
}

export interface ArchiveBulkOperation {
  id: string;
  operation_type: ArchiveOperationType;
  criteria: ArchiveCriteria;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at: string;
  completed_at?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errors?: Array<{
    item_id: string;
    error_message: string;
  }>;
  created_by: string;
}

// Interfaces para operaciones masivas
export interface BulkArchiveRequest {
  case_ids?: string[];
  todo_ids?: string[];
  reason: ArchiveReasonType;
  reason_text?: string;
  retention_days?: number;
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
