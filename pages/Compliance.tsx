
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComplianceRequirement } from '../types';
import { useAuth } from '../Auth';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, ArrowDownTrayIcon } from '../constants';
import * as db from '../services/db';
import * as XLSX from 'xlsx';

const ComplianceForm: React.FC<{
    onSave: (requirement: Omit<ComplianceRequirement, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: ComplianceRequirement | null;
}> = ({ onSave, onClose, initialData }) => {
    const [formState, setFormState] = useState({
        name: initialData?.name || '',
        type: initialData?.type || 'Legal' as 'Legal' | 'Norma' | 'Corporativo',
        description: initialData?.description || '',
        next_review_date: initialData?.next_review_date || new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Requisito</label>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        <option value="Legal">Legal</option>
                        <option value="Norma">Norma</option>
                        <option value="Corporativo">Corporativo</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Próxima Fecha de Revisión</label>
                <input type="date" name="next_review_date" value={formState.next_review_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar</button>
            </div>
        </form>
    );
};

const Compliance: React.FC = () => {
    const { complianceRequirements, activities, loading, refreshData } = useData();
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null);

    const handleSave = async (data: Omit<ComplianceRequirement, 'id'>, id: string | null) => {
        if (id) {
            await db.updateComplianceRequirement(id, data);
        } else {
            await db.addComplianceRequirement(data);
        }
        refreshData();
        setIsFormModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este requisito?')) {
            await db.deleteComplianceRequirement(id);
            refreshData();
        }
    };

    const handleOpenForm = (req: ComplianceRequirement | null) => {
        setEditingRequirement(req);
        setIsFormModalOpen(true);
    };

    const handleViewActivities = (requirementId: string) => {
        navigate(`/activities?complianceId=${requirementId}`);
    };
    
    const getStatus = (nextReviewDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reviewDate = new Date(nextReviewDate);
        reviewDate.setHours(0, 0, 0, 0);

        const diffTime = reviewDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: 'Vencido', className: 'bg-red-100 text-red-800' };
        if (diffDays <= 30) return { text: 'Próximo a Vencer', className: 'bg-yellow-100 text-yellow-800' };
        return { text: 'En Regla', className: 'bg-green-100 text-green-800' };
    };
    
    const countActivities = (requirementId: string) => {
        return activities.filter(a => a.source_compliance_id === requirementId).length;
    };
    
    const handleExport = () => {
        const dataToExport = complianceRequirements.map(req => ({
            "Nombre del Requisito": req.name,
            "Tipo": req.type,
            "Descripción": req.description,
            "Próxima Revisión": new Date(req.next_review_date).toLocaleDateString(),
            "Estado": getStatus(req.next_review_date).text,
            "Actividades Vinculadas": countActivities(req.id),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Requisitos_Cumplimiento");
        XLSX.writeFile(wb, "reporte_cumplimiento_legal.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Gestión de Cumplimiento Legal y Normativo</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_compliance') && (
                        <button onClick={() => handleOpenForm(null)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                            + Nuevo Requisito
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requisito</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próxima Revisión</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actividades</th>
                            {hasPermission('manage_compliance') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                        ) : complianceRequirements.map(req => {
                            const status = getStatus(req.next_review_date);
                            const activityCount = countActivities(req.id);
                            return (
                            <tr key={req.id}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-sm">
                                    <p className="font-semibold">{req.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{req.description}</p>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{req.type}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.next_review_date + 'T00:00:00').toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>{status.text}</span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                    <button onClick={() => handleViewActivities(req.id)} className="text-primary hover:underline">
                                        {activityCount}
                                    </button>
                                </td>
                                {hasPermission('manage_compliance') && (
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenForm(req)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(req.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                )}
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>

            {hasPermission('manage_compliance') && (
                <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingRequirement ? 'Editar Requisito' : 'Nuevo Requisito de Cumplimiento'}>
                    <ComplianceForm onSave={handleSave} onClose={() => setIsFormModalOpen(false)} initialData={editingRequirement} />
                </Modal>
            )}
        </div>
    );
};

export default Compliance;
