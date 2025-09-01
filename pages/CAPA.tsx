import React, { useState, useEffect, useCallback } from 'react';
import { Capa, UserProfile, CapaStatus, CapaType, CAPA_STATUSES, CAPA_TYPES } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, CheckCircleIcon, SparklesIcon, ArrowDownTrayIcon } from '../constants';
import { generateCapaSuggestions } from '../services/geminiService';
import * as db from '../services/db';
import * as XLSX from 'xlsx';

const CapaForm: React.FC<{
    onSave: (capa: Omit<Capa, 'id' | 'folio' | 'status' | 'creation_date' | 'close_date' | 'verification_notes'>, id: string | null) => void;
    onClose: () => void;
    initialData: Capa | null;
    users: UserProfile[];
}> = ({ onSave, onClose, initialData, users }) => {
    const [formState, setFormState] = useState({
        source: initialData?.source || '',
        description: initialData?.description || '',
        plan: initialData?.plan || '',
        type: initialData?.type || 'Correctiva' as CapaType,
        commitment_date: initialData?.commitment_date || new Date().toISOString().split('T')[0],
        responsible_user_id: initialData?.responsible_user_id || ''
    });
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateSuggestion = async () => {
        if (!formState.description) {
            alert("Por favor, primero ingrese la descripción del problema.");
            return;
        }
        setIsAiLoading(true);
        try {
            const suggestion = await generateCapaSuggestions(formState.description);
            setFormState(prev => ({...prev, plan: suggestion}));
        } catch (error) {
            alert("Error al generar sugerencia de IA.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState, initialData?.id || null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Origen de la Acción</label>
                <input type="text" name="source" value={formState.source} onChange={handleChange} placeholder="Ej: Auditoría interna, Incidente I-0045" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Descripción del Problema / Hallazgo</label>
                <textarea name="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Plan de Acción</label>
                    <button type="button" onClick={handleGenerateSuggestion} className="flex items-center text-sm text-primary hover:text-primary-dark font-semibold disabled:opacity-50" disabled={isAiLoading}>
                       <SparklesIcon className="w-5 h-5 mr-1"/> {isAiLoading ? 'Generando...' : 'Sugerir Análisis con IA'}
                    </button>
                </div>
                <textarea name="plan" value={formState.plan} onChange={handleChange} rows={5} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Acción</label>
                    <select name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        {CAPA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Compromiso</label>
                    <input type="date" name="commitment_date" value={formState.commitment_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Responsable</label>
                <select name="responsible_user_id" value={formState.responsible_user_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                    <option value="">Seleccione un usuario</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Acción</button>
            </div>
        </form>
    );
};

const UpdateStatusForm: React.FC<{
    capa: Capa;
    onSave: (id: string, updates: Partial<Capa>) => void;
    onClose: () => void;
}> = ({ capa, onSave, onClose }) => {
    const [status, setStatus] = useState(capa.status);
    const [verificationNotes, setVerificationNotes] = useState(capa.verification_notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: Partial<Capa> = { status };
        if (status === 'Cerrada') {
            updates.verification_notes = verificationNotes;
            updates.close_date = new Date().toISOString().split('T')[0];
        }
        onSave(capa.id, updates);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nuevo Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as CapaStatus)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    {CAPA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {status === 'Cerrada' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Verificación de la Eficacia</label>
                    <textarea value={verificationNotes} onChange={e => setVerificationNotes(e.target.value)} rows={4} placeholder="Describa cómo se verificó que la acción fue efectiva y permanente." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Actualizar Estado</button>
            </div>
        </form>
    );
}

const CAPA: React.FC = () => {
    const [capas, setCapas] = useState<Capa[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingCapa, setEditingCapa] = useState<Capa | null>(null);
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        const [capasRes, usersRes] = await Promise.all([
            db.getCapas(),
            db.getUsers()
        ]);
        setCapas(capasRes);
        setUsers(usersRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveCapa = async (data: Omit<Capa, 'id' | 'folio' | 'status' | 'creation_date' | 'close_date' | 'verification_notes'>, id: string | null) => {
        if (id) {
            await db.updateCapa(id, data);
        } else {
            await db.addCapa(data);
        }
        fetchData();
        setIsFormModalOpen(false);
        setEditingCapa(null);
    };

    const handleUpdateStatus = async (id: string, updates: Partial<Capa>) => {
        await db.updateCapa(id, updates);
        fetchData();
        setIsUpdateModalOpen(false);
        setEditingCapa(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta acción?')) {
            await db.deleteCapa(id);
            fetchData();
        }
    };

    const openUpdateModal = (capa: Capa) => {
        setEditingCapa(capa);
        setIsUpdateModalOpen(true);
    };
    
    const getUserName = (id: string | null) => users.find(u => u.id === id)?.full_name || 'N/A';
    
    const getStatusClass = (status: CapaStatus) => {
        switch(status) {
            case 'Cerrada': return 'bg-green-100 text-green-800';
            case 'En Progreso': return 'bg-blue-100 text-blue-800';
            case 'Abierta': return 'bg-yellow-100 text-yellow-800';
            case 'Cancelada': return 'bg-gray-200 text-gray-800';
            default: return '';
        }
    };

    const handleExport = () => {
        const dataToExport = capas.map(c => ({
            "Folio": c.folio,
            "Fecha de Creación": new Date(c.creation_date).toLocaleDateString(),
            "Fecha Compromiso": new Date(c.commitment_date).toLocaleDateString(),
            "Fecha de Cierre": c.close_date ? new Date(c.close_date).toLocaleDateString() : '',
            "Origen": c.source,
            "Descripción": c.description,
            "Plan de Acción": c.plan,
            "Tipo": c.type,
            "Estado": c.status,
            "Responsable": getUserName(c.responsible_user_id),
            "Notas de Verificación": c.verification_notes,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Acciones_CAPA");
        XLSX.writeFile(wb, "reporte_capa.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Acciones Correctivas y Preventivas</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_capa') && (
                        <button onClick={() => { setEditingCapa(null); setIsFormModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                            + Nueva Acción
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Compromiso</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            {hasPermission('manage_capa') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                         {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                        ) : capas.map(capa => (
                            <tr key={capa.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{capa.folio}</td>
                                <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" title={capa.description}>{capa.description}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getUserName(capa.responsible_user_id)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(capa.commitment_date).toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(capa.status)}`}>{capa.status}</span></td>
                                {hasPermission('manage_capa') && (
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => openUpdateModal(capa)} className="text-green-600 hover:text-green-800" title="Actualizar Estado"><CheckCircleIcon className="w-5 h-5"/></button>
                                        <button onClick={() => { setEditingCapa(capa); setIsFormModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(capa.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingCapa ? 'Editar Acción' : 'Nueva Acción Correctiva/Preventiva'}>
                <CapaForm onSave={handleSaveCapa} onClose={() => setIsFormModalOpen(false)} initialData={editingCapa} users={users}/>
            </Modal>
            
            <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Actualizar Estado de la Acción">
                {editingCapa && <UpdateStatusForm capa={editingCapa} onSave={handleUpdateStatus} onClose={() => setIsUpdateModalOpen(false)} />}
            </Modal>
        </div>
    );
};

export default CAPA;