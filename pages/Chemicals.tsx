import React, { useState, useEffect, useCallback } from 'react';
import { Chemical, PictogramKey } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, EyeIcon } from '../constants';
import * as db from '../services/db';

const GHS_PICTOGRAMS: { key: PictogramKey; label: string; svg: JSX.Element; }[] = [
    { key: 'explosive', label: 'Explosivo', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-35-25L-25-35L-15-20L-25-5L-35-15L-45-5L-30-20L-45-35L-35-25z M-5,15 L-20,20 L-10,35 L5,25 L-5,15z M-20-20C-5-5,5,5,20,20 L30,5 L5, -15 L-15,-5 L-30,10z M-15,10L-5,0L0,5L10,15L25,0L15-10L5-5L0,0z M20,20C10,25,0,35,-10,40" stroke="black" strokeWidth="5" fill="none" /></g></svg> },
    { key: 'flammable', label: 'Inflamable', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-10-35 C-25-30,-25,10,-5,10 C15,10,15-30,0-35 M-5,10 C-20,15,-10,40,-10,40 M0-35 C-5-50,20-50,15-35" stroke="black" strokeWidth="5" fill="none" /><line x1="-25" y1="40" x2="25" y2="40" stroke="black" strokeWidth="5" /></g></svg> },
    { key: 'oxidizing', label: 'Comburente', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><circle cx="0" cy="0" r="25" stroke="black" strokeWidth="5" fill="none"/><path d="M-10-25 L-20-15 L0-10 L20-15 L10-25 L0-20 Z M-15,30 L0,20 L15,30z M0,0 L0,-25 M-22,-10 L-22,10 L-10,22 L10,22 L22,10 L22,-10 L10,-22 L-10,-22 Z" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'compressed_gas', label: 'Gas Comprimido', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-15,40 L-15,25 L-25,25 L-25,-20 L-15,-20 L-15,-30 C-15,-40 15,-40 15,-30 L15,-20 L25,-20 L25,25 L15,25 L15,40z M-25,-20 L25,-20 M-15,-20 L-15,25 M15,-20 L15,25" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'corrosive', label: 'Corrosivo', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-40,0 L-20,0 L-20,-20 L-5,-20 M-30,5 L-25,15 L-15,10 L-10,20 L0,15 L5,25 L15,20 L20,30 L25,40 L-40,40z M20,-5 L25,-15 L35,-10 L40,-20 L40,-35 L10,-35z" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'toxic', label: 'Tóxico (Agudo)', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><circle cx="0" cy="15" r="15" stroke="black" strokeWidth="5" fill="none"/><path d="M-25,-15 L25,-15 L0,-40z M-15,-5 L-30,15 L-10,15z M15,-5 L30,15 L10,15z M-5,40 L-20,25 L20,25 L5,40z" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'harmful', label: 'Nocivo / Irritante', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-30,30 L30,-30 M-30,-30 L30,30" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'health_hazard', label: 'Peligro para la Salud', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M0-40 L0,40 M-20,-20 L20,0 L-20,20" stroke="black" strokeWidth="5" fill="none"/><path d="M-20-30 C-30-20,-30,20,-20,30 M20-30 C30-20,30,20,20,30" stroke="black" strokeWidth="5" fill="none"/></g></svg> },
    { key: 'environmental_hazard', label: 'Peligro Ambiental', svg: <svg viewBox="0 0 100 100"><g transform="translate(50,50) scale(0.9)"><path d="M-15,0 L15,0 L0,-25z M0,10 L-20,30 L-5,30 L0,20 L5,30 L20,30z M-40,10 L-25,0 L-30,-15 L-40,-5z" stroke="black" strokeWidth="5" fill="none"/></g></svg> }
];

const ChemicalForm: React.FC<{
    onSave: (chemical: Omit<Chemical, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: Chemical | null;
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [provider, setProvider] = useState(initialData?.provider || '');
    const [casNumber, setCasNumber] = useState(initialData?.cas_number || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [sdsUrl, setSdsUrl] = useState(initialData?.sds_url || '');
    const [pictograms, setPictograms] = useState<string[]>(initialData?.pictograms || []);
    const [fileName, setFileName] = useState<string | null>(initialData ? 'SDS existente' : null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSdsUrl(reader.result as string);
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePictogramChange = (key: PictogramKey) => {
        setPictograms(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !provider || !location || !sdsUrl) {
            alert('Por favor complete todos los campos, incluyendo la SDS.');
            return;
        }
        
        const dataToSave: Omit<Chemical, 'id'> = { name, provider, cas_number: casNumber || null, location, sds_url: sdsUrl, pictograms };

        onSave(dataToSave, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                    <input type="text" value={provider} onChange={e => setProvider(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nº CAS (Opcional)</label>
                    <input type="text" value={casNumber || ''} onChange={e => setCasNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación en Planta</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Hoja de Seguridad (SDS) - PDF</label>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100" required={!initialData} />
                {fileName && <p className="text-xs text-gray-500 mt-1">Archivo: {fileName}</p>}
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pictogramas de Peligro (GHS)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-4 border rounded-md">
                    {GHS_PICTOGRAMS.map(p => (
                        <label key={p.key} title={p.label} className={`flex flex-col items-center justify-center p-2 border-2 rounded-md cursor-pointer ${pictograms.includes(p.key) ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                            <input type="checkbox" checked={pictograms.includes(p.key)} onChange={() => handlePictogramChange(p.key)} className="sr-only" />
                            <div className="w-12 h-12">{p.svg}</div>
                            <span className="text-xs text-center mt-1">{p.label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Producto</button>
            </div>
        </form>
    );
};

const Chemicals: React.FC = () => {
    const [chemicals, setChemicals] = useState<Chemical[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChemical, setEditingChemical] = useState<Chemical | null>(null);
    const { hasPermission } = useAuth();
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await db.getChemicals();
        setChemicals(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (data: Omit<Chemical, 'id'>, id: string | null) => {
        if (id) {
            await db.updateChemical(id, data);
        } else {
            await db.addChemical(data);
        }
        fetchData();
        setIsModalOpen(false);
        setEditingChemical(null);
    };

    const handleOpenForm = (chemical: Chemical | null) => {
        setEditingChemical(chemical);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este producto químico?')) {
            await db.deleteChemical(id);
            fetchData();
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Inventario de Sustancias Químicas</h2>
                {hasPermission('manage_chemicals') && (
                    <button onClick={() => handleOpenForm(null)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                        + Agregar Producto
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peligros</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr>
                        ) : chemicals.map(chem => (
                            <tr key={chem.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chem.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chem.provider}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chem.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-1">
                                        {chem.pictograms.map(pkey => {
                                            const pictogram = GHS_PICTOGRAMS.find(p => p.key === pkey);
                                            return pictogram ? <div key={pkey} className="w-8 h-8" title={pictogram.label}>{pictogram.svg}</div> : null;
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                    <a href={chem.sds_url} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 hover:text-blue-900" title="Ver SDS">
                                        <EyeIcon className="w-5 h-5" />
                                    </a>
                                    {hasPermission('manage_chemicals') && (
                                        <>
                                            <button onClick={() => handleOpenForm(chem)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(chem.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {chemicals.length === 0 && !loading && (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hay productos químicos registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingChemical ? 'Editar Producto Químico' : 'Agregar Producto Químico'}>
                <ChemicalForm onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditingChemical(null); }} initialData={editingChemical} />
            </Modal>
        </div>
    );
};

export default Chemicals;