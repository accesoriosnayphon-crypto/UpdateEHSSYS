

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ActivityPriority, ActivityStatus, ActivityType, UserProfile, Comment, ActivityWithComments } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, DocumentCheckIcon, ChatBubbleBottomCenterTextIcon, ArrowDownTrayIcon } from '../constants';
import * as db from '../services/db';
import { useData } from '../contexts/DataContext';
import * as XLSX from 'xlsx';

// Form to add/edit an activity
const ActivityForm: React.FC<{
    onSave: (activity: Omit<Activity, 'id' | 'status' | 'progress' | 'comments'>, id: string | null) => void;
    onClose: () => void;
    initialData: ActivityWithComments | null;
    users: UserProfile[];
    complianceId?: string | null;
}> = ({ onSave, onClose, initialData, users, complianceId }) => {
    const [formState, setFormState] = useState({
        registration_date: initialData?.registration_date || new Date().toISOString().split('T')[0],
        commitment_date: initialData?.commitment_date || '',
        description: initialData?.description || '',
        type: initialData?.type || 'Interna' as ActivityType,
        provider: initialData?.provider || '',
        estimated_cost: initialData?.estimated_cost || 0,
        priority: initialData?.priority || 'Media' as ActivityPriority,
        responsible_user_id: initialData?.responsible_user_id || '',
        source_audit_id: initialData?.source_audit_id,
        source_finding_id: initialData?.source_finding_id,
        source_compliance_id: initialData?.source_compliance_id || complianceId,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.description || !formState.commitment_date || !formState.responsible_user_id) {
            alert('Por favor, complete los campos de descripción, fecha compromiso y responsable.');
            return;
        }
        
        const dataToSave = {
            ...formState,
            estimated_cost: Number(formState.estimated_cost),
        };
        
        onSave(dataToSave, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción de la Actividad</label>
                <textarea id="description" name="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="registration_date" className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                    <input type="date" id="registration_date" name="registration_date" value={formState.registration_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label htmlFor="commitment_date" className="block text-sm font-medium text-gray-700">Fecha Compromiso</label>
                    <input type="date" id="commitment_date" name="commitment_date" value={formState.commitment_date} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select id="type" name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        <option value="Interna" className="text-dark-text">Interna</option>
                        <option value="Externa" className="text-dark-text">Externa</option>
                    </select>
                </div>
                 {formState.type === 'Externa' && (
                    <div>
                        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Proveedor / Persona Externa</label>
                        <input type="text" id="provider" name="provider" value={formState.provider || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridad</label>
                    <select id="priority" name="priority" value={formState.priority} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        <option value="Baja" className="text-dark-text">Baja</option>
                        <option value="Media" className="text-dark-text">Media</option>
                        <option value="Alta" className="text-dark-text">Alta</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700">Costo Estimado (USD)</label>
                    <input type="number" id="estimated_cost" name="estimated_cost" value={formState.estimated_cost} onChange={handleChange} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div>
                 <label htmlFor="responsible_user_id" className="block text-sm font-medium text-gray-700">Responsable</label>
                 <select id="responsible_user_id" name="responsible_user_id" value={formState.responsible_user_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                    <option value="" className="text-gray-500">Seleccione un responsable</option>
                    {users.map(user => <option key={user.id} value={user.id} className="text-dark-text">{user.full_name}</option>)}
                 </select>
            </div>
             <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Actividad</button>
            </div>
        </form>
    );
}

// Modal for updating progress and adding comments
const ActivityDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    activity: ActivityWithComments | null;
    onUpdate: (activityId: string, updates: Partial<ActivityWithComments>) => void;
    users: UserProfile[];
    currentUser: UserProfile;
}> = ({ isOpen, onClose, activity, onUpdate, users, currentUser }) => {
    const [progress, setProgress] = useState(activity?.progress || 0);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (activity) {
            setProgress(activity.progress);
        }
    }, [activity]);

    const currentActivity = activity; // use a stable reference

    if (!currentActivity) return null;

    const handleProgressChange = (newProgress: number) => {
        setProgress(newProgress);
        let newStatus: ActivityStatus = 'Pendiente';
        if (newProgress === 100) newStatus = 'Completada';
        else if (newProgress > 0) newStatus = 'En Progreso';
        onUpdate(currentActivity.id, { progress: newProgress, status: newStatus });
    };

    const handleAddComment = () => {
        if (commentText.trim()) {
            const newComment: Comment = {
                id: `comment-${Date.now()}`,
                user_id: currentUser.id,
                date: new Date().toISOString(),
                text: commentText.trim(),
            };
            const updatedComments = [...(currentActivity.comments || []), newComment];
            onUpdate(currentActivity.id, { comments: updatedComments });
            setCommentText('');
        }
    };
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.full_name || 'Usuario Desconocido';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seguimiento de Actividad">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-dark-text">{currentActivity.description}</h3>
                    <p className="text-sm text-medium-text">Responsable: {getUserName(currentActivity.responsible_user_id)}</p>
                    <p className="text-sm text-medium-text">Fecha Compromiso: {new Date(currentActivity.commitment_date + 'T00:00:00').toLocaleDateString()}</p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="progress-slider" className="block text-sm font-medium text-gray-700">Progreso: {progress}%</label>
                    <input
                        id="progress-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        onMouseUp={(e) => handleProgressChange(Number(e.currentTarget.value))}
                        onTouchEnd={(e) => handleProgressChange(Number(e.currentTarget.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={currentActivity.status === 'Completada'}
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="text-md font-semibold text-dark-text border-b pb-2">Comentarios</h4>
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                        {currentActivity.comments?.map(comment => (
                            <div key={comment.id} className="p-3 bg-gray-100 rounded-lg">
                                <div className="flex justify-between items-center text-xs text-medium-text mb-1">
                                    <span className="font-bold">{getUserName(comment.user_id)}</span>
                                    <span>{new Date(comment.date).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-dark-text">{comment.text}</p>
                            </div>
                        ))}
                         {(!currentActivity.comments || currentActivity.comments.length === 0) && <p className="text-sm text-gray-500">No hay comentarios aún.</p>}
                    </div>
                     {currentActivity.status !== 'Completada' && (
                        <div className="flex items-start space-x-3">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Añadir un comentario..."
                                rows={2}
                                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                            <button onClick={handleAddComment} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Enviar</button>
                        </div>
                     )}
                </div>
            </div>
        </Modal>
    )
}

// Main component for Activities page
const Activities: React.FC = () => {
    const { activities, users, complianceRequirements, loading, refreshData } = useData();
    const { currentUser, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const complianceId = searchParams.get('complianceId');

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityWithComments | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<ActivityWithComments | null>(null);
    const [filters, setFilters] = useState({ startDate: '', endDate: '' });

    const complianceRequirementName = useMemo(() => {
        if (!complianceId) return null;
        return complianceRequirements.find(c => c.id === complianceId)?.name || 'Requisito Desconocido';
    }, [complianceId, complianceRequirements]);

    const filteredActivities = useMemo(() => {
        let filtered = activities;

        if (complianceId) {
            filtered = filtered.filter(activity => activity.source_compliance_id === complianceId);
        }

        if (filters.startDate || filters.endDate) {
            filtered = filtered.filter(activity => {
                const commitmentDate = new Date(activity.commitment_date + 'T00:00:00');
                const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
                const endDate = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;

                if (startDate && commitmentDate < startDate) return false;
                if (endDate && commitmentDate > endDate) return false;
                return true;
            });
        }
        
        return filtered.sort((a,b) => new Date(a.commitment_date).getTime() - new Date(b.commitment_date).getTime());
    }, [activities, filters, complianceId]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (data: Omit<Activity, 'id' | 'status' | 'progress' | 'comments'>, id: string | null) => {
        if (id) {
            const originalActivity = activities.find(a => a.id === id);
            if (originalActivity) {
                await db.updateActivity(id, { ...originalActivity, ...data });
            }
        } else {
            await db.addActivity(data);
        }
        refreshData();
        setIsFormModalOpen(false);
    };

    const handleUpdate = async (activityId: string, updates: Partial<ActivityWithComments>) => {
        await db.updateActivity(activityId, updates);
        refreshData(); // This will refetch and update the local state
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta actividad?')) {
            await db.deleteActivity(id);
            refreshData();
        }
    };

    const handleOpenForm = (activity: ActivityWithComments | null) => {
        setEditingActivity(activity);
        setIsFormModalOpen(true);
    };

    const handleOpenDetails = (activity: ActivityWithComments) => {
        setSelectedActivity(activity);
        setIsDetailsModalOpen(true);
    };
    
    const getUserName = (id: string) => users.find(u => u.id === id)?.full_name || 'N/A';

    const getPriorityClass = (priority: ActivityPriority) => {
        switch (priority) {
            case 'Alta': return 'text-red-600 font-semibold';
            case 'Media': return 'text-yellow-600 font-semibold';
            case 'Baja': return 'text-green-600 font-semibold';
            default: return 'text-gray-600';
        }
    };

    const handleExport = () => {
        const dataToExport = filteredActivities.map(act => ({
            "Descripción": act.description,
            "Responsable": getUserName(act.responsible_user_id),
            "Fecha de Registro": new Date(act.registration_date).toLocaleDateString(),
            "Fecha Compromiso": new Date(act.commitment_date).toLocaleDateString(),
            "Prioridad": act.priority,
            "Estado": act.status,
            "Progreso (%)": act.progress,
            "Tipo": act.type,
            "Proveedor": act.provider,
            "Costo Estimado": act.estimated_cost,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Actividades");
        XLSX.writeFile(wb, "plan_de_actividades.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-dark-text">Plan de Actividades</h2>
                <div className="flex items-center space-x-2">
                        {!complianceId && (
                            <>
                                <div className="flex items-center space-x-2">
                                <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Desde:</label>
                                <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="px-3 py-1 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="endDate" className="text-sm font-medium text-gray-700">Hasta:</label>
                                <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="px-3 py-1 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            </>
                        )}
                     <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 flex-shrink-0">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_activities') && (
                        <button onClick={() => handleOpenForm(null)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex-shrink-0">
                            + Nueva Actividad
                        </button>
                    )}
                </div>
            </div>

            {complianceId && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                        Mostrando actividades para el requisito de cumplimiento: <strong className="font-semibold">{complianceRequirementName}</strong>.
                        <button onClick={() => navigate('/activities')} className="ml-4 text-blue-600 font-bold hover:underline">
                            Ver todas
                        </button>
                    </p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Compromiso</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                            {hasPermission('manage_activities') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                        ) : filteredActivities.map(activity => (
                            <tr key={activity.id}>
                                <td className="px-4 py-4 text-sm text-gray-900 max-w-sm"><p className="truncate" title={activity.description}>{activity.description}</p></td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getUserName(activity.responsible_user_id)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(activity.commitment_date + 'T00:00:00').toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm"><span className={getPriorityClass(activity.priority)}>{activity.priority}</span></td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${activity.progress}%` }}></div>
                                        </div>
                                        <span>{activity.progress}%</span>
                                    </div>
                                </td>
                                {hasPermission('manage_activities') && (
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenDetails(activity)} className="text-gray-600 hover:text-primary" title="Ver Detalles y Comentarios"><ChatBubbleBottomCenterTextIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleOpenForm(activity)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(activity.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {filteredActivities.length === 0 && !loading && (
                            <tr><td colSpan={6} className="text-center py-4 text-gray-500">No hay actividades que coincidan con los filtros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
                {currentUser && hasPermission('manage_activities') && (
                <>
                    <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}>
                        <ActivityForm 
                            onSave={handleSave} 
                            onClose={() => setIsFormModalOpen(false)} 
                            initialData={editingActivity} 
                            users={users} 
                            complianceId={complianceId}
                        />
                    </Modal>
                        <ActivityDetailsModal
                        isOpen={isDetailsModalOpen}
                        onClose={() => setIsDetailsModalOpen(false)}
                        activity={selectedActivity}
                        onUpdate={handleUpdate}
                        users={users}
                        currentUser={currentUser}
                    />
                </>
                )}
        </div>
    );
};

export default Activities;