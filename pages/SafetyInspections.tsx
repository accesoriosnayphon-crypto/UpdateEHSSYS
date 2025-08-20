
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SafetyEquipment, SafetyInspectionLog, EQUIPMENT_TYPES, EquipmentType, SafetyInspectionLogStatus, UserProfile } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon } from '../constants';
import * as db from '../services/db';

const getInspectionStatus = (equipment: SafetyEquipment): { nextDate: Date | null, status: 'En Regla' | 'Próximo a Vencer' | 'Vencido' | 'Nunca' } => {
    if (!equipment.last_inspection_date) {
        return { nextDate: null, status: 'Nunca' };
    }

    // Use T00:00:00 to ensure the date is parsed in the local timezone, avoiding UTC conversion issues with YYYY-MM-DD strings.
    const lastDateString = equipment.last_inspection_date.includes('T') ? equipment.last_inspection_date : `${equipment.last_inspection_date}T00:00:00`;
    const lastDate = new Date(lastDateString);

    // Check for invalid date
    if (isNaN(lastDate.getTime())) {
        return { nextDate: null, status: 'Nunca' };
    }

    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + equipment.inspection_frequency);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return { nextDate, status: 'Vencido' };
    if (diffDays <= 7) return { nextDate, status: 'Próximo a Vencer' };
    return { nextDate, status: 'En Regla' };
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
    const [status, setStatus] = useState<SafetyInspectionLogStatus>('OK');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Error: No hay un usuario autenticado para registrar la inspección.");
            return;
        }
        onSave({
            equipment_id: equipment.id,
            inspection_date: new Date().toISOString(),
            status,
            notes: notes || null,
            inspector_id: currentUser.id,
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <h3 className="font-bold text-lg">{equipment.name}</h3>
                <p className="text-sm text-gray-500">{equipment.location} - {equipment.type}</p>
            </div>
             <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">Estado de la Inspección</label>
                 <select value={status} onChange={e => setStatus(e.target.value as SafetyInspectionLogStatus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    <option value="OK" className="text-dark-text">OK</option>
                    <option value="Reparación Requerida" className="text-dark-text">Reparación Requerida</option>
                    <option value="Reemplazo Requerido" className="text-dark-text">Reemplazo Requerido</option>
                 </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
             <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Registrar</button>
            </div>
        </form>
    );
};

const SafetyInspections: React.FC = () => {
    const [equipment, setEquipment] = useState<SafetyEquipment[]>([]);
    const [logs, setLogs] = useState<SafetyInspectionLog[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const [view, setView] = useState<'catalog' | 'logs'>('catalog');
    const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<SafetyEquipment | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [equipRes, logsRes, usersRes] = await Promise.all([
            db.getSafetyEquipment(),
            db.getSafetyInspectionLogs(),
            db.getUsers()
        ]);
        setEquipment(equipRes);
        setLogs(logsRes);
        setUsers(usersRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveEquipment = async (data: Omit<SafetyEquipment, 'id' | 'last_inspection_date'>, id: string | null) => {
        if (id) {
            await db.updateSafetyEquipment(id, data);
        } else {
            await db.addSafetyEquipment({ ...data, last_inspection_date: null });
        }
        fetchData();
        setIsEquipmentFormOpen(false);
        setEditingEquipment(null);
    };

    const handleDeleteEquipment = async (id: string) => {
        if (window.confirm('¿Estás seguro? Se eliminará el equipo y todos sus registros de inspección.')) {
            await db.deleteSafetyEquipment(id);
            fetchData();
        }
    };

    const handleLogInspection = async (logData: Omit<SafetyInspectionLog, 'id'>) => {
        await db.addSafetyInspectionLog(logData);
        await db.updateSafetyEquipment(logData.equipment_id, { last_inspection_date: logData.inspection_date });
        
        fetchData();
        setIsLogFormOpen(false);
        setEditingEquipment(null);
    };
    
    const getStatusClass = (status: 'En Regla' | 'Próximo a Vencer' | 'Vencido' | 'Nunca') => {
        switch(status) {
            case 'Vencido': return 'bg-red-100 text-red-800';
            case 'Próximo a Vencer': return 'bg-yellow-100 text-yellow-800';
            case 'En Regla': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const logsWithDetails = useMemo(() => {
        return logs.map(log => ({
            ...log,
            equipmentName: equipment.find(e => e.id === log.equipment_id)?.name || 'Desconocido',
            inspectorName: users.find(u => u.id === log.inspector_id)?.full_name || 'Desconocido'
        }))
    }, [logs, equipment, users]);
    
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
                {view === 'catalog' && hasPermission('manage_safety_inspections') && (
                    <button onClick={() => { setEditingEquipment(null); setIsEquipmentFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                        + Agregar Equipo
                    </button>
                )}
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
                                    const { nextDate, status } = getInspectionStatus(item);
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name} <span className="text-gray-500">({item.type})</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(status)}`}>{status}</span></td>
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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr> : logsWithDetails.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.inspection_date).toLocaleString()}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.equipmentName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{log.status}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{log.inspectorName}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 max-w-sm truncate" title={log.notes || ''}>{log.notes || 'N/A'}</td>
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
        </div>
    );
};

export default SafetyInspections;