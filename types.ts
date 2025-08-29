// --- Base Types ---
export type Employee = {
  id: string;
  employee_number: string;
  name: string;
  department: string;
  position: string;
  curp?: string;
};

export type PpeItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  stock: number;
};

export type PpeDelivery = {
  id: string;
  folio: string;
  employee_id: string;
  ppe_id: string;
  quantity: number;
  date: string;
  delivery_type: "Ingreso" | "Renovación" | "Reposición" | "Visitas";
  renewal_date: string | null;
  status: "En espera" | "Aprobado";
  requested_by_user_id: string;
  approved_by_user_id: string | null;
};

export type Incident = {
  id: string;
  folio: string;
  employee_id: string | null;
  date: string;
  time: string;
  event_type: "Accidente" | "Incidente" | "Condición Insegura" | "Acto Inseguro";
  machine_or_operation: string;
  area: string;
  description: string;
  treatment: string;
  evidence_image_url: string | null;
};

export type Training = {
  id: string;
  topic: string;
  date: string;
  training_type: "Interna" | "Externa";
  instructor: string;
  duration_hours: number;
  attendees: string[] | null;
};

export type Inspection = {
  id: string;
  employee_id: string;
  date: string;
  violation: boolean;
  violations: string[] | null;
  observations: string | null;
};

export type SafetyEquipment = {
  id: string;
  name: string;
  type: "Extintor" | "Hidrante" | "Salida de Emergencia" | "Lámpara de Emergencia" | "Rampa" | "Lavaojos" | "Ducha de Seguridad" | "Otro";
  location: string;
  inspection_frequency: number;
  last_inspection_date: string | null;
};

export type SafetyInspectionLog = {
  id: string;
  equipment_id: string;
  inspection_date: string;
  status: "OK" | "Reparación Requerida" | "Reemplazo Requerido";
  notes: string | null;
  inspector_id: string;
};

export type Chemical = {
  id: string;
  name: string;
  provider: string;
  cas_number: string | null;
  location: string;
  sds_url: string;
  pictograms: string[];
};

export interface AuthorizedWorker {
    id: string;
    name: string;
    blood_pressure: string;
    is_fit: boolean | null;
}

export type WorkPermit = {
  id: string;
  folio: string;
  title: string;
  type: "Trabajo en Caliente" | "Trabajo en Altura" | "Espacio Confinado" | "Eléctrico" | "Manejo de Químicos Peligrosos" | "Otro";
  status: "Solicitado" | "Aprobado" | "Rechazado" | "En Progreso" | "Cerrado";
  request_date: string;
  valid_from: string | null;
  valid_to: string | null;
  close_date: string | null;
  requester_employee_id: string;
  approver_user_id: string | null;
  closer_user_id: string | null;
  description: string;
  location: string;
  equipment: string[] | null;
  ppe: string[] | null;
  jha_id: string | null;
  notes: string | null;
  work_type: "Interno" | "Externo";
  provider_name: string | null;
  provider_details: string | null;
  authorized_workers: AuthorizedWorker[] | null;
  final_review_accident: boolean | null;
  final_review_lockout_tagout: boolean | null;
  final_review_comments: string | null;
};

export type Waste = {
  id: string;
  name: string;
  type: "Peligroso" | "No Peligroso" | "Reciclable";
  storage_location: string;
  disposal_method: string;
};

export type WasteLog = {
  id: string;
  folio: string;
  waste_id: string;
  date: string;
  quantity: number;
  unit: "Kg" | "L" | "Unidades" | "Tambores";
  manifest_number: string | null;
  manifest_url: string | null;
  disposal_company: string | null;
  cost: number | null;
  recorded_by_user_id: string;
};

export type RespelRecord = {
  id: string;
  folio: string;
  creation_date: string;
  waste_name: string;
  waste_description: string;
  waste_type: 'Sólido' | 'Líquido' | 'Gaseoso';
  quantity: number;
  unit: 'Kg' | 'L';
  area: string;
  disposal_provider: string;
  notes: string | null;
  generator_user_id: string;
  // CRETIB properties
  is_corrosive: boolean;
  is_reactive: boolean;
  is_explosive: boolean;
  is_flammable: boolean;
  is_toxic: boolean;
  is_biologic: boolean;
};

export type Capa = {
  id: string;
  folio: string;
  creation_date: string;
  commitment_date: string;
  close_date: string | null;
  source: string;
  description: string;
  plan: string;
  type: "Correctiva" | "Preventiva";
  status: "Abierta" | "En Progreso" | "Cerrada" | "Cancelada";
  responsible_user_id: string;
  verification_notes: string | null;
};

export type UserProfile = {
  id: string;
  email: string | null;
  employee_number: string | null;
  full_name: string | null;
  level: ("Administrador" | "Supervisor" | "Operador") | null;
  permissions: string[] | null;
};
export type User = UserProfile; // Alias for consistency

export type AppSettings = {
  id: number;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_logo: string | null;
};


export type Jha = {
  id: string;
  title: string;
  area: string;
  creation_date: string;
  steps: unknown; // JSONB
};

export type Activity = {
  id: string;
  registration_date: string;
  commitment_date: string;
  description: string;
  type: "Interna" | "Externa";
  provider: string | null;
  estimated_cost: number;
  priority: "Baja" | "Media" | "Alta";
  status: "Pendiente" | "En Progreso" | "Completada";
  comments: unknown; // JSONB
  progress: number;
  responsible_user_id: string;
  source_audit_id: string | null;
  source_finding_id: string | null;
};

export type Audit = {
  id: string;
  folio: string;
  title: string;
  standard: string;
  scope: string;
  start_date: string;
  end_date: string;
  lead_auditor_id: string;
  auditor_ids: string[];
  findings: unknown; // JSONB
};


// --- Enums, Constants, and Detailed Types ---

export type DeliveryType = 'Ingreso' | 'Renovación' | 'Reposición' | 'Visitas';
export type ApprovalStatus = 'En espera' | 'Aprobado';

export interface PpeDeliveryWithDetails extends PpeDelivery {
  employees: Employee | null;
  ppe_items: PpeItem | null;
  profiles: UserProfile | null; // For requestedByUser
  approvedByUser: UserProfile | null; // Custom alias for second profiles relation
}

export type PpeItemInUseResult = {
  inUse: boolean;
  message?: string;
};

export const PPE_ASSET_STATUSES = ['En Almacén', 'Asignado', 'En Mantenimiento', 'Fuera de Servicio'] as const;
export type PpeAssetStatus = typeof PPE_ASSET_STATUSES[number];

export const PPE_ASSET_EVENT_TYPES = ['Creación', 'Asignación', 'Devolución', 'Mantenimiento', 'Inspección', 'Baja'] as const;
export type PpeAssetEventType = typeof PPE_ASSET_EVENT_TYPES[number];

export type PpeAsset = {
    id: string;
    asset_tag: string; // Unique identifier for the physical item
    ppe_item_id: string;
    status: PpeAssetStatus;
    purchase_date: string;
    last_maintenance_date: string | null;
    decommission_date: string | null;
    current_employee_id: string | null;
};

export type PpeAssetLog = {
    id: string;
    asset_id: string;
    date: string;
    event_type: PpeAssetEventType;
    details: string; // "Assigned to John Doe", "Maintenance performed", "Decommissioned due to wear"
    user_id: string;
};

export type EventType = 'Accidente' | 'Incidente' | 'Condición Insegura' | 'Acto Inseguro';

export type TrainingType = 'Interna' | 'Externa';

export type ViolationType =
  | 'Falta de lentes de seguridad'
  | 'Falta de botas de seguridad'
  | 'Falta de mascarilla / respirador'
  | 'Falta de mandil / delantal'
  | 'Falta de guantes'
  | 'Falta de casco'
  | 'Uso incorrecto del equipo'
  | 'Equipo en mal estado';

export const VIOLATION_TYPES: ViolationType[] = [
  'Falta de lentes de seguridad',
  'Falta de botas de seguridad',
  'Falta de mascarilla / respirador',
  'Falta de mandil / delantal',
  'Falta de guantes',
  'Falta de casco',
  'Uso incorrecto del equipo',
  'Equipo en mal estado',
];

export const EQUIPMENT_TYPES = ['Extintor', 'Hidrante', 'Salida de Emergencia', 'Lámpara de Emergencia', 'Rampa', 'Lavaojos', 'Ducha de Seguridad', 'Otro'] as const;
export type EquipmentType = typeof EQUIPMENT_TYPES[number];

export type SafetyInspectionLogStatus = 'OK' | 'Reparación Requerida' | 'Reemplazo Requerido';

export type ActivityType = 'Interna' | 'Externa';
export type ActivityPriority = 'Baja' | 'Media' | 'Alta';
export type ActivityStatus = 'Pendiente' | 'En Progreso' | 'Completada';

export type JhaRiskLevel = 'Bajo' | 'Medio' | 'Alto';
export const JHA_RISK_LEVELS: JhaRiskLevel[] = ['Bajo', 'Medio', 'Alto'];

export type PictogramKey = 
  | 'explosive' 
  | 'flammable' 
  | 'oxidizing' 
  | 'compressed_gas' 
  | 'corrosive' 
  | 'toxic' 
  | 'harmful' 
  | 'health_hazard' 
  | 'environmental_hazard';

export const WORK_PERMIT_TYPES = ['Trabajo en Caliente', 'Trabajo en Altura', 'Espacio Confinado', 'Eléctrico', 'Manejo de Químicos Peligrosos', 'Otro'] as const;
export type WorkPermitType = typeof WORK_PERMIT_TYPES[number];

export const WORK_PERMIT_STATUSES = ['Solicitado', 'Aprobado', 'Rechazado', 'En Progreso', 'Cerrado'] as const;
export type WorkPermitStatus = typeof WORK_PERMIT_STATUSES[number];

export const WASTE_TYPES = ['Peligroso', 'No Peligroso', 'Reciclable'] as const;
export type WasteType = typeof WASTE_TYPES[number];
export const WASTE_UNITS = ['Kg', 'L', 'Unidades', 'Tambores'] as const;
export type WasteUnit = typeof WASTE_UNITS[number];
export const RESPEL_UNITS = ['Kg', 'L'] as const;
export type RespelUnit = typeof RESPEL_UNITS[number];


export type AuditFindingType = 'No Conformidad' | 'Observación' | 'Oportunidad de Mejora';
export const AUDIT_FINDING_TYPES: AuditFindingType[] = ['No Conformidad', 'Observación', 'Oportunidad de Mejora'];

export type AuditFindingSeverity = 'Mayor' | 'Menor';
export const AUDIT_FINDING_SEVERITIES: AuditFindingSeverity[] = ['Mayor', 'Menor'];

export type AuditFindingStatus = 'Abierta' | 'Cerrada';
export const AUDIT_FINDING_STATUSES: AuditFindingStatus[] = ['Abierta', 'Cerrada'];

export const CAPA_STATUSES = ['Abierta', 'En Progreso', 'Cerrada', 'Cancelada'] as const;
export type CapaStatus = typeof CAPA_STATUSES[number];

export const CAPA_TYPES = ['Correctiva', 'Preventiva'] as const;
export type CapaType = typeof CAPA_TYPES[number];


// --- Types with structured JSON fields that need more specific local definitions ---

// JHA (Job Hazard Analysis)
export interface JhaHazard {
    id: string;
    description: string;
    controls: string;
    risk_level: JhaRiskLevel;
}
export interface JhaStep {
    id: string;
    description: string;
    hazards: JhaHazard[];
}
// For Jha, we use the Row type and assume `steps` is parsed to JhaStep[]
export type JhaWithSteps = Omit<Jha, 'steps'> & { steps: JhaStep[] };


// Activity
export interface Comment {
  id: string;
  user_id: string;
  date: string; // ISO string
  text: string;
}
// For Activity, we use the Row type and assume `comments` is parsed to Comment[]
export type ActivityWithComments = Omit<Activity, 'comments'> & { comments: Comment[] };


// Audit
export interface AuditFinding {
    id: string;
    audit_id: string;
    description: string;
    type: AuditFindingType;
    severity: AuditFindingSeverity;
    status: AuditFindingStatus;
    reference: string;
}
// For Audit, we use the Row type and assume `findings` is parsed to AuditFinding[]
export type AuditWithFindings = Omit<Audit, 'findings'> & { findings: AuditFinding[] };


// --- User Management Types ---
export type Permission = 
  | 'view_dashboard'
  | 'manage_employees'
  | 'manage_ppe'
  | 'manage_incidents'
  | 'manage_trainings'
  | 'manage_inspections'
  | 'manage_safety_inspections'
  | 'manage_jha'
  | 'manage_chemicals'
  | 'manage_activities'
  | 'manage_work_permits'
  | 'manage_waste'
  | 'manage_respel'
  | 'manage_audits'
  | 'manage_capa'
  | 'view_reports'
  | 'manage_users'
  | 'manage_settings'
  | 'view_history';

export const PERMISSIONS: { id: Permission; label: string }[] = [
  { id: 'view_dashboard', label: 'Ver Dashboard' },
  { id: 'manage_employees', label: 'Gestionar Empleados' },
  { id: 'manage_ppe', label: 'Gestionar EPP' },
  { id: 'manage_incidents', label: 'Gestionar Incidentes' },
  { id: 'manage_trainings', label: 'Gestionar Capacitaciones' },
  { id: 'manage_inspections', label: 'Gestionar Insp. EPP' },
  { id: 'manage_safety_inspections', label: 'Gestionar Insp. de Seguridad' },
  { id: 'manage_jha', label: 'Gestionar Análisis de Trabajo Seguro' },
  { id: 'manage_chemicals', label: 'Gestionar Inventario Químico' },
  { id: 'manage_activities', label: 'Gestionar Actividades' },
  { id: 'manage_work_permits', label: 'Gestionar Permisos de Trabajo' },
  { id: 'manage_waste', label: 'Gestionar Residuos' },
  { id: 'manage_respel', label: 'Gestionar Formatos RESPEL' },
  { id: 'manage_audits', label: 'Gestionar Auditorías'},
  { id: 'manage_capa', label: 'Gestionar Acciones CAPA' },
  { id: 'view_reports', label: 'Ver Reportes' },
  { id: 'manage_users', label: 'Gestionar Usuarios' },
  { id: 'manage_settings', label: 'Gestionar Configuración' },
  { id: 'view_history', label: 'Ver Historial de Empleado' },
];

export type UserLevel = 'Administrador' | 'Supervisor' | 'Operador';