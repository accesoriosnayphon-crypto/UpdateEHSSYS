import React, { useState, useMemo } from 'react';
import { Contractor, ContractorDocument, ContractorEmployee } from '../types';
import { useAuth } from '../Auth';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, EyeIcon } from '../constants';
import * as db from '../services/db';

const ContractorForm: React.FC<{
    onSave: (data: Omit<Contractor, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: Contractor | null;
}> = ({ onSave, onClose, initialData }) => {
    const [formState, setFormState] = useState({
        name: initialData?.name || '',
        rfc: initialData?.rfc || '',
        contact_person: initialData?.contact_person || '',
        contact_phone: initialData?.contact_phone || '',
        status: initialData?.status || 'Activo' as 'Activo' | 'Inactivo' | 'Vetado',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState, initialData?.id || null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                    <input type="text" name="name" value={formState.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">RFC</label>
                    <input type="text" name="rfc" value={formState.rfc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Persona de Contacto</label>
                    <input type="text" name="contact_person" value={formState.contact_person} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono de Contacto</label>
                    <input type="text" name="contact_phone" value={formState.contact_phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700">Estado</label>
                 <select name="status" value={formState.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Vetado">Vetado</option>
                 </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar</button>
            </div>
        </form>
    );
};

const DocumentForm: React.FC<{
    onSave: (data: Omit<ContractorDocument, 'id' | 'contractor_id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [documentName, setDocumentName] = useState('');
    const [documentUrl, setDocumentUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocumentUrl(reader.result as string);
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentName || !documentUrl || !expiryDate) {
            alert('Todos los campos son requeridos.');
            return;
        }
        onSave({ document_name: documentName, document_url: documentUrl, expiry_date: expiryDate });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                <input type="text" value={documentName} onChange={e => setDocumentName(e.target.value)} placeholder="Ej: Póliza de Seguro, Alta IMSS" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Archivo</label>
                <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-primary hover:file:bg-blue-100" required />
                {fileName && <p className="text-xs text-gray-500 mt-1">Archivo: {fileName}</p>}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Documento</button>
            </div>
        </form>
    );
};

const EmployeeForm: React.FC<{
    onSave: (data: Omit<ContractorEmployee, 'id' | 'contractor_id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [nss, setNss] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, nss });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo del Empleado</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">NSS (Número de Seguridad Social)</label>
                <input type="text" value={nss} onChange={e => setNss(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Empleado</button>
            </div>
        </form>
    );
};


const Contractors: React.FC = () => {
    const { contractors, contractorDocuments, contractorEmployees, loading, refreshData } = useData();
    const { hasPermission } = useAuth();

    const [view, setView] = useState<'list' | 'details'>('list');
    const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
    const [selectedTab, setSelectedTab] = useState<'docs' | 'employees'>('docs');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDocFormOpen, setIsDocFormOpen] = useState(false);
    const [isEmpFormOpen, setIsEmpFormOpen] = useState(false);
    const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

    const handleSaveContractor = async (data: Omit<Contractor, 'id'>, id: string | null) => {
        if (id) {
            await db.updateContractor(id, data);
        } else {
            await db.addContractor(data);
        }
        refreshData();
        setIsFormOpen(false);
    };

    const handleDeleteContractor = async (id: string) => {
        if (window.confirm('¿Seguro? Se eliminará el contratista y todos sus documentos y empleados.')) {
            await db.deleteContractor(id);
            refreshData();
        }
    };
    
    const handleSaveDocument = async (data: Omit<ContractorDocument, 'id' | 'contractor_id'>) => {
        if (!selectedContractor) return;
        await db.addContractorDocument({ ...data, contractor_id: selectedContractor.id });
        refreshData();
        setIsDocFormOpen(false);
    };

    const handleDeleteDocument = async (id: string) => {
        if (window.confirm('¿Seguro que quiere eliminar este documento?')) {
            await db.deleteContractorDocument(id);
            refreshData();
        }
    };
    
    const handleSaveEmployee = async (data: Omit<ContractorEmployee, 'id' | 'contractor_id'>) => {
        if (!selectedContractor) return;
        await db.addContractorEmployee({ ...data, contractor_id: selectedContractor.id });
        refreshData();
        setIsEmpFormOpen(false);
    };
    
    const handleDeleteEmployee = async (id: string) => {
        if (window.confirm('¿Seguro que quiere eliminar este empleado?')) {
            await db.deleteContractorEmployee(id);
            refreshData();
        }
    };

    const getStatus = (contractor: Contractor) => {
        if (contractor.status !== 'Activo') {
            return { text: contractor.status, className: 'bg-gray-200 text-gray-800' };
        }
        const today = new Date().toISOString().split('T')[0];
        const hasExpiredDoc = contractorDocuments.some(d => d.contractor_id === contractor.id && d.expiry_date < today);
        if (hasExpiredDoc) {
            return { text: 'Documentación Vencida', className: 'bg-red-100 text-red-800' };
        }
        return { text: 'Activo', className: 'bg-green-100 text-green-800' };
    };

    const renderListView = () => (
        <>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark-text">Catálogo de Contratistas</h2>
            {hasPermission('manage_contractors') && (
                <button onClick={() => { setEditingContractor(null); setIsFormOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    + Nuevo Contratista
                </button>
            )}
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado General</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={4} className="text-center py-4">Cargando...</td></tr>
                    ) : contractors.map(c => {
                        const status = getStatus(c);
                        return (
                        <tr key={c.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{c.contact_person}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>{status.text}</span></td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button onClick={() => { setSelectedContractor(c); setView('details'); }} className="text-gray-600 hover:text-primary" title="Ver Detalles"><EyeIcon className="w-5 h-5"/></button>
                                {hasPermission('manage_contractors') && <>
                                    <button onClick={() => { setEditingContractor(c); setIsFormOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteContractor(c.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>
                                </>}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
        </>
    );
    
    const renderDetailsView = () => {
        if (!selectedContractor) return null;
        const documents = contractorDocuments.filter(d => d.contractor_id === selectedContractor.id);
        const employees = contractorEmployees.filter(e => e.contractor_id === selectedContractor.id);

        return (
            <div>
                 <div className="flex justify-between items-start mb-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">{selectedContractor.name}</h2>
                        <p className="text-medium-text"><strong>Contacto:</strong> {selectedContractor.contact_person} ({selectedContractor.contact_phone})</p>
                    </div>
                    <button onClick={() => setView('list')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold">
                        &larr; Volver a la Lista
                    </button>
                </div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setSelectedTab('docs')} className={`py-3 px-1 border-b-2 font-medium text-sm ${selectedTab === 'docs' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
                            Documentos ({documents.length})
                        </button>
                        <button onClick={() => setSelectedTab('employees')} className={`py-3 px-1 border-b-2 font-medium text-sm ${selectedTab === 'employees' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
                            Personal ({employees.length})
                        </button>
                    </nav>
                </div>
                <div className="mt-6">
                    {selectedTab === 'docs' && (
                        <div>
                             <div className="flex justify-end mb-4">
                                <button onClick={() => setIsDocFormOpen(true)} className="px-4 py-2 bg-secondary text-dark-text font-semibold rounded-md hover:bg-yellow-500">
                                    + Subir Documento
                                </button>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map(d => (
                                        <tr key={d.id}>
                                            <td className="px-4 py-2 text-sm">{d.document_name}</td>
                                            <td className="px-4 py-2 text-sm">{new Date(d.expiry_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 text-sm space-x-2">
                                                <a href={d.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver</a>
                                                <button onClick={() => handleDeleteDocument(d.id)} className="text-red-600 hover:underline">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {selectedTab === 'employees' && (
                        <div>
                             <div className="flex justify-end mb-4">
                                <button onClick={() => setIsEmpFormOpen(true)} className="px-4 py-2 bg-secondary text-dark-text font-semibold rounded-md hover:bg-yellow-500">
                                    + Agregar Personal
                                </button>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NSS</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(e => (
                                         <tr key={e.id}>
                                            <td className="px-4 py-2 text-sm">{e.name}</td>
                                            <td className="px-4 py-2 text-sm">{e.nss}</td>
                                            <td className="px-4 py-2 text-sm">
                                                <button onClick={() => handleDeleteEmployee(e.id)} className="text-red-600 hover:underline">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            {view === 'list' ? renderListView() : renderDetailsView()}
            
            {hasPermission('manage_contractors') && (
                <>
                <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingContractor ? 'Editar Contratista' : 'Nuevo Contratista'}>
                    <ContractorForm onSave={handleSaveContractor} onClose={() => setIsFormOpen(false)} initialData={editingContractor} />
                </Modal>
                <Modal isOpen={isDocFormOpen} onClose={() => setIsDocFormOpen(false)} title="Subir Documento">
                    <DocumentForm onSave={handleSaveDocument} onClose={() => setIsDocFormOpen(false)} />
                </Modal>
                <Modal isOpen={isEmpFormOpen} onClose={() => setIsEmpFormOpen(false)} title="Agregar Personal de Contratista">
                    <EmployeeForm onSave={handleSaveEmployee} onClose={() => setIsEmpFormOpen(false)} />
                </Modal>
                </>
            )}
        </div>
    );
};

export default Contractors;