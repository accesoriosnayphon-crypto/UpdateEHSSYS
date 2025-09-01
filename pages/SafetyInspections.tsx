import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SafetyEquipment, SafetyInspectionLog, EQUIPMENT_TYPES, EquipmentType, SafetyInspectionLogStatus, UserProfile, ChecklistItemResult } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon } from '../constants';
import * as db from '../services/db';
import { useData } from '../contexts/DataContext';
import * as XLSX from 'xlsx';

const CHECKLISTS: Record<EquipmentType, string[]> = {
    'Extintor': [
        'Manómetro en rango operativo (verde)',
        'Sello de seguridad intacto y sin alteraciones',
        'Acceso al equipo libre de obstrucciones',
        'Señalización visible y en buen estado',
        'Manguera y boquilla en buenas condiciones (sin grietas ni bloqueos)',
        'Fecha de última recarga/mantenimiento vigente',
        'Cilindro sin corrosión, abolladuras o daños visibles',
    ],
    'Hidrante': [
        'Acceso libre de obstrucciones',
        'Válvulas y conexiones en buen estado, sin fugas',
        'Señalización visible y correcta',
        'Gabinete (si aplica) en buen estado y sin candado',
        'Mangueras y boquillas acopladas y en buen estado',
    ],
    'Lavaojos': [
        'Acceso despejado y sin obstrucciones',
        'Activación fácil y se mantiene abierta (manos libres)',
        'Flujo de agua adecuado y continuo en ambos ojos',
        'Agua limpia y sin sedimentos visibles',
        'Tapas protectoras de boquillas en su lugar',
    ],
    'Ducha de Seguridad': [
         'Acceso despejado y sin obstrucciones',
         'Activador (palanca/cadena) visible y funcional',
         'Flujo de agua abundante y cubre el patrón requerido',
         'Drenaje funcionando correctamente',
    ],
    'Lámpara de Emergencia': [
        'Luminaria limpia y sin obstrucciones',
        'Batería cargada (indicador LED en verde)',
        'Prueba de funcionamiento correcta (presionar botón de test)',
    ],
    'Salida de Emergencia': [
        'Ruta de evacuación despejada',
        'Puerta abre fácilmente en la dirección de evacuación',
        'Señalización ("SALIDA") visible e iluminada',
        'Barra antipánico funcionando correctamente',
    ],
    'Rampa': [
         'Superficie antideslizante en buen estado',
         'Barandales firmes y a la altura correcta',
         'Libre de obstrucciones o derrames',
    ],
    'Carretilla de agua': [
        'Nivel de agua correcto',
        'Ruedas infladas y en buen estado',
        'Manguera y boquilla funcionales, sin fugas',
        'Estructura sin daños o corrosión excesiva',
    ],
    'Unidad móvil': [
        'Frenos de estacionamiento funcionando',
        'Luces y alarmas de reversa operativas',
        'Neumáticos en buen estado y con presión adecuada',
        'Extintor de incendios a bordo, cargado y vigente',
        'Espejos y ventanas limpios y sin daños',
    ],
    'Otro': [
        'Verificar estado general del equipo',
        'Asegurar operatividad según manual del fabricante',
        'Confirmar que no presenta riesgos evidentes',
    ]
};

const getComprehensiveEquipmentStatus = (
    equipment: SafetyEquipment, 
    allLogs: SafetyInspectionLog[]
): { 
    statusText: 'En Regla' | 'Próximo a Vencer' | 'Vencido' | 'Nunca' | 'Atención Requerida';
    nextDate: Date | null;
    notes: string | null;
} => {
    // Find the most recent log for this equipment
    const equipmentLogs = allLogs
        .filter(log => log.equipment_id === equipment.id)
        .sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());

    const latestLog = equipmentLogs[0];

    // Case 1: The latest inspection requires attention. This overrides any date logic.
    if (latestLog && (latestLog.status === 'Reparación Requerida' || latestLog.status === 'Reemplazo Requerido')) {
        return {
            statusText: 'Atención Requerida',
            nextDate: null, // Next date is irrelevant if it's broken
            notes: `Último estado: ${latestLog.status}`,
        };
    }

    // Case 2: No logs, or the latest log is "OK". Proceed with date-based check.
    if (!equipment.last_inspection_date) {
        return { statusText: 'Nunca', nextDate: null, notes: 'Nunca inspeccionado' };
    }

    const lastDateString = equipment.last_inspection_date.includes('T') ? equipment.last_inspection_date : `${equipment.last_inspection_date}T00:00:00`;
    const lastDate = new Date(lastDateString);

    if (isNaN(lastDate.getTime())) {
        return { statusText: 'Nunca', nextDate: null, notes: 'Fecha inválida' };
    }
    
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + equipment.inspection_frequency);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return { statusText: 'Vencido', nextDate, notes: null };
    if (diffDays <= 7) return { statusText: 'Próximo a Vencer', nextDate, notes: null };
    
    return { statusText: 'En Regla', nextDate, notes: null };
};

const EquipmentForm: React.FC<{
    onSave: (equipment: Omit<SafetyEquipment, 'id' | 'last_inspection_date'>, id: string | null) => void;
    onClose: () => void;
    initialData: SafetyEquipment | null;
}> = ({ onSave, onClose, initialData }) => {
    const [formState, setFormState] = useState({
        name: initialData?.name || '',
        type: initialData?.type || 'Extintor' as EquipmentType,
        location: initialData?.location || '',
        inspection_frequency: initialData?.inspection_frequency || 30,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const val = name === 'inspection_frequency' ? Number(value) : value;
        setFormState(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState, initialData?.id || null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Equipo</label>
                <input type="text" name="name" value={formState.name} onChange={handleChange} placeholder="Ej: Extintor Pasillo Norte" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Equipo</label>
                    <select name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        {EQUIPMENT_TYPES.map(t => <option key={t} value={t} className="text-dark-text">{t}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <input type="text" name="location" value={formState.location} onChange={handleChange} placeholder="Ej: Planta 1, Almacén" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Frecuencia de Inspección (días)</label>
                <input type="number" name="inspection_frequency" value={formState.inspection_frequency} onChange={handleChange} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Equipo</button>
            </div>
        </form>
    );
};

const LogInspectionForm: React.FC<{
    onSave: (log: Omit<SafetyInspectionLog, 'id'>) => void;
    onClose: () => void;
    equipment: SafetyEquipment;
}> = ({ onSave, onClose, equipment }) => {
    const { currentUser } = useAuth();
    const checklistItems = CHECKLISTS[equipment.type] || CHECKLISTS['Otro'];

    const [results, setResults] = useState<ChecklistItemResult[]>(() => 
        checklistItems.map((item, index) => ({
            id: `item-${index}`,
            item: item,
            status: 'N/A',
            comment: ''
        }))
    );
    const [overallStatus, setOverallStatus] = useState<SafetyInspectionLogStatus>('OK');
    const [generalNotes, setGeneralNotes] = useState('');

    const handleResultChange = (id: string, field: 'status' | 'comment', value: 'OK' | 'NOK' | 'N/A' | string) => {
        setResults(prevResults => {
            const newResults = prevResults.map(r => r.id === id ? { ...r, [field]: value } : r);
            
            if (newResults.some(r => r.status === 'NOK')) {
                setOverallStatus('Reparación Requerida');
            } else {
                setOverallStatus('OK');
            }
            return newResults;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Error: No hay un usuario autenticado.");
            return;
        }
        onSave({
            equipment_id: equipment.id,
            inspection_date: new Date().toISOString(),
            status: overallStatus,
            notes: generalNotes || null,
            inspector_id: currentUser.id,
            checklist_results: results
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="font-bold text-lg">{equipment.name}</h3>
                <p className="text-sm text-gray-500">{equipment.location} - {equipment.type}</p>
            </div>
             <div className="border-t pt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                <h4 className="text-md font-semibold text-dark-text">Lista de Verificación</h4>
                {results.map((result) => (
                    <div key={result.id} className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium text-gray-800 mb-2">{result.item}</p>
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 flex items-center space-x-3">
                                <label className="flex items-center text-sm"><input type="radio" name={`status-${result.id}`} value="OK" checked={result.status === 'OK'} onChange={(e) => handleResultChange(result.id, 'status', e.target.value as 'OK')} className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"/> <span className="ml-1 text-green-700 font-bold">OK</span></label>
                                <label className="flex items-center text-sm"><input type="radio" name={`status-${result.id}`} value="NOK" checked={result.status === 'NOK'} onChange={(e) => handleResultChange(result.id, 'status', e.target.value as 'NOK')} className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"/> <span className="ml-1 text-red-700 font-bold">NOK</span></label>
                                <label className="flex items-center text-sm"><input type="radio" name={`status-${result.id}`} value="N/A" checked={result.status === 'N/A'} onChange={(e) => handleResultChange(result.id, 'status', e.target.value as 'N/A')} className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"/> <span className="ml-1 text-gray-600">N/A</span></label>
                            </div>
                            <input
                                type="text"
                                placeholder="Comentario (si es NOK)..."
                                value={result.comment}
                                onChange={(e) => handleResultChange(result.id, 'comment', e.target.value)}
                                className="flex-grow block w-full px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm"
                                disabled={result.status !== 'NOK'}
                            />
                        </div>
                    </div>
                ))}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Estado General de la Inspección</label>
                 <select value={overallStatus} onChange={e => setOverallStatus(e.target.value as SafetyInspectionLogStatus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    <option value="OK" className="text-dark-text">OK</option>
                    <option value="Reparación Requerida" className="text-dark-text">Reparación Requerida</option>
                    <option value="Reemplazo Requerido" className="text-dark-text">Reemplazo Requerido</option>
                 </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Notas Generales</label>
                <textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
             <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Registrar</button>
            </div>
        </form>
    );
};

const LogDetailsModal: React.FC<{
    log: SafetyInspectionLog;
    equipment: SafetyEquipment | undefined;
    inspector: UserProfile | undefined;
    onClose: () => void;
}> = ({ log, equipment, inspector, onClose }) => {
    if (!log) return null;
    return (
        <Modal isOpen={true} onClose={onClose} title={`Detalles de Inspección - ${equipment?.name || ''}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Equipo:</strong> {equipment?.name}</p>
                    <p><strong>Ubicación:</strong> {equipment?.location}</p>
                    <p><strong>Fecha:</strong> {new Date(log.inspection_date).toLocaleString()}</p>
                    <p><strong>Inspector:</strong> {inspector?.full_name}</p>
                    <p><strong>Estado General:</strong> {log.status}</p>
                </div>
                {log.notes && (
                    <div>
                        <h4 className="font-semibold">Notas Generales:</h4>
                        <p className="text-sm p-2 bg-gray-50 rounded">{log.notes}</p>
                    </div>
                )}
                 {log.checklist_results && log.checklist_results.length > 0 && (
                     <div>
                        <h4 className="font-semibold mt-4 border-t pt-2">Resultados de la Verificación:</h4>
                        <ul className="space-y-2 max-h-64 overflow-y-auto mt-2 pr-2">
                           {log.checklist_results.map(result => (
                               <li key={result.id} className="p-2 border rounded-md">
                                   <div className="flex justify-between items-center">
                                       <span className="text-sm">{result.item}</span>
                                       <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                            result.status === 'OK' ? 'bg-green-100 text-green-800' : 
                                            result.status === 'NOK' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                        }`}>{result.status}</span>
                                   </div>
                                   {result.comment && <p className="text-xs text-gray-600 mt-1 pl-2 border-l-2 border-gray-300"><em>Comentario: {result.comment}</em></p>}
                               </li>
                           ))}
                        </ul>
                    </div>
                 )}
            </div>
        </Modal>
    );
};

const SafetyInspections: React.FC = () => {
    const { safetyEquipment: equipment, safetyInspectionLogs: logs, users, loading, refreshData } = useData();
    const { hasPermission } = useAuth();
    const [sortedLogs, setSortedLogs] = useState<SafetyInspectionLog[]>([]);

    const [view, setView] = useState<'catalog' | 'logs'>('catalog');
    const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<SafetyEquipment | null>(null);

    const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);
    const [viewingLog, setViewingLog] = useState<SafetyInspectionLog | null>(null);

    useEffect(() => {
        if(logs) {
            setSortedLogs([...logs].sort((a,b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()));
        }
    }, [logs]);

    const handleSaveEquipment = async (data: Omit<SafetyEquipment, 'id' | 'last_inspection_date'>, id: string | null) => {
        if (id) {
            await db.updateSafetyEquipment(id, data);
        } else {
            await db.addSafetyEquipment({ ...data, last_inspection_date: null });
        }
        refreshData();
        setIsEquipmentFormOpen(false);
        setEditingEquipment(null);
    };

    const handleDeleteEquipment = async (id: string) => {
        if (window.confirm('¿Estás seguro? Se eliminará el equipo y todos sus registros de inspección.')) {
            await db.deleteSafetyEquipment(id);
            refreshData();
        }
    };

    const handleLogInspection = async (logData: Omit<SafetyInspectionLog, 'id'>) => {
        await db.addSafetyInspectionLog(logData);
        await db.updateSafetyEquipment(logData.equipment_id, { last_inspection_date: logData.inspection_date });
        
        refreshData();
        setIsLogFormOpen(false);
        setEditingEquipment(null);
    };
    
    const getStatusClass = (status: 'En Regla' | 'Próximo a Vencer' | 'Vencido' | 'Nunca' | 'Atención Requerida') => {
        switch(status) {
            case 'Atención Requerida': return 'bg-red-100 text-red-800';
            case 'Vencido': return 'bg-red-100 text-red-800';
            case 'Próximo a Vencer': return 'bg-yellow-100 text-yellow-800';
            case 'En Regla': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const logsWithDetails = useMemo(() => {
        return sortedLogs.map(log => ({
            ...log,
            equipmentName: equipment.find(e => e.id === log.equipment_id)?.name || 'Desconocido',
            inspectorName: users.find(u => u.id === log.inspector_id)?.full_name || 'Desconocido'
        }))
    }, [sortedLogs, equipment, users]);

    const handleExport = () => {
        if (view === 'catalog') {
            const dataToExport = equipment.map(item => {
                const { statusText, nextDate } = getComprehensiveEquipmentStatus(item, logs);
                return {
                    "Equipo": item.name,
                    "Tipo": item.type,
                    "Ubicación": item.location,
                    "Estado de Inspección": statusText,
                    "Próxima Inspección": nextDate ? nextDate.toLocaleDateString() : 'N/A',
                    "Frecuencia (días)": item.inspection_frequency,
                };
            });
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Catalogo_Equipos_Seguridad");
            XLSX.writeFile(wb, "catalogo_equipos_seguridad.xlsx");
        } else { // logs view
            const dataToExport = logsWithDetails.map(log => ({
                "Fecha": new Date(log.inspection_date).toLocaleString(),
                "Equipo": log.equipmentName,
                "Estado": log.status,
                "Inspector": log.inspectorName,
                "Notas": log.notes || '',
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bitacora_Inspecciones");
            XLSX.writeFile(wb, "bitacora_inspecciones_seguridad.xlsx");
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <div className="flex items-center border border-gray-300 rounded-md">
                    <button onClick={() => setView('catalog')} className={`px-4 py-2 text-sm font-semibold rounded-l-md ${view === 'catalog' ? 'bg-primary text-white' : 'bg-white text-dark-text'}`}>
                        Catálogo de Equipos
                    </button>
                    <button onClick={() => setView('logs')} className={`px-4 py-2 text-sm font-semibold rounded-r-md border-l ${view === 'logs' ? 'bg-primary text-white' : 'bg-white text-dark-text'}`}>
                        Bitácora de Inspecciones
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar Vista</span>
                    </button>
                    {view === 'catalog' && hasPermission('manage_safety_inspections') && (
                        <button onClick={() => { setEditingEquipment(null); setIsEquipmentFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                            + Agregar Equipo
                        </button>
                    )}
                </div>
            </div>
            
            <>
                {view === 'catalog' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado de Inspección</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próxima Inspección</th>
                                    {hasPermission('manage_safety_inspections') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr> : equipment.map(item => {
                                    const { statusText, nextDate, notes } = getComprehensiveEquipmentStatus(item, logs);
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name} <span className="text-gray-500">({item.type})</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(statusText)}`}>{statusText}</span>
                                                {notes && <p className="text-xs text-red-600 mt-1">{notes}</p>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nextDate ? nextDate.toLocaleDateString() : 'N/A'}</td>
                                            {hasPermission('manage_safety_inspections') && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button onClick={() => { setEditingEquipment(item); setIsLogFormOpen(true); }} className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-semibold">Inspeccionar</button>
                                                    <button onClick={() => { setEditingEquipment(item); setIsEquipmentFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDeleteEquipment(item.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {view === 'logs' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr> : logsWithDetails.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.inspection_date).toLocaleString()}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.equipmentName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{log.status}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{log.inspectorName}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-sm truncate" title={log.notes || ''}>{log.notes || 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => { setViewingLog(log); setIsLogDetailsOpen(true); }} className="text-gray-600 hover:text-primary" title="Ver Detalles">
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </>
            
            {hasPermission('manage_safety_inspections') && (
                <>
                    <Modal isOpen={isEquipmentFormOpen} onClose={() => setIsEquipmentFormOpen(false)} title={editingEquipment ? 'Editar Equipo de Seguridad' : 'Agregar Equipo de Seguridad'}>
                        <EquipmentForm onSave={handleSaveEquipment} onClose={() => setIsEquipmentFormOpen(false)} initialData={editingEquipment} />
                    </Modal>
                     <Modal isOpen={isLogFormOpen} onClose={() => setIsLogFormOpen(false)} title="Registrar Inspección">
                        {editingEquipment && <LogInspectionForm onSave={handleLogInspection} onClose={() => setIsLogFormOpen(false)} equipment={editingEquipment} />}
                    </Modal>
                </>
            )}

            {isLogDetailsOpen && viewingLog && (
                <LogDetailsModal
                    log={viewingLog}
                    equipment={equipment.find(e => e.id === viewingLog.equipment_id)}
                    inspector={users.find(u => u.id === viewingLog.inspector_id)}
                    onClose={() => setIsLogDetailsOpen(false)}
                />
            )}
        </div>
    );
};

export default SafetyInspections;