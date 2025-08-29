import React, { useState, useEffect, useCallback } from 'react';
import { Chemical, PictogramKey } from '../types';
import { useAuth } from '../Auth';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon, EyeIcon } from '../constants';
import * as db from '../services/db';

const GHS_PICTOGRAMS: { key: PictogramKey; label: string; svg: JSX.Element; }[] = [
    { key: 'explosive', label: 'Explosivo', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><circle cx="50" cy="62" r="18" fill="black" /><path d="M48 44 L52 44 L52 35 L48 35 Z" fill="black" stroke="none" /><path d="M48,35 L40,30" /><path d="M30,45 L20,40" /><path d="M25,62 L15,62" /><path d="M30,78 L20,85" /><path d="M52,35 L60,30" /><path d="M70,45 L80,40" /><path d="M75,62 L85,62" /><path d="M70,78 L80,85" /></svg> },
    { key: 'flammable', label: 'Inflamable', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><path d="M30 90 L70 90" /><path d="M50,30 C 80 50, 85 70, 50 90 C 15 70, 20 50, 50 30 Z" fill="black" stroke="none" /></svg> },
    { key: 'oxidizing', label: 'Comburente', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><circle cx="50" cy="65" r="25" /><path d="M50,20 C 65 35, 70 45, 50 60 C 30 45, 35 35, 50 20 Z" fill="black" stroke="none" /></svg> },
    { key: 'compressed_gas', label: 'Gas Comprimido', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><path d="M38 25 L62 25 L62 30 L67 30 L67 40 L33 40 L33 30 L38 30 Z" fill="black" stroke="none" /><rect x="35" y="40" width="30" height="45" rx="5" fill="black" stroke="none" /></svg> },
    { key: 'corrosive', label: 'Corrosivo', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="3"><polygon points="50,2 98,50 50,98 2,50" strokeWidth="4" /><path d="M5 85 L45 85" strokeWidth="4" /><path d="M10 83 L15 75 L20 83" /><path d="M25 83 L30 75 L35 83" /><path d="M55 60 L60 50 L85 55 L90 70 L70 75 L65 65 Z" /><path d="M62 68 L70 58" /><path d="M72 70 L80 60" /><path d="M22,20 L27,20 L27,25 L32,25 L32,50 L17,50 Z" stroke="none" fill="black" /><path d="M37,55 L27,65" /><path d="M62,20 L67,20 L67,25 L72,25 L72,40 L57,40 Z" stroke="none" fill="black" /><path d="M77,45 L67,55" /></svg> },
    { key: 'toxic', label: 'Tóxico (Agudo)', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><circle cx="50" cy="40" r="15" fill="black" stroke="none"/><rect x="42" y="52" width="16" height="10" fill="black" stroke="none" /><circle cx="43" cy="40" r="4" fill="white" stroke="none"/><circle cx="57" cy="40" r="4" fill="white" stroke="none"/><path d="M35 65 L65 85 M65 65 L35 85" strokeWidth="6" /></svg> },
    { key: 'harmful', label: 'Nocivo / Irritante', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><rect x="44" y="20" width="12" height="45" rx="6" fill="black" stroke="none"/><circle cx="50" cy="80" r="7" fill="black" stroke="none"/></svg> },
    { key: 'health_hazard', label: 'Peligro para la Salud', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="4"><polygon points="50,2 98,50 50,98 2,50" /><path d="M50 20 C 40 20, 35 25, 35 35 C 35 45, 40 50, 40 60 L 35 90 L 65 90 L 60 60 C 60 50, 65 45, 65 35 C 65 25, 60 20, 50 20 Z" fill="black" stroke="none"/><path d="M50 45 L40 55 L50 65 L60 55 Z M50 55 L45 60 L50 65 L55 60 Z M50 55 L45 50 L50 45 L55 50Z" fill="white" stroke="none"/></svg> },
    { key: 'environmental_hazard', label: 'Peligro Ambiental', svg: <svg viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="3"><polygon points="50,2 98,50 50,98 2,50" strokeWidth="4" /><path d="M70 30 L60 40 L65 50 L50 65 L35 50 L40 40 L30 30 L35 20 L50 35 L65 20 Z" stroke="none" fill="black" /><path d="M50 65 L50 85" strokeWidth="4" /><path d="M30 75 C 40 70, 50 70, 60 75 L 55 85 L 35 85 Z" /><circle cx="35" cy="78" r="1" stroke="none" fill="white" /></svg> }
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
