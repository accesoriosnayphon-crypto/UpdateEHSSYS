import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { PpeItem, Employee, PpeAsset, PpeAssetLog, PpeAssetStatus, PpeAssetEventType } from '../types';
import Modal from '../components/Modal';
import { EyeIcon, PencilIcon, TrashIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';

const PpeItemForm: React.FC<{ 
    onSave: (item: Omit<PpeItem, 'id'>, id: string | null) => void, 
    onClose: () => void,
    initialData: PpeItem | null
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState(initialData?.type || '');
    const [size, setSize] = useState(initialData?.size || '');
    const [stock, setStock] = useState(initialData?.stock || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, stock, type, size }, initialData?.id || null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del EPP</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Guantes de seguridad" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo / Material</label>
                <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="Ej: Nitrilo, N95, Carnaza" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Talla</label>
                <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="Ej: S, M, L, Unitalla" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{initialData ? 'Stock Actual' : 'Stock Inicial'} (para consumibles)</label>
                <input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar</button>
            </div>
        </form>
    );
};


const StockAdjustmentForm: React.FC<{
    details: { itemName: string, currentStock: number, adjustmentType: 'in' | 'out' };
    onSave: (quantity: number) => void;
    onClose: () => void;
}> = ({ details, onSave, onClose }) => {
    const [quantity, setQuantity] = useState<number>(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity <= 0) {
            alert("La cantidad debe ser un número positivo.");
            return;
        }
        onSave(quantity);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <p className="text-gray-700">Ajustando stock para: <span className="font-bold">{details.itemName}</span></p>
                <p className="text-sm text-gray-500">Stock actual: {details.currentStock}</p>
            </div>
            <div>
                <label htmlFor="adjustment-quantity" className="block text-sm font-medium text-gray-700">
                    Cantidad a {details.adjustmentType === 'in' ? 'Ingresar' : 'Retirar'}
                </label>
                <input
                    id="adjustment-quantity"
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    min="1"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    required
                    autoFocus
                />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Confirmar {details.adjustmentType === 'in' ? 'Ingreso' : 'Salida'}
                </button>
            </div>
        </form>
    );
};

const PpeAssetForm: React.FC<{
    onSave: (assetData: Omit<PpeAsset, 'id' | 'status' | 'last_maintenance_date' | 'decommission_date' | 'current_employee_id'>) => void;
    onClose: () => void;
    ppeItems: PpeItem[];
}> = ({ onSave, onClose, ppeItems }) => {
    const [assetTag, setAssetTag] = useState('');
    const [ppeItemId, setPpeItemId] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetTag || !ppeItemId) {
            alert('Por favor, complete la etiqueta del activo y seleccione un tipo de EPP.');
            return;
        }
        onSave({
            asset_tag: assetTag,
            ppe_item_id: ppeItemId,
            purchase_date: purchaseDate,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Etiqueta del Activo (ID Único)</label>
                <input type="text" value={assetTag} onChange={e => setAssetTag(e.target.value)} placeholder="Ej: ARN-001" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de EPP (del inventario)</label>
                <select value={ppeItemId} onChange={e => setPpeItemId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text" required>
                    <option value="">Seleccione un tipo de EPP</option>
                    {ppeItems.map(item => <option key={item.id} value={item.id}>{`${item.name} - ${item.type} / ${item.size}`}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Compra</label>
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Activo</button>
            </div>
        </form>
    );
};

type ActionModalState = {
    type: 'assign' | 'return' | 'maintenance' | 'decommission';
    asset: PpeAsset;
} | null;

const AssetActionForm: React.FC<{
    action: ActionModalState;
    onSave: (details: { employeeId?: string; notes?: string }) => void;
    onClose: () => void;
    employees: Employee[];
}> = ({ action, onSave, onClose, employees }) => {
    const [notes, setNotes] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    if (!action) return null;

    const { type, asset } = action;

    const filteredEmployees = searchTerm
        ? employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_number.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'assign' && !selectedEmployeeId) {
            alert('Debe seleccionar un empleado.');
            return;
        }
        onSave({ employeeId: selectedEmployeeId, notes });
    };

    const titleMap = {
        assign: 'Asignar Activo',
        return: 'Devolver Activo a Almacén',
        maintenance: 'Registrar Mantenimiento',
        decommission: 'Dar de Baja Activo',
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold">{titleMap[type]}: <span className="text-primary">{asset.asset_tag}</span></h3>
            {type === 'assign' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Asignar a Empleado</label>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setSelectedEmployeeId('');
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    {searchTerm && (
                        <ul className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white">
                            {filteredEmployees.map(emp => (
                                <li key={emp.id} onClick={() => { setSelectedEmployeeId(emp.id); setSearchTerm(emp.name); }} className="p-2 hover:bg-gray-100 cursor-pointer">{emp.name}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">Notas (Opcional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Confirmar</button>
            </div>
        </form>
    );
};


const PpeInventory: React.FC = () => {
    const [view, setView] = useState<'inventory' | 'assets'>('inventory');
    const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [ppeAssets, setPpeAssets] = useState<PpeAsset[]>([]);
    const [ppeAssetLogs, setPpeAssetLogs] = useState<PpeAssetLog[]>([]);
    const [loading, setLoading] = useState(true);
    
    const { hasPermission, currentUser } = useAuth();
    
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingPpeItem, setEditingPpeItem] = useState<PpeItem | null>(null);
    
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [adjustmentDetails, setAdjustmentDetails] = useState<{
        itemId: string;
        adjustmentType: 'in' | 'out';
        itemName: string;
        currentStock: number;
    } | null>(null);
    
    const [isAssetLogModalOpen, setIsAssetLogModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<PpeAsset | null>(null);
    const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
    const [actionModalState, setActionModalState] = useState<ActionModalState>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [itemsRes, employeesRes, assetsRes, logsRes] = await Promise.all([
            db.getPpeItems(),
            db.getEmployees(),
            db.getPpeAssets(),
            db.getPpeAssetLogs(),
        ]);
        
        setPpeItems(itemsRes);
        setEmployees(employeesRes);
        setPpeAssets(assetsRes);
        setPpeAssetLogs(logsRes);
        
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveItem = async (itemData: Omit<PpeItem, 'id'>, id: string | null) => {
        if (id) {
            await db.updatePpeItem(id, itemData);
        } else {
            await db.addPpeItem(itemData);
        }
        fetchData();
        setIsItemModalOpen(false);
        setEditingPpeItem(null);
    };

    const handleEditItem = (item: PpeItem) => {
        setEditingPpeItem(item);
        setIsItemModalOpen(true);
    };

    const handleDeleteItem = async (itemId: string) => {
        const itemToDelete = ppeItems.find(item => item.id === itemId);
        if (!itemToDelete) return;

        // Check for dependencies before deleting
        const inUseResult = await db.isPpeItemInUse(itemId);
        if (inUseResult.inUse) {
            alert(inUseResult.message || `No se puede eliminar "${itemToDelete.name}". El artículo está en uso.`);
            return;
        }

        if (window.confirm(`¿Estás seguro de que quieres eliminar "${itemToDelete.name}"? Esta acción es irreversible.`)) {
            await db.deletePpeItem(itemId);
            fetchData();
        }
    };
    
    const handleOpenStockAdjustment = (itemId: string, adjustmentType: 'in' | 'out') => {
        const itemToAdjust = ppeItems.find(p => p.id === itemId);
        if (!itemToAdjust) return;

        setAdjustmentDetails({
            itemId,
            adjustmentType,
            itemName: `${itemToAdjust.name} (${itemToAdjust.type} / ${itemToAdjust.size})`,
            currentStock: itemToAdjust.stock,
        });
        setIsAdjustmentModalOpen(true);
    };
    
    const handleConfirmStockAdjustment = async (quantity: number) => {
        if (!adjustmentDetails) return;
        const { itemId, adjustmentType, currentStock } = adjustmentDetails;
        const newStock = adjustmentType === 'in' ? currentStock + quantity : currentStock - quantity;

        if (newStock < 0) {
            alert('No se puede retirar más stock del disponible.');
            return;
        }

        await db.updatePpeItem(itemId, { stock: newStock });
        fetchData();
        setIsAdjustmentModalOpen(false);
        setAdjustmentDetails(null);
    };
    
    const handleOpenAssetLog = (asset: PpeAsset) => {
        setSelectedAsset(asset);
        setIsAssetLogModalOpen(true);
    };

    const handleSaveAsset = async (assetData: Omit<PpeAsset, 'id' | 'status' | 'last_maintenance_date' | 'decommission_date' | 'current_employee_id'>) => {
        if (!currentUser) return;

        const newAssetData: Omit<PpeAsset, 'id'> = {
            ...assetData,
            status: 'En Almacén',
            last_maintenance_date: null,
            decommission_date: null,
            current_employee_id: null,
        };

        const newAsset = await db.addPpeAsset(newAssetData);

        if (newAsset) {
            await db.addPpeAssetLog({
                asset_id: newAsset.id,
                date: new Date().toISOString(),
                event_type: 'Creación',
                details: `Activo creado con etiqueta ${newAsset.asset_tag}.`,
                user_id: currentUser.id
            });
        }
        
        fetchData();
        setIsAssetFormModalOpen(false);
    };

    const handleAssetAction = async (details: { employeeId?: string; notes?: string }) => {
        if (!actionModalState || !currentUser) return;
    
        const { type, asset } = actionModalState;
        let newStatus: PpeAssetStatus | null = null;
        let logDetails = '';
        const updates: Partial<PpeAsset> = {};
    
        const eventTypeMap: Record<ActionModalState['type'], PpeAssetEventType> = {
            assign: 'Asignación',
            return: 'Devolución',
            maintenance: 'Mantenimiento',
            decommission: 'Baja',
        };
    
        switch (type) {
            case 'assign':
                const employee = employees.find(e => e.id === details.employeeId);
                if (!employee) {
                    alert('Empleado no válido.');
                    return;
                }
                newStatus = 'Asignado';
                updates.current_employee_id = employee.id;
                logDetails = `Asignado a ${employee.name}. ${details.notes || ''}`.trim();
                break;
            case 'return':
                newStatus = 'En Almacén';
                updates.current_employee_id = null;
                logDetails = `Devuelto al almacén. ${details.notes || ''}`.trim();
                break;
            case 'maintenance':
                newStatus = 'En Mantenimiento';
                updates.last_maintenance_date = new Date().toISOString();
                logDetails = `Enviado a mantenimiento. ${details.notes || ''}`.trim();
                break;
            case 'decommission':
                newStatus = 'Fuera de Servicio';
                updates.decommission_date = new Date().toISOString();
                logDetails = `Dado de baja. ${details.notes || ''}`.trim();
                break;
        }
    
        if (newStatus) {
            updates.status = newStatus;
            await db.updatePpeAsset(asset.id, updates);
            await db.addPpeAssetLog({
                asset_id: asset.id,
                date: new Date().toISOString(),
                event_type: eventTypeMap[type],
                details: logDetails,
                user_id: currentUser.id,
            });
            fetchData();
            setActionModalState(null);
        }
    };

    const getPpeItemName = (id: string | null) => {
        if (!id) return 'N/A';
        const item = ppeItems.find(i => i.id === id);
        return item ? `${item.name} (${item.type} / ${item.size})` : 'Desconocido';
    };

    const getEmployeeName = (id: string | null) => {
        if (!id) return 'N/A';
        return employees.find(e => e.id === id)?.name || 'Desconocido';
    };

    const getAssetStatusClass = (status: PpeAssetStatus) => {
        switch (status) {
            case 'Asignado': return 'bg-blue-100 text-blue-800';
            case 'En Mantenimiento': return 'bg-yellow-100 text-yellow-800';
            case 'Fuera de Servicio': return 'bg-red-100 text-red-800';
            case 'En Almacén':
            default: return 'bg-green-100 text-green-800';
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setView('inventory')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Inventario de Consumibles
                    </button>
                    <button onClick={() => setView('assets')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'assets' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Trazabilidad de Activos
                    </button>
                </nav>
            </div>

            {view === 'inventory' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-dark-text">Catálogo de EPP (Consumibles)</h2>
                        {hasPermission('manage_ppe') && (
                            <button onClick={() => { setEditingPpeItem(null); setIsItemModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                + Agregar Variante de EPP
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo / Material</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    {hasPermission('manage_ppe') && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                 {ppeItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-dark-text">{item.stock}</td>
                                        {hasPermission('manage_ppe') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => handleOpenStockAdjustment(item.id, 'in')} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 font-semibold">
                                                        + Ingresar
                                                    </button>
                                                    <button onClick={() => handleOpenStockAdjustment(item.id, 'out')} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-semibold">
                                                        - Salida
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button onClick={() => handleEditItem(item)} className="text-indigo-600 hover:text-indigo-900" title="Modificar">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                 {ppeItems.length === 0 && (
                                    <tr><td colSpan={hasPermission('manage_ppe') ? 5: 4} className="text-center py-4 text-gray-500">No hay EPP en inventario. Agregue una variante para comenzar.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {view === 'assets' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-dark-text">Gestión de Activos de EPP</h2>
                        {hasPermission('manage_ppe') && (
                            <button onClick={() => setIsAssetFormModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                                + Registrar Activo
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etiqueta de Activo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de EPP</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ppeAssets.map(asset => (
                                    <tr key={asset.id}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{asset.asset_tag}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getPpeItemName(asset.ppe_item_id)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAssetStatusClass(asset.status)}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getEmployeeName(asset.current_employee_id)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleOpenAssetLog(asset)} className="text-gray-600 hover:text-primary" title="Ver Historial">
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                             {asset.status === 'En Almacén' && (
                                                <button onClick={() => setActionModalState({ type: 'assign', asset })} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-semibold">Asignar</button>
                                            )}
                                            {asset.status === 'Asignado' && (
                                                <button onClick={() => setActionModalState({ type: 'return', asset })} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-semibold">Devolver</button>
                                            )}
                                            {asset.status !== 'Fuera de Servicio' && (<>
                                                <button onClick={() => setActionModalState({ type: 'maintenance', asset })} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-semibold">Mantenimiento</button>
                                                <button onClick={() => setActionModalState({ type: 'decommission', asset })} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-semibold">Baja</button>
                                            </>)}
                                        </td>
                                    </tr>
                                ))}
                                {ppeAssets.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hay activos de EPP registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {hasPermission('manage_ppe') && (
                <>
                    <Modal 
                        isOpen={isItemModalOpen} 
                        onClose={() => { setIsItemModalOpen(false); setEditingPpeItem(null); }} 
                        title={editingPpeItem ? "Modificar Variante de EPP" : "Agregar Variante de EPP al Inventario"}
                    >
                        <PpeItemForm 
                            onSave={handleSaveItem} 
                            onClose={() => { setIsItemModalOpen(false); setEditingPpeItem(null); }} 
                            initialData={editingPpeItem} 
                        />
                    </Modal>
                    <Modal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} title="Ajustar Stock de EPP">
                        {adjustmentDetails && (
                            <StockAdjustmentForm
                                details={adjustmentDetails}
                                onSave={handleConfirmStockAdjustment}
                                onClose={() => setIsAdjustmentModalOpen(false)}
                            />
                        )}
                    </Modal>
                    <Modal isOpen={isAssetFormModalOpen} onClose={() => setIsAssetFormModalOpen(false)} title="Registrar Nuevo Activo de EPP">
                        <PpeAssetForm onSave={handleSaveAsset} onClose={() => setIsAssetFormModalOpen(false)} ppeItems={ppeItems} />
                    </Modal>
                     <Modal isOpen={!!actionModalState} onClose={() => setActionModalState(null)} title="Gestionar Activo de EPP">
                        <AssetActionForm
                            action={actionModalState}
                            onSave={handleAssetAction}
                            onClose={() => setActionModalState(null)}
                            employees={employees}
                        />
                    </Modal>
                </>
            )}
             <Modal isOpen={isAssetLogModalOpen} onClose={() => setIsAssetLogModalOpen(false)} title={`Historial del Activo: ${selectedAsset?.asset_tag}`}>
                {selectedAsset && (
                    <div>
                        <p className="font-bold mb-2">{getPpeItemName(selectedAsset.ppe_item_id)}</p>
                        <ul className="max-h-96 overflow-y-auto space-y-2">
                           {ppeAssetLogs.filter(log => log.asset_id === selectedAsset.id).map(log => (
                               <li key={log.id} className="p-2 bg-gray-50 rounded-md text-sm text-dark-text border-l-4 border-primary">
                                   <p className="font-semibold">{log.event_type} - {new Date(log.date).toLocaleString()}</p>
                                   <p className="text-xs text-gray-500">Por: {getEmployeeName(log.user_id)}</p>
                                   <p className="mt-1">{log.details}</p>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PpeInventory;