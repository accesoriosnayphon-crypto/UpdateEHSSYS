import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RespelRecord, UserProfile, RespelUnit, RESPEL_UNITS } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, ClipboardDocumentListIcon, TagIcon, ArrowDownTrayIcon } from '../constants';
import RespelDocument from '../components/RespelDocument';
import RespelLabel from '../components/RespelLabel';
import * as db from '../services/db';
import * as XLSX from 'xlsx';

type RespelRecordWithDetails = RespelRecord & {
    generatorUser?: UserProfile;
};

const CRETIB_PROPERTIES: { key: keyof RespelRecord; label: string }[] = [
    { key: 'is_corrosive', label: 'Corrosivo' },
    { key: 'is_reactive', label: 'Reactivo' },
    { key: 'is_explosive', label: 'Explosivo' },
    { key: 'is_flammable', label: 'Inflamable' },
    { key: 'is_toxic', label: 'Tóxico' },
    { key: 'is_biologic', label: 'Biológico Infeccioso' },
];

const RespelForm: React.FC<{
    onSave: (record: Omit<RespelRecord, 'id' | 'folio' | 'creation_date' | 'generator_user_id'>, id: string | null) => void;
    onClose: () => void;
    initialData: RespelRecord | null;
}> = ({ onSave, onClose, initialData }) => {
    const [formState, setFormState] = useState({
        waste_name: initialData?.waste_name || '',
        waste_description: initialData?.waste_description || '',
        waste_type: initialData?.waste_type || 'Sólido' as 'Sólido' | 'Líquido' | 'Gaseoso',
        quantity: initialData?.quantity || 0,
        unit: initialData?.unit || 'Kg' as RespelUnit,
        area: initialData?.area || '',
        disposal_provider: initialData?.disposal_provider || '',
        notes: initialData?.notes || '',
        is_corrosive: initialData?.is_corrosive || false,
        is_reactive: initialData?.is_reactive || false,
        is_explosive: initialData?.is_explosive || false,
        is_flammable: initialData?.is_flammable || false,
        is_toxic: initialData?.is_toxic || false,
        is_biologic: initialData?.is_biologic || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
    };

     const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormState(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Sustancia o Desecho</label>
                <input type="text" name="waste_name" value={formState.waste_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Información / Descripción</label>
                <textarea name="waste_description" value={formState.waste_description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Residuo</label>
                    <select name="waste_type" value={formState.waste_type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        <option value="Sólido">Sólido</option>
                        <option value="Líquido">Líquido</option>
                        <option value="Gaseoso">Gaseoso</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input type="number" name="quantity" value={formState.quantity} onChange={handleChange} min="0" step="any" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Unidad</label>
                    <select name="unit" value={formState.unit} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        {RESPEL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Área de Generación</label>
                    <input type="text" name="area" value={formState.area} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor de Disposición</label>
                    <input type="text" name="disposal_provider" value={formState.disposal_provider} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>

            <fieldset className="pt-4 border-t">
                <legend className="text-sm font-bold text-gray-700 mb-2">Características de Peligrosidad (CRETIB)</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CRETIB_PROPERTIES.map(({ key, label }) => (
                        <label key={key} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                name={key}
                                checked={formState[key as keyof typeof formState] as boolean}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                        </label>
                    ))}
                </div>
            </fieldset>

             <div>
                <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
                <textarea name="notes" value={formState.notes || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Formato</button>
            </div>
        </form>
    );
};


const Respel: React.FC = () => {
    const [records, setRecords] = useState<RespelRecord[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, currentUser } = useAuth();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDocumentOpen, setIsDocumentOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

    const [editingRecord, setEditingRecord] = useState<RespelRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<RespelRecordWithDetails | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [recordsRes, usersRes] = await Promise.all([
            db.getRespelRecords(),
            db.getUsers()
        ]);
        setRecords(recordsRes.sort((a,b) => new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()));
        setUsers(usersRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (data: Omit<RespelRecord, 'id' | 'folio' | 'creation_date' | 'generator_user_id'>, id: string | null) => {
        if (id) {
            const originalRecord = records.find(r => r.id === id);
            if(originalRecord) {
                await db.updateRespelRecord(id, { ...originalRecord, ...data });
            }
        } else {
             if (!currentUser) {
                alert("No se puede crear el registro, no hay un usuario logueado.");
                return;
            }
            const recordData = { ...data, generator_user_id: currentUser.id };
            await db.addRespelRecord(recordData);
        }
        fetchData();
        setIsFormOpen(false);
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este formato RESPEL?')) {
            await db.deleteRespelRecord(id);
            fetchData();
        }
    };
    
    const openDocument = (record: RespelRecord) => {
        const generatorUser = users.find(u => u.id === record.generator_user_id);
        setViewingRecord({ ...record, generatorUser });
        setIsDocumentOpen(true);
    };

    const openLabel = (record: RespelRecord) => {
        const generatorUser = users.find(u => u.id === record.generator_user_id);
        setViewingRecord({ ...record, generatorUser });
        setIsLabelModalOpen(true);
    };

    const handleExport = () => {
        const dataToExport = records.map(r => ({
            "Folio": r.folio,
            "Fecha de Creación": new Date(r.creation_date).toLocaleDateString(),
            "Nombre del Residuo": r.waste_name,
            "Descripción": r.waste_description,
            "Tipo": r.waste_type,
            "Cantidad": r.quantity,
            "Unidad": r.unit,
            "Área de Generación": r.area,
            "Proveedor de Disposición": r.disposal_provider,
            "Generado Por": users.find(u => u.id === r.generator_user_id)?.full_name || 'N/A',
            "Notas": r.notes,
            ...Object.fromEntries(CRETIB_PROPERTIES.map(p => [p.label, r[p.key] ? 'Sí' : 'No']))
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Formatos_RESPEL");
        XLSX.writeFile(wb, "reporte_respel.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Formatos de Residuos Peligrosos (RESPEL)</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_respel') && (
                        <button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                            + Crear Formato RESPEL
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residuo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                            {hasPermission('manage_respel') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                        ) : records.map(record => (
                            <tr key={record.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{record.folio}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(record.creation_date).toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.waste_name}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.quantity} {record.unit}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.disposal_provider}</td>
                                {hasPermission('manage_respel') && (
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => openDocument(record)} className="text-gray-600 hover:text-primary" title="Ver/Imprimir Documento"><ClipboardDocumentListIcon className="w-5 h-5" /></button>
                                        <button onClick={() => openLabel(record)} className="text-gray-600 hover:text-primary" title="Imprimir Etiqueta de Contenedor"><TagIcon className="w-5 h-5" /></button>
                                        <button onClick={() => { setEditingRecord(record); setIsFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {records.length === 0 && !loading && (
                            <tr><td colSpan={hasPermission('manage_respel') ? 6 : 5} className="text-center py-4 text-gray-500">No hay formatos RESPEL registrados.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>

            {hasPermission('manage_respel') && (
                <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRecord ? 'Editar Formato RESPEL' : 'Crear Formato RESPEL'}>
                    <RespelForm onSave={handleSave} onClose={() => setIsFormOpen(false)} initialData={editingRecord} />
                </Modal>
            )}

            <Modal isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} title={`Formato RESPEL - Folio ${viewingRecord?.folio || ''}`}>
                {viewingRecord && <RespelDocument record={viewingRecord} />}
            </Modal>

            <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title={`Etiqueta de Residuo Peligroso - Folio ${viewingRecord?.folio || ''}`}>
                {viewingRecord && <RespelLabel record={viewingRecord} />}
            </Modal>
        </div>
    );
};

export default Respel;