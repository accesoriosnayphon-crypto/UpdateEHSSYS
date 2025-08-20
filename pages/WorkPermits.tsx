import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkPermit, UserProfile, Jha, WorkPermitStatus, WORK_PERMIT_TYPES, Employee } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '../constants';
import WorkPermitDocument from '../components/WorkPermitDocument';
import * as db from '../services/db';

// Componente para listas dinámicas de ítems
const DynamicListInput: React.FC<{
    label: string;
    items: string[];
    setItems: (items: string[]) => void;
}> = ({ label, items, setItems }) => {
    const [currentItem, setCurrentItem] = useState('');

    const handleAddItem = () => {
        if (currentItem.trim() !== '') {
            setItems([...items, currentItem.trim()]);
            setCurrentItem('');
        }
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center mt-1">
                <input
                    type="text"
                    value={currentItem}
                    onChange={(e) => setCurrentItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Escriba un item y presione Enter o 'Agregar'"
                />
                <button type="button" onClick={handleAddItem} className="ml-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex-shrink-0">
                    Agregar
                </button>
            </div>
            <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto border rounded-md p-1">
                {items.length > 0 ? items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <span className="text-sm">{item}</span>
                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </li>
                )) : <li className="text-sm text-gray-400 p-2">No hay ítems agregados.</li>}
            </ul>
        </div>
    );
};

// Form to add/edit a work permit
const WorkPermitForm: React.FC<{
    onSave: (permit: Omit<WorkPermit, 'id' | 'folio'>, id: string | null) => void;
    onClose: () => void;
    initialData: WorkPermit | null;
    users: UserProfile[];
    jhas: Jha[];
    currentUser: UserProfile;
    employees: Employee[];
}> = ({ onSave, onClose, initialData, users, jhas, currentUser, employees }) => {
    const [formState, setFormState] = useState({
        title: initialData?.title || '',
        type: initialData?.type || 'Trabajo en Altura',
        status: initialData?.status || ('Solicitado' as WorkPermitStatus),
        request_date: initialData?.request_date || new Date().toISOString().split('T')[0],
        approver_user_id: initialData?.approver_user_id || null,
        closer_user_id: initialData?.closer_user_id || null,
        description: initialData?.description || '',
        location: initialData?.location || '',
        equipment: initialData?.equipment || [],
        ppe: initialData?.ppe || [],
        jha_id: initialData?.jha_id || '',
        valid_from: initialData?.valid_from || '',
        valid_to: initialData?.valid_to || '',
        close_date: initialData?.close_date || null,
        notes: initialData?.notes || '',
        work_type: initialData?.work_type || 'Interno',
        provider_name: initialData?.provider_name || '',
        provider_details: initialData?.provider_details || '',
    });

    const defaultEmployee = useMemo(() => {
        if (initialData) {
            return employees.find(e => e.id === initialData.requester_employee_id);
        }
        if (currentUser.employee_number) {
            return employees.find(e => e.employee_number === currentUser.employee_number);
        }
        return null;
    }, [initialData, currentUser, employees]);

    const [requesterEmployeeId, setRequesterEmployeeId] = useState<string | null>(initialData?.requester_employee_id || defaultEmployee?.id || null);
    const [requesterSearch, setRequesterSearch] = useState('');
    const [isSearchingRequester, setIsSearchingRequester] = useState(!requesterEmployeeId);

    const selectedRequester = employees.find(e => e.id === requesterEmployeeId);

    const filteredEmployees = requesterSearch
        ? employees.filter(e =>
            e.name?.toLowerCase().includes(requesterSearch.toLowerCase()) ||
            e.employee_number?.toLowerCase().includes(requesterSearch.toLowerCase())
        ).slice(0, 5)
        : [];

    const handleSelectRequester = (employee: Employee) => {
        setRequesterEmployeeId(employee.id);
        setRequesterSearch('');
        setIsSearchingRequester(false);
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requesterEmployeeId) {
            alert('Por favor, seleccione un empleado solicitante.');
            return;
        }
        const dataToSave: Omit<WorkPermit, 'id' | 'folio'> = {
            ...formState,
            requester_employee_id: requesterEmployeeId,
            jha_id: formState.jha_id || null,
            provider_name: formState.work_type === 'Interno' ? null : formState.provider_name,
            provider_details: formState.work_type === 'Interno' ? null : formState.provider_details,
        };
        onSave(dataToSave, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Permiso</label>
                <input id="title" name="title" type="text" value={formState.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Solicitado Por</label>
                {selectedRequester && !isSearchingRequester ? (
                     <div className="mt-1 p-3 border border-green-300 bg-green-50 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-dark-text">{selectedRequester.name}</p>
                                <p className="text-sm text-medium-text">Nº: {selectedRequester.employee_number}</p>
                            </div>
                            <button type="button" onClick={() => setIsSearchingRequester(true)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">Cambiar</button>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar empleado por nombre o número..."
                            value={requesterSearch}
                            onChange={e => setRequesterSearch(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            autoFocus
                        />
                         {requesterSearch && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(employee => (
                                        <li key={employee.id} onClick={() => handleSelectRequester(employee)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-dark-text">
                                            {employee.name} ({employee.employee_number})
                                        </li>
                                    ))
                                ) : (<li className="p-2 text-gray-500 text-sm">No se encontraron empleados.</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Permiso</label>
                    <select id="type" name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                        {WORK_PERMIT_TYPES.map(t => <option key={t} value={t} className="text-dark-text">{t}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación Específica</label>
                    <input id="location" name="location" type="text" value={formState.location} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Trabajo</label>
                <div className="mt-2 flex space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="work_type"
                            value="Interno"
                            checked={formState.work_type === 'Interno'}
                            onChange={handleChange}
                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Interno (Personal de la empresa)</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="work_type"
                            value="Externo"
                            checked={formState.work_type === 'Externo'}
                            onChange={handleChange}
                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Externo (Contratista)</span>
                    </label>
                </div>
            </div>

            {formState.work_type === 'Externo' && (
                <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md space-y-4">
                    <h4 className="font-semibold text-yellow-800">Información del Contratista</h4>
                    <div>
                        <label htmlFor="provider_name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa Contratista</label>
                        <input
                            id="provider_name"
                            name="provider_name"
                            type="text"
                            value={formState.provider_name || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="provider_details" className="block text-sm font-medium text-gray-700">Datos Generales (Contacto, # de personas, etc.)</label>
                        <textarea
                            id="provider_details"
                            name="provider_details"
                            value={formState.provider_details || ''}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">Válido Desde</label>
                    <input id="valid_from" name="valid_from" type="datetime-local" value={formState.valid_from || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                 <div>
                    <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700">Válido Hasta</label>
                    <input id="valid_to" name="valid_to" type="datetime-local" value={formState.valid_to || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción Detallada del Trabajo</label>
                <textarea id="description" name="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DynamicListInput
                    label="Equipo a Utilizar"
                    items={formState.equipment || []}
                    setItems={(newItems) => setFormState(prev => ({ ...prev, equipment: newItems }))}
                />
                <DynamicListInput
                    label="EPP Requerido"
                    items={formState.ppe || []}
                    setItems={(newItems) => setFormState(prev => ({ ...prev, ppe: newItems }))}
                />
            </div>
            <div>
                <label htmlFor="jha_id" className="block text-sm font-medium text-gray-700">JHA Vinculado (Opcional)</label>
                <select id="jha_id" name="jha_id" value={formState.jha_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    <option value="" className="text-gray-500">Ninguno</option>
                    {jhas.map(j => <option key={j.id} value={j.id} className="text-dark-text">{j.title} ({j.area})</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Permiso</button>
            </div>
        </form>
    );
};


const WorkPermits: React.FC = () => {
    const [permits, setPermits] = useState<WorkPermit[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [jhas, setJhas] = useState<Jha[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, hasPermission } = useAuth();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDocumentOpen, setIsDocumentOpen] = useState(false);
    const [editingPermit, setEditingPermit] = useState<WorkPermit | null>(null);
    const [viewingPermit, setViewingPermit] = useState<WorkPermit | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [permitsRes, usersRes, jhasRes, employeesRes] = await Promise.all([
            db.getWorkPermits(),
            db.getUsers(),
            db.getJhas(),
            db.getEmployees(),
        ]);
        setPermits(permitsRes);
        setUsers(usersRes);
        setJhas(jhasRes);
        setEmployees(employeesRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSavePermit = async (data: Omit<WorkPermit, 'id' | 'folio'>, id: string | null) => {
        if (id) {
            await db.updateWorkPermit(id, data);
        } else {
            await db.addWorkPermit({ ...data, folio: '' });
        }
        fetchData();
        setIsFormOpen(false);
        setEditingPermit(null);
    };

    const handleUpdateStatus = async (permit: WorkPermit, newStatus: WorkPermitStatus) => {
        const updates: Partial<WorkPermit> = { status: newStatus };
        if (newStatus === 'Aprobado') updates.approver_user_id = currentUser!.id;
        if (newStatus === 'Cerrado') {
            updates.closer_user_id = currentUser!.id;
            updates.close_date = new Date().toISOString().split('T')[0];
        }
        if (newStatus === 'Rechazado') updates.approver_user_id = currentUser!.id;

        await db.updateWorkPermit(permit.id, updates);
        fetchData();
    };

    const handleDeletePermit = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este permiso?')) {
            await db.deleteWorkPermit(id);
            fetchData();
        }
    };
    
    const getEmployeeName = (id: string | null) => employees.find(e => e.id === id)?.name || 'N/A';

    const getStatusClass = (status: WorkPermitStatus) => {
        switch(status) {
            case 'Aprobado': return 'bg-green-100 text-green-800';
            case 'En Progreso': return 'bg-blue-100 text-blue-800';
            case 'Cerrado': return 'bg-gray-200 text-gray-800';
            case 'Rechazado': return 'bg-red-100 text-red-800';
            case 'Solicitado': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100';
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Permisos de Trabajo de Alto Riesgo</h2>
                {hasPermission('manage_work_permits') && (
                    <button onClick={() => { setEditingPermit(null); setIsFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                        + Solicitar Permiso
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            {hasPermission('manage_work_permits') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                         {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                         ) : permits.map(permit => (
                            <tr key={permit.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{permit.folio}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.title}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{permit.type}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getEmployeeName(permit.requester_employee_id)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(permit.status)}`}>{permit.status}</span>
                                </td>
                                {hasPermission('manage_work_permits') && (
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onClick={() => { setViewingPermit(permit); setIsDocumentOpen(true); }} className="text-gray-600 hover:text-primary" title="Ver Documento"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                        {permit.status === 'Solicitado' && currentUser?.level === 'Administrador' &&
                                            <button onClick={() => handleUpdateStatus(permit, 'Aprobado')} className="text-green-600 hover:text-green-800" title="Aprobar"><CheckCircleIcon className="w-5 h-5"/></button>
                                        }
                                        {permit.status !== 'Cerrado' && permit.status !== 'Rechazado' &&
                                            <button onClick={() => { setEditingPermit(permit); setIsFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                        }
                                        <button onClick={() => handleDeletePermit(permit.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                         {permits.length === 0 && !loading && (
                            <tr><td colSpan={hasPermission('manage_work_permits') ? 6 : 5} className="text-center py-4 text-gray-500">No hay permisos registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {currentUser && hasPermission('manage_work_permits') && (
                <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingPermit ? 'Editar Permiso de Trabajo' : 'Solicitar Permiso de Trabajo'}>
                    <WorkPermitForm onSave={handleSavePermit} onClose={() => setIsFormOpen(false)} initialData={editingPermit} users={users} jhas={jhas} currentUser={currentUser} employees={employees} />
                </Modal>
            )}

            <Modal isOpen={isDocumentOpen} onClose={() => setIsDocumentOpen(false)} title={`Permiso de Trabajo - ${viewingPermit?.folio || ''}`}>
                {viewingPermit && <WorkPermitDocument permit={viewingPermit} users={users} jhas={jhas} employees={employees} />}
            </Modal>
        </div>
    );
};

export default WorkPermits;