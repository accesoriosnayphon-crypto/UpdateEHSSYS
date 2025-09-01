

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Waste, WasteLog, WasteType, WASTE_TYPES, WasteUnit, WASTE_UNITS, UserProfile } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, ClipboardDocumentListIcon, ArrowDownTrayIcon } from '../constants';
import WasteDisposalDocument from '../components/WasteDisposalDocument';
import * as db from '../services/db';
import * as XLSX from 'xlsx';

type WasteLogWithDetails = WasteLog & {
    waste?: Waste;
    user?: UserProfile;
};

const WasteForm: React.FC<{
    onSave: (waste: Omit<Waste, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: Waste | null;
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<WasteType>(initialData?.type || 'No Peligroso');
    const [storageLocation, setStorageLocation] = useState(initialData?.storage_location || '');
    const [disposalMethod, setDisposalMethod] = useState(initialData?.disposal_method || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, type, storage_location: storageLocation, disposal_method: disposalMethod }, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Residuo</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select value={type} onChange={e => setType(e.target.value as WasteType)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Ubicación de Almacenamiento Temporal</label>
                <input type="text" value={storageLocation} onChange={e => setStorageLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Método de Disposición Final</label>
                <input type="text" value={disposalMethod} onChange={e => setDisposalMethod(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar</button>
            </div>
        </form>
    );
};

const WasteLogForm: React.FC<{
    onSave: (log: Omit<WasteLog, 'id' | 'folio' | 'recorded_by_user_id'>) => void;
    onClose: () => void;
    wastes: Waste[];
}> = ({ onSave, onClose, wastes }) => {
    const [formState, setFormState] = useState({
        waste_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity: 0,
        unit: 'Kg' as WasteUnit,
        manifest_number: '',
        disposal_company: '',
        cost: 0,
        manifest_url: null as string | null,
    });
    const [fileName, setFileName] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(p => ({ ...p, [name]: name === 'quantity' || name === 'cost' ? Number(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(p => ({...p, manifest_url: reader.result as string}));
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Residuo</label>
                    <select name="waste_id" value={formState.waste_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                        <option value="">Seleccione un residuo</option>
                        {wastes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Disposición</label>
                    <input type="date" name="date" value={formState.date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input type="number" name="quantity" value={formState.quantity} onChange={handleChange} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Unidad</label>
                    <select name="unit" value={formState.unit} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        {WASTE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Empresa Transportista</label>
                    <input type="text" name="disposal_company" value={formState.disposal_company} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Costo de Disposición (USD)</label>
                    <input type="number" name="cost" value={formState.cost} onChange={handleChange} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Nº Manifiesto Externo</label>
                <input type="text" name="manifest_number" value={formState.manifest_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Adjuntar Manifiesto (PDF, JPG)</label>
                <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" />
                {fileName && <p className="text-xs text-gray-500 mt-1">Archivo: {fileName}</p>}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Registrar Disposición</button>
            </div>
        </form>
    );
};

const WasteManagement: React.FC = () => {
    const [wastes, setWastes] = useState<Waste[]>([]);
    const [logs, setLogs] = useState<WasteLog[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, currentUser } = useAuth();
    
    const [view, setView] = useState<'catalog' | 'logs'>('catalog');
    const [isWasteFormOpen, setIsWasteFormOpen] = useState(false);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [isDocumentOpen, setIsDocumentOpen] = useState(false);
    
    const [editingWaste, setEditingWaste] = useState<Waste | null>(null);
    const [viewingLog, setViewingLog] = useState<WasteLogWithDetails | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [wastesRes, logsRes, usersRes] = await Promise.all([
            db.getWastes(),
            db.getWasteLogs(),
            db.getUsers()
        ]);
        setWastes(wastesRes);
        setLogs(logsRes);
        setUsers(usersRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveWaste = async (data: Omit<Waste, 'id'>, id: string | null) => {
        if (id) {
            await db.updateWaste(id, data);
        } else {
            await db.addWaste(data);
        }
        fetchData();
        setIsWasteFormOpen(false);
    };

    const handleDeleteWaste = async (id: string) => {
        if (window.confirm('¿Está seguro? Se eliminará el residuo y todos sus registros.')) {
            await db.deleteWaste(id);
            fetchData();
        }
    };
    
    const handleSaveLog = async (data: Omit<WasteLog, 'id' | 'folio' | 'recorded_by_user_id'>) => {
        if (!currentUser) return;
        await db.addWasteLog({ ...data, folio: '', recorded_by_user_id: currentUser.id });
        fetchData();
        setIsLogFormOpen(false);
    };
    
    const openDocument = (log: WasteLogWithDetails) => {
        setViewingLog(log);
        setIsDocumentOpen(true);
    };

    const logsWithDetails: WasteLogWithDetails[] = useMemo(() => {
        return logs.map(log => ({
            ...log,
            waste: wastes.find(w => w.id === log.waste_id),
            user: users.find(u => u.id === log.recorded_by_user_id)
        })).filter(log => log.waste);
    }, [logs, wastes, users]);

    const handleExport = () => {
        if (view === 'catalog') {
            const dataToExport = wastes.map(w => ({
                "Nombre del Residuo": w.name,
                "Tipo": w.type,
                "Ubicación de Almacenamiento": w.storage_location,
                "Método de Disposición": w.disposal_method,
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Catalogo_Residuos");
            XLSX.writeFile(wb, "catalogo_residuos.xlsx");
        } else { // logs view
            const dataToExport = logsWithDetails.map(log => ({
                "Folio": log.folio,
                "Fecha de Disposición": new Date(log.date).toLocaleDateString(),
                "Residuo": log.waste?.name,
                "Tipo de Residuo": log.waste?.type,
                "Cantidad": log.quantity,
                "Unidad": log.unit,
                "Empresa Transportista": log.disposal_company,
                "Nº Manifiesto": log.manifest_number,
                "Costo (USD)": log.cost,
                "Registrado Por": log.user?.full_name,
            }));
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bitacora_Disposicion");
            XLSX.writeFile(wb, "bitacora_disposicion_residuos.xlsx");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <div className="flex items-center border border-gray-300 rounded-md">
                    <button onClick={() => setView('catalog')} className={`px-4 py-2 text-sm font-semibold rounded-l-md ${view === 'catalog' ? 'bg-primary text-white' : 'bg-white text-dark-text'}`}>
                        Catálogo de Residuos
                    </button>
                    <button onClick={() => setView('logs')} className={`px-4 py-2 text-sm font-semibold rounded-r-md border-l ${view === 'logs' ? 'bg-primary text-white' : 'bg-white text-dark-text'}`}>
                        Bitácora de Disposición
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar Vista</span>
                    </button>
                    {hasPermission('manage_waste') && (
                        view === 'catalog' ? (
                            <button onClick={() => { setEditingWaste(null); setIsWasteFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                + Nuevo Tipo de Residuo
                            </button>
                        ) : (
                            <button onClick={() => setIsLogFormOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                + Registrar Disposición
                            </button>
                        )
                    )}
                </div>
            </div>

            {view === 'catalog' && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Almacenamiento</th>
                                {hasPermission('manage_waste') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {wastes.map(w => (
                                <tr key={w.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.storage_location}</td>
                                    {hasPermission('manage_waste') && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => { setEditingWaste(w); setIsWasteFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteWaste(w.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'logs' && (
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residuo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logsWithDetails.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{log.folio}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.waste?.name}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{log.quantity} {log.unit}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => openDocument(log)} className="text-gray-600 hover:text-primary"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {hasPermission('manage_waste') && (
                <>
                    <Modal isOpen={isWasteFormOpen} onClose={() => setIsWasteFormOpen(false)} title={editingWaste ? 'Editar Tipo de Residuo' : 'Nuevo Tipo de Residuo'}>
                        <WasteForm onSave={handleSaveWaste} onClose={() => setIsWasteFormOpen(false)} initialData={editingWaste} />
                    </Modal>
                    <Modal isOpen={isLogFormOpen} onClose={() => setIsLogFormOpen(false)} title="Registrar Disposición de Residuos">
                        <WasteLogForm onSave={handleSaveLog} onClose={() => setIsLogFormOpen(false)} wastes={wastes} />
                    </Modal>
                </>
            )}

             <Modal isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} title={`Manifiesto - ${viewingLog?.folio || ''}`}>
                {viewingLog && viewingLog.waste && (
                    <WasteDisposalDocument log={viewingLog} waste={viewingLog.waste} recordedByUser={viewingLog.user || null} />
                )}
            </Modal>
        </div>
    );
};

export default WasteManagement;