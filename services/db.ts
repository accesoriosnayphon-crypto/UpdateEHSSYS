// --- MOCK DATABASE for EHS Management System ---
// This service simulates a database connection using the browser's Local Storage.
// It allows the application to be fully functional for demonstration purposes without a live backend.

import * as types from '../types';

// --- UTILITIES ---

const _uuid = () => `uuid-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

const _getData = <T>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const _setData = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// --- INITIALIZATION ---

const USER_ADMIN_ID = 'user-admin-uuid';

const INITIAL_SETUP_DATA = {
    settings: {
        id: 1,
        company_name: "Mi Empresa",
        company_address: "",
        company_phone: "",
        company_logo: null
    } as types.AppSettings,
    profiles: [
        { id: USER_ADMIN_ID, email: 'admin@ehs.com', employee_number: '001', full_name: 'Administrador', level: 'Administrador', permissions: [] }
    ] as types.UserProfile[],
    employees: [] as types.Employee[],
    ppe_items: [] as types.PpeItem[],
    ppe_deliveries: [] as types.PpeDelivery[],
    ppe_assets: [] as types.PpeAsset[],
    ppe_asset_logs: [] as types.PpeAssetLog[],
    incidents: [] as types.Incident[],
    trainings: [] as types.Training[],
    inspections: [] as types.Inspection[],
    safety_equipment: [] as types.SafetyEquipment[],
    safety_inspection_logs: [] as types.SafetyInspectionLog[],
    chemicals: [] as types.Chemical[],
    work_permits: [] as types.WorkPermit[],
    wastes: [] as types.Waste[],
    waste_logs: [] as types.WasteLog[],
    respel_records: [] as types.RespelRecord[],
    capas: [] as types.Capa[],
    jhas: [
        {
            id: 'jha-1',
            title: 'Operación de Sierra de Mesa para Corte de Madera',
            area: 'Taller de Corte',
            creation_date: new Date(new Date().setDate(new Date().getDate()-10)).toISOString().split('T')[0],
            steps: [
                {
                    id: 'jha-1-step-1',
                    description: 'Inspección Pre-Uso de la Sierra de Mesa.',
                    hazards: [
                        { id: 'jha-1-h-1', description: 'Equipo defectuoso (cableado expuesto, interruptor dañado).', controls: 'Realizar checklist de inspección visual antes de cada uso. No operar si se detectan anomalías y reportar inmediatamente a supervisor.', risk_level: 'Medio' },
                        { id: 'jha-1-h-2', description: 'Guarda de seguridad del disco faltante o mal ajustada.', controls: 'Asegurar que la guarda esté siempre en su lugar y funcione correctamente. Prohibido operar la máquina sin la guarda.', risk_level: 'Alto' },
                        { id: 'jha-1-h-3', description: 'Disco de corte dañado, desafilado o incorrecto para el material.', controls: 'Verificar que el disco no tenga dientes rotos o fisuras. Utilizar el disco adecuado para el tipo de madera a cortar.', risk_level: 'Medio' },
                    ]
                },
                {
                    id: 'jha-1-step-2',
                    description: 'Ejecución del Corte de la pieza de madera.',
                    hazards: [
                        { id: 'jha-1-h-4', description: 'Contacto accidental con el disco en movimiento.', controls: 'Mantener una distancia segura. Usar siempre el empujador para piezas pequeñas (menores a 15 cm de ancho). Nunca cruzar los brazos sobre la línea de corte.', risk_level: 'Alto' },
                        { id: 'jha-1-h-5', description: 'Retroceso violento de la pieza (kickback).', controls: 'Asegurar que la guía paralela esté bien fijada y paralela al disco. No cortar madera torcida o con nudos grandes. Usar el cuchillo divisor.', risk_level: 'Alto' },
                        { id: 'jha-1-h-6', description: 'Proyección de astillas, virutas o partículas.', controls: 'Uso obligatorio de lentes de seguridad en todo momento. Asegurar que el sistema de extracción de polvo esté funcionando.', risk_level: 'Medio' },
                    ]
                },
                 {
                    id: 'jha-1-step-3',
                    description: 'Limpieza del área de trabajo post-operación.',
                    hazards: [
                        { id: 'jha-1-h-7', description: 'Cortes con el disco al limpiar con la máquina conectada.', controls: 'Desconectar la sierra de la fuente de energía antes de realizar cualquier limpieza. Utilizar cepillos o aspiradoras para remover el aserrín, no las manos.', risk_level: 'Bajo' },
                    ]
                }
            ]
        },
        {
            id: 'jha-2',
            title: 'Aplicación de Pintura con Pistola de Aire',
            area: 'Cabina de Pintura',
            creation_date: new Date(new Date().setDate(new Date().getDate()-5)).toISOString().split('T')[0],
            steps: [
                {
                    id: 'jha-2-step-1',
                    description: 'Preparación de la pintura y equipo de aspersión.',
                    hazards: [
                        { id: 'jha-2-h-1', description: 'Inhalación de vapores tóxicos de solventes.', controls: 'Realizar la mezcla en un área bien ventilada. Uso obligatorio de respirador con cartuchos para vapores orgánicos.', risk_level: 'Alto' },
                        { id: 'jha-2-h-2', description: 'Contacto de químicos con la piel o los ojos.', controls: 'Uso de guantes de nitrilo y lentes de seguridad o careta facial. Tener lavaojos de emergencia cercano y operativo.', risk_level: 'Medio' },
                    ]
                },
                {
                    id: 'jha-2-step-2',
                    description: 'Aplicación de la pintura sobre las cajas de madera.',
                    hazards: [
                        { id: 'jha-2-h-3', description: 'Atmósfera explosiva por acumulación de vapores inflamables.', controls: 'Asegurar que el sistema de extracción de la cabina de pintura esté funcionando correctamente. Prohibido el uso de herramientas que generen chispas, teléfonos celulares o fumar en el área.', risk_level: 'Alto' },
                        { id: 'jha-2-h-4', description: 'Inhalación prolongada de niebla de pintura.', controls: 'Uso de traje completo (Tyvek), respirador y guantes durante toda la aplicación. Limitar el tiempo de exposición continua.', risk_level: 'Medio' },
                    ]
                }
            ]
        }
    ] as types.Jha[],
    activities: [] as types.Activity[],
    audits: [] as types.Audit[]
};


const DB_INITIALIZED_KEY = 'ehs_db_initialized_v2'; // Use v2 to force re-init from mock data

export const initialize = async () => {
    const isInitialized = _getData(DB_INITIALIZED_KEY, false);
    if (!isInitialized) {
        console.log("Performing first-time setup of Local Storage database...");
        Object.entries(INITIAL_SETUP_DATA).forEach(([key, data]) => {
            _setData(`ehs_${key}`, data);
        });
        _setData(DB_INITIALIZED_KEY, true);
    } else {
        console.log("Local Storage database already set up.");
    }
};


// --- AUTHENTICATION ---

export const loginWithEmailPassword = async (email: string, password_raw: string): Promise<{ user: types.UserProfile | null, error: string | null }> => {
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    
    // In this mock setup, any password is valid for a known user.
    if (user) {
        // The admin user has special privileges.
        if(user.email === 'admin@ehs.com') {
            user.level = 'Administrador';
        }
        return { user, error: null };
    }
    
    return { user: null, error: 'Invalid login credentials' };
};

// --- DATA ACCESS FUNCTIONS (CRUD) ---

// Settings
export const getSettings = async (): Promise<types.AppSettings> => _getData('ehs_settings', INITIAL_SETUP_DATA.settings);
export const updateSettings = async (updates: Omit<types.AppSettings, 'id'>): Promise<types.AppSettings> => {
    const settings = await getSettings();
    const updated = { ...settings, ...updates };
    _setData('ehs_settings', updated);
    return updated;
};

// Users / Profiles
export const getUsers = async (): Promise<types.UserProfile[]> => _getData('ehs_profiles', []);
export const updateUser = async (id: string, updates: Partial<types.UserProfile>): Promise<types.UserProfile> => {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    users[index] = { ...users[index], ...updates };
    _setData('ehs_profiles', users);
    return users[index];
};
export const deleteUser = async (id: string): Promise<void> => {
    let users = await getUsers();
    users = users.filter(u => u.id !== id);
    _setData('ehs_profiles', users);
};

// Employees
export const getEmployees = async (): Promise<types.Employee[]> => _getData('ehs_employees', []);
export const addEmployee = async (employee: Omit<types.Employee, 'id'>): Promise<types.Employee> => {
    const employees = await getEmployees();
    const newEmployee = { ...employee, id: _uuid() };
    employees.push(newEmployee);
    _setData('ehs_employees', employees);
    return newEmployee;
};
export const addMultipleEmployees = async (newEmployees: Omit<types.Employee, 'id'>[]): Promise<void> => {
    const employees = await getEmployees();
    const fullNewEmployees = newEmployees.map(e => ({...e, id: _uuid()}));
    _setData('ehs_employees', [...employees, ...fullNewEmployees]);
};
export const updateEmployee = async (id: string, updates: Partial<types.Employee>): Promise<types.Employee> => {
    const employees = await getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Employee not found");
    employees[index] = { ...employees[index], ...updates };
    _setData('ehs_employees', employees);
    return employees[index];
};
export const deleteEmployee = async (id: string): Promise<void> => {
    let employees = await getEmployees();
    employees = employees.filter(e => e.id !== id);
    _setData('ehs_employees', employees);
};

// Generic CRUD factory
const createCrud = <T extends { id: string }>(tableName: keyof typeof INITIAL_SETUP_DATA, folioPrefix?: string) => {
    const key = `ehs_${tableName}`;
    return {
        getAll: async (): Promise<T[]> => _getData(key, []),
        add: async (itemData: Omit<T, 'id'>): Promise<T> => {
            const items = await _getData<T[]>(key, []);
            let newItem = { ...itemData, id: _uuid() } as T;
            if (folioPrefix) {
                const folio = `${folioPrefix}-${String(items.length + 1).padStart(4, '0')}`;
                (newItem as any).folio = folio;
            }
            items.push(newItem);
            _setData(key, items);
            return newItem;
        },
        update: async (id: string, updates: Partial<T>): Promise<T> => {
            const items = await _getData<T[]>(key, []);
            const index = items.findIndex(item => item.id === id);
            if (index === -1) throw new Error(`${tableName} item not found`);
            items[index] = { ...items[index], ...updates };
            _setData(key, items);
            return items[index];
        },
        delete: async (id: string): Promise<void> => {
            let items = await _getData<T[]>(key, []);
            items = items.filter(item => item.id !== id);
            _setData(key, items);
        }
    };
};

// PPE Items
const ppeCrud = createCrud<types.PpeItem>('ppe_items');
export const getPpeItems = ppeCrud.getAll;
export const addPpeItem = ppeCrud.add;
export const updatePpeItem = ppeCrud.update;
export const deletePpeItem = ppeCrud.delete;

// PPE Deliveries
const ppeDeliveryCrud = createCrud<types.PpeDelivery>('ppe_deliveries', 'PPE');
export const getPpeDeliveries = async (): Promise<types.PpeDeliveryWithDetails[]> => {
    const deliveries = await ppeDeliveryCrud.getAll();
    const employees = await getEmployees();
    const ppeItems = await getPpeItems();
    const users = await getUsers();

    return deliveries.map(d => ({
        ...d,
        employees: employees.find(e => e.id === d.employee_id) || null,
        ppe_items: ppeItems.find(p => p.id === d.ppe_id) || null,
        profiles: users.find(u => u.id === d.requested_by_user_id) || null,
        approvedByUser: users.find(u => u.id === d.approved_by_user_id) || null,
    }));
}
export const addPpeDelivery = ppeDeliveryCrud.add;
export const updatePpeDelivery = ppeDeliveryCrud.update;

// PPE Assets
const ppeAssetCrud = createCrud<types.PpeAsset>('ppe_assets');
export const getPpeAssets = ppeAssetCrud.getAll;
export const addPpeAsset = ppeAssetCrud.add;
export const updatePpeAsset = ppeAssetCrud.update;
export const deletePpeAsset = async (id: string) => {
    await ppeAssetCrud.delete(id);
    let logs = await getPpeAssetLogs();
    logs = logs.filter(l => l.asset_id !== id);
    _setData('ehs_ppe_asset_logs', logs);
};

// PPE Asset Logs
const ppeAssetLogCrud = createCrud<types.PpeAssetLog>('ppe_asset_logs');
export const getPpeAssetLogs = ppeAssetLogCrud.getAll;
export const addPpeAssetLog = ppeAssetLogCrud.add;

// Incidents
const incidentCrud = createCrud<types.Incident>('incidents', 'INC');
export const getIncidents = incidentCrud.getAll;
export const addIncident = incidentCrud.add;

// Trainings
const trainingCrud = createCrud<types.Training>('trainings');
export const getTrainings = trainingCrud.getAll;
export const addTraining = trainingCrud.add;

// Inspections
const inspectionCrud = createCrud<types.Inspection>('inspections');
export const getInspections = inspectionCrud.getAll;
export const addInspection = inspectionCrud.add;

// Safety Equipment
const safetyEquipmentCrud = createCrud<types.SafetyEquipment>('safety_equipment');
export const getSafetyEquipment = safetyEquipmentCrud.getAll;
export const addSafetyEquipment = safetyEquipmentCrud.add;
export const updateSafetyEquipment = safetyEquipmentCrud.update;
export const deleteSafetyEquipment = async (id: string) => {
    await safetyEquipmentCrud.delete(id);
    let logs = await getSafetyInspectionLogs();
    logs = logs.filter(l => l.equipment_id !== id);
    _setData('ehs_safety_inspection_logs', logs);
};

// Safety Inspection Logs
const safetyInspectionLogCrud = createCrud<types.SafetyInspectionLog>('safety_inspection_logs');
export const getSafetyInspectionLogs = safetyInspectionLogCrud.getAll;
export const addSafetyInspectionLog = safetyInspectionLogCrud.add;

// Chemicals
const chemicalCrud = createCrud<types.Chemical>('chemicals');
export const getChemicals = chemicalCrud.getAll;
export const addChemical = chemicalCrud.add;
export const updateChemical = chemicalCrud.update;
export const deleteChemical = chemicalCrud.delete;

// Work Permits
const workPermitCrud = createCrud<types.WorkPermit>('work_permits', 'PT');
export const getWorkPermits = workPermitCrud.getAll;
export const addWorkPermit = workPermitCrud.add;
export const updateWorkPermit = workPermitCrud.update;
export const deleteWorkPermit = workPermitCrud.delete;

// Wastes
const wasteCrud = createCrud<types.Waste>('wastes');
export const getWastes = wasteCrud.getAll;
export const addWaste = wasteCrud.add;
export const updateWaste = wasteCrud.update;
export const deleteWaste = async (id: string) => {
    await wasteCrud.delete(id);
    let logs = await getWasteLogs();
    logs = logs.filter(l => l.waste_id !== id);
    _setData('ehs_waste_logs', logs);
};

// Waste Logs
const wasteLogCrud = createCrud<types.WasteLog>('waste_logs', 'MAN');
export const getWasteLogs = wasteLogCrud.getAll;
export const addWasteLog = wasteLogCrud.add;

// Respel Records
const respelCrud = createCrud<types.RespelRecord>('respel_records', 'RESPEL');
export const getRespelRecords = respelCrud.getAll;
export const addRespelRecord = async (data: Omit<types.RespelRecord, 'id' | 'folio' | 'creation_date'>) => {
    const newData = {
        ...data,
        creation_date: new Date().toISOString().split('T')[0],
    };
    return respelCrud.add(newData as Omit<types.RespelRecord, 'id'>);
};
export const updateRespelRecord = respelCrud.update;
export const deleteRespelRecord = respelCrud.delete;


// CAPAs
const capaCrud = createCrud<types.Capa>('capas', 'CAPA');
export const getCapas = capaCrud.getAll;
export const addCapa = async (data: Omit<types.Capa, 'id' | 'folio' | 'status' | 'creation_date' | 'close_date' | 'verification_notes'>) => {
    const newCapaData: Omit<types.Capa, 'id'> = {
        ...data,
        folio: '', // will be set by add function
        creation_date: new Date().toISOString().split('T')[0],
        status: 'Abierta',
        close_date: null,
        verification_notes: null,
    };
    return capaCrud.add(newCapaData as Omit<types.Capa, 'id'>);
};
export const updateCapa = capaCrud.update;
export const deleteCapa = capaCrud.delete;

// JHAs
const jhaCrud = createCrud<types.Jha>('jhas');
export const getJhas = async (): Promise<types.JhaWithSteps[]> => {
    const jhas = await jhaCrud.getAll();
    return jhas.map(j => ({ ...j, steps: (j.steps as any[] || []) as types.JhaStep[]}));
};
export const addJha = jhaCrud.add;
export const updateJha = jhaCrud.update;
export const deleteJha = jhaCrud.delete;

// Activities
const activityCrud = createCrud<types.Activity>('activities');
export const getActivities = async (): Promise<types.ActivityWithComments[]> => {
    const activities = await activityCrud.getAll();
    return activities.map(a => ({ ...a, comments: (a.comments as any[] || []) as types.Comment[]}));
};
export const addActivity = async (data: Omit<types.Activity, 'id' | 'status' | 'progress' | 'comments'>): Promise<types.Activity> => {
    const newActivity: Omit<types.Activity, 'id'> = {
        ...data,
        status: 'Pendiente',
        progress: 0,
        comments: [],
    };
    return activityCrud.add(newActivity);
};
export const updateActivity = activityCrud.update;
export const deleteActivity = activityCrud.delete;

// Audits
const auditCrud = createCrud<types.Audit>('audits', 'AUD');
export const getAudits = async (): Promise<types.AuditWithFindings[]> => {
    const audits = await auditCrud.getAll();
    return audits.map(a => ({...a, findings: (a.findings as any[] || []) as types.AuditFinding[] }));
}
export const addAudit = async (data: Omit<types.Audit, 'id' | 'folio' | 'findings'>) => {
    const newAuditData: Omit<types.Audit, 'id'> = {
        ...data,
        folio: '', // will be set by add function
        findings: []
    }
    return auditCrud.add(newAuditData);
};
export const updateAudit = auditCrud.update;
export const deleteAudit = auditCrud.delete;

export const isPpeItemInUse = async (ppeItemId: string): Promise<types.PpeItemInUseResult> => {
    const rawDeliveries = await _getData<types.PpeDelivery[]>(`ehs_ppe_deliveries`, []);
    const deliveryInUse = rawDeliveries.find(d => d.ppe_id === ppeItemId);
    if (deliveryInUse) {
        return { 
            inUse: true, 
            message: `El artículo está registrado en la entrega con folio ${deliveryInUse.folio}. No se puede eliminar.` 
        };
    }

    const assets = await getPpeAssets();
    const assetInUse = assets.find(a => a.ppe_item_id === ppeItemId);
    if (assetInUse) {
        return { 
            inUse: true, 
            message: `El artículo está asignado al activo rastreable con etiqueta ${assetInUse.asset_tag}. No se puede eliminar.` 
        };
    }

    return { inUse: false };
};