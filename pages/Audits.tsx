

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Audit, AuditFinding, UserProfile, AuditFindingType, AUDIT_FINDING_TYPES, AuditFindingSeverity, AUDIT_FINDING_SEVERITIES, AuditFindingStatus, Activity, AuditWithFindings } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, ClipboardDocumentListIcon, CheckCircleIcon } from '../constants';
import AuditReport from '../components/AuditReport';
import * as db from '../services/db';


const FindingForm: React.FC<{
    onSave: (finding: Omit<AuditFinding, 'id' | 'audit_id' | 'status'>, id: string | null) => void;
    onClose: () => void;
    initialData: AuditFinding | null;
}> = ({ onSave, onClose, initialData }) => {
    const [formState, setFormState] = useState({
        description: initialData?.description || '',
        type: initialData?.type || 'No Conformidad' as AuditFindingType,
        severity: initialData?.severity || 'Menor' as AuditFindingSeverity,
        reference: initialData?.reference || '',
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(p => ({...p, [name]: value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formState };
        onSave(dataToSave, initialData ? initialData.id : null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción del Hallazgo</label>
                <textarea id="description" name="description" value={formState.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Hallazgo</label>
                    <select id="type" name="type" value={formState.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                        {AUDIT_FINDING_TYPES.map(t => <option key={t} value={t} className="text-dark-text">{t}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="severity" className="block text-sm font-medium text-gray-700">Severidad</label>
                    <select id="severity" name="severity" value={formState.severity} onChange={handleChange} disabled={formState.type !== 'No Conformidad'} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text disabled:bg-gray-100">
                        {AUDIT_FINDING_SEVERITIES.map(s => <option key={s} value={s} className="text-dark-text">{s}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Referencia a la Norma/Procedimiento</label>
                <input id="reference" name="reference" type="text" value={formState.reference} onChange={handleChange} placeholder="Ej: ISO 9001:2015 Cláusula 8.5.1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Hallazgo</button>
            </div>
        </form>
    );
};

const AuditForm: React.FC<{
    onSave: (audit: Omit<Audit, 'id' | 'folio' | 'findings'>, id: string | null) => void;
    onClose: () => void;
    initialData: Audit | null;
    users: UserProfile[];
}> = ({ onSave, onClose, initialData, users }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [standard, setStandard] = useState(initialData?.standard || '');
    const [scope, setScope] = useState(initialData?.scope || '');
    const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(initialData?.end_date || new Date().toISOString().split('T')[0]);
    const [leadAuditorId, setLeadAuditorId] = useState(initialData?.lead_auditor_id || '');
    const [auditorIds, setAuditorIds] = useState<string[]>(initialData?.auditor_ids || []);

    const handleAuditorChange = (auditorId: string) => {
        setAuditorIds(prev => prev.includes(auditorId) ? prev.filter(id => id !== auditorId) : [...prev, auditorId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, standard, scope, start_date: startDate, end_date: endDate, lead_auditor_id: leadAuditorId, auditor_ids: auditorIds }, initialData?.id || null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Título de la Auditoría</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Norma de Referencia</label>
                    <input type="text" value={standard} onChange={e => setStandard(e.target.value)} placeholder="Ej: ISO 9001:2015" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Alcance</label>
                <textarea value={scope} onChange={e => setScope(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Auditor Líder</label>
                <select value={leadAuditorId} onChange={e => setLeadAuditorId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                    <option value="">Seleccione un líder</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Equipo Auditor</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 border p-2 rounded-md">
                     {users.map(u => (
                        <label key={u.id} className="flex items-center space-x-2">
                            <input type="checkbox" checked={auditorIds.includes(u.id)} onChange={() => handleAuditorChange(u.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                            <span className="text-sm text-gray-700">{u.full_name}</span>
                        </label>
                     ))}
                 </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Auditoría</button>
            </div>
        </form>
    );
};


const Audits: React.FC = () => {
    const [audits, setAudits] = useState<AuditWithFindings[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [isAuditFormOpen, setIsAuditFormOpen] = useState(false);
    const [isFindingFormOpen, setIsFindingFormOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    
    const [editingAudit, setEditingAudit] = useState<AuditWithFindings | null>(null);
    const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);

    const view = searchParams.get('view');
    const currentAuditId = searchParams.get('auditId');
    const currentAudit = useMemo(() => audits.find(a => a.id === currentAuditId), [audits, currentAuditId]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [auditsRes, usersRes, activitiesRes] = await Promise.all([
            db.getAudits(),
            db.getUsers(),
            db.getActivities(),
        ]);

        setAudits(auditsRes);
        setUsers(usersRes);
        setActivities(activitiesRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveAudit = async (data: Omit<Audit, 'id' | 'folio' | 'findings'>, id: string | null) => {
        if (id) {
            await db.updateAudit(id, data);
        } else {
            await db.addAudit(data);
        }
        fetchData();
        setIsAuditFormOpen(false);
    };

    const handleDeleteAudit = async (id: string) => {
        if (window.confirm('¿Seguro que quiere eliminar esta auditoría y todos sus hallazgos?')) {
            await db.deleteAudit(id);
            fetchData();
        }
    };

    const handleSaveFinding = async (data: Omit<AuditFinding, 'id' | 'audit_id' | 'status'>, id: string | null) => {
        if (!currentAudit) return;
        let newFindings: AuditFinding[];
        if (id) {
            newFindings = currentAudit.findings.map(f => f.id === id ? { ...f, ...data, audit_id: currentAudit.id, status: f.status } : f);
        } else {
            const newFinding: AuditFinding = {
                ...data,
                id: `FND-${Date.now()}`,
                audit_id: currentAudit.id,
                status: 'Abierta',
            };
            newFindings = [...currentAudit.findings, newFinding];
        }
        await db.updateAudit(currentAudit.id, { findings: newFindings });
        fetchData();
        setIsFindingFormOpen(false);
    };
    
    const hasActivity = (findingId: string) => activities.some(a => a.source_finding_id === findingId);

    const getFindingTypeClass = (type: AuditFindingType) => {
         switch (type) {
            case 'No Conformidad': return 'bg-red-100 text-red-800';
            case 'Observación': return 'bg-yellow-100 text-yellow-800';
            case 'Oportunidad de Mejora': return 'bg-blue-100 text-blue-800';
        }
    }

    const ListView = () => (
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Norma</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hallazgos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                    ) : audits.map(audit => (
                        <tr key={audit.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{audit.folio}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{audit.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{audit.standard}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(audit.start_date).toLocaleDateString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{audit.findings.length}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => setSearchParams({ view: 'findings', auditId: audit.id })} className="text-gray-600 hover:text-primary" title="Ver Hallazgos"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                <button onClick={() => { setEditingAudit(audit); setIsReportOpen(true); }} className="text-gray-600 hover:text-primary" title="Ver Reporte"><ClipboardDocumentListIcon className="w-5 h-5"/></button>
                                {hasPermission('manage_audits') && <>
                                    <button onClick={() => { setEditingAudit(audit); setIsAuditFormOpen(true);}} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteAudit(audit.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                </>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const FindingsView = () => {
        if (!currentAudit) return <p>Auditoría no encontrada. <button onClick={() => setSearchParams({})} className="text-primary">Volver a la lista</button></p>;
        const findings = currentAudit.findings;
        return (
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-dark-text">{currentAudit.title} - Hallazgos</h3>
                         <p className="text-sm text-medium-text">Folio: {currentAudit.folio}</p>
                    </div>
                    {hasPermission('manage_audits') && (
                        <button onClick={() => { setEditingFinding(null); setIsFindingFormOpen(true); }} className="px-4 py-2 bg-secondary text-dark-text font-semibold rounded-md hover:bg-yellow-500">
                            + Agregar Hallazgo
                        </button>
                    )}
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                {hasPermission('manage_audits') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {findings.map(finding => (
                                <tr key={finding.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFindingTypeClass(finding.type)}`}>{finding.type}</span></td>
                                    <td className="px-4 py-4 text-sm text-gray-900 max-w-md">{finding.description}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{finding.reference}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{finding.status}</td>
                                    {hasPermission('manage_audits') && (
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {!hasActivity(finding.id) && <button className="text-green-600 hover:text-green-800" title="Generar Actividad/CAPA"><CheckCircleIcon className="w-5 h-5"/></button>}
                                            <button onClick={() => { setEditingFinding(finding); setIsFindingFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                            <button className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Gestión de Auditorías</h2>
                <div>
                {view && <button onClick={() => setSearchParams({})} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300">
                    &larr; Volver a la Lista
                </button>}
                {view !== 'findings' && hasPermission('manage_audits') && <button onClick={() => { setEditingAudit(null); setIsAuditFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark ml-4">
                    + Nueva Auditoría
                </button>}
                </div>
            </div>
            
            {view === 'findings' ? <FindingsView /> : <ListView />}

            {hasPermission('manage_audits') && <>
                <Modal isOpen={isAuditFormOpen} onClose={() => setIsAuditFormOpen(false)} title={editingAudit ? "Editar Auditoría" : "Nueva Auditoría"}>
                    <AuditForm onSave={handleSaveAudit} onClose={() => setIsAuditFormOpen(false)} initialData={editingAudit} users={users} />
                </Modal>
                <Modal isOpen={isFindingFormOpen} onClose={() => setIsFindingFormOpen(false)} title={editingFinding ? "Editar Hallazgo" : "Nuevo Hallazgo"}>
                    <FindingForm onSave={handleSaveFinding} onClose={() => setIsFindingFormOpen(false)} initialData={editingFinding} />
                </Modal>
            </>}
             <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title={`Reporte de Auditoría - ${editingAudit?.folio || ''}`}>
                {editingAudit && <AuditReport audit={editingAudit} users={users} />}
            </Modal>
        </div>
    );
};

export default Audits;