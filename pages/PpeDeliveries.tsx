
import React, { useState, useEffect, useCallback } from 'react';
import { PpeItem, PpeDelivery, Employee, DeliveryType, PpeDeliveryWithDetails } from '../types';
import Modal from '../components/Modal';
import DeliveryReceipt from '../components/DeliveryReceipt';
import { PrinterIcon, CheckCircleIcon, ArrowDownTrayIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';
import * as XLSX from 'xlsx';

const PpeDeliveryForm: React.FC<{ onSave: (delivery: Omit<PpeDelivery, 'id' | 'folio' | 'status' | 'requested_by_user_id' | 'approved_by_user_id'>) => void, onClose: () => void, employees: Employee[], ppeItems: PpeItem[] }> = ({ onSave, onClose, employees, ppeItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [ppeId, setPpeId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('Renovación');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [renewalDate, setRenewalDate] = useState('');
    
    const filteredEmployees = searchTerm
        ? employees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 5)
        : [];

    const availablePpeForDelivery = ppeItems.filter(p => p.stock > 0);

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSearchTerm('');
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee || !ppeId || !deliveryType || !deliveryDate) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }
        onSave({
            employee_id: selectedEmployee.id,
            ppe_id: ppeId,
            quantity,
            date: deliveryDate,
            delivery_type: deliveryType,
            renewal_date: renewalDate || null
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedEmployee ? (
                <div>
                    <label htmlFor="employee-search" className="block text-sm font-bold text-gray-700 mb-2">1. Buscar Empleado</label>
                    <input
                        id="employee-search"
                        type="text"
                        placeholder="Buscar por nombre o número..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        aria-label="Buscar empleado"
                    />
                    {searchTerm && (
                        <ul className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map(emp => (
                                    <li key={emp.id} onClick={() => handleSelectEmployee(emp)} className="p-3 hover:bg-gray-100 cursor-pointer" role="option" aria-selected="false">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-semibold text-dark-text">{emp.name}</span>
                                            <span className="text-sm text-medium-text">Nº: {emp.employee_number}</span>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="p-3 text-gray-500 text-sm">No se encontraron empleados.</li>
                            )}
                        </ul>
                    )}
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">1. Empleado Seleccionado</label>
                    <div className="mt-1 p-4 border border-green-300 bg-green-50 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-lg text-dark-text">{selectedEmployee.name}</p>
                                <p className="text-sm text-medium-text"><strong>Nº:</strong> {selectedEmployee.employee_number}</p>
                                <p className="text-sm text-medium-text"><strong>Puesto:</strong> {selectedEmployee.position}</p>
                                <p className="text-sm text-medium-text"><strong>Área:</strong> {selectedEmployee.department}</p>
                            </div>
                            <button type="button" onClick={handleClearEmployee} className="text-sm text-blue-600 hover:text-blue-800 font-semibold" aria-label="Cambiar empleado">
                                Cambiar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedEmployee && (
                <div className="space-y-4 pt-4 border-t mt-4">
                    <div>
                        <label htmlFor="ppe-select" className="block text-sm font-bold text-gray-700 mb-2">2. Seleccionar EPP</label>
                        <select id="ppe-select" value={ppeId} onChange={e => setPpeId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-dark-text rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required>
                            <option value="" className="text-gray-500">Seleccione un EPP</option>
                            {availablePpeForDelivery.map(p => <option key={p.id} value={p.id} className="text-dark-text">{`${p.name} - ${p.type} / ${p.size} (Stock: ${p.stock})`}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-bold text-gray-700 mb-2">3. Cantidad</label>
                        <input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="delivery-type" className="block text-sm font-bold text-gray-700 mb-2">4. Tipo de Entrega</label>
                            <select id="delivery-type" value={deliveryType} onChange={e => setDeliveryType(e.target.value as DeliveryType)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white text-dark-text rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required>
                                <option className="text-dark-text" value="Ingreso">Ingreso</option>
                                <option className="text-dark-text" value="Renovación">Renovación</option>
                                <option className="text-dark-text" value="Reposición">Reposición</option>
                                <option className="text-dark-text" value="Visitas">Visitas</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="delivery-date" className="block text-sm font-bold text-gray-700 mb-2">5. Fecha de Entrega</label>
                            <input id="delivery-date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="renewal-date" className="block text-sm font-bold text-gray-700 mb-2">6. Fecha de Renovación (Opcional)</label>
                        <input id="renewal-date" type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50" disabled={!selectedEmployee || !ppeId}>Enviar para Aprobación</button>
            </div>
        </form>
    );
};


const PpeDeliveries: React.FC = () => {
    const [deliveries, setDeliveries] = useState<PpeDeliveryWithDetails[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission, currentUser } = useAuth();
    
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [currentDeliveryForReceipt, setCurrentDeliveryForReceipt] = useState<PpeDeliveryWithDetails | null>(null);
    const [deliverySearchTerm, setDeliverySearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [deliveriesRes, employeesRes, itemsRes] = await Promise.all([
            db.getPpeDeliveries(),
            db.getEmployees(),
            db.getPpeItems(),
        ]);
        setDeliveries(deliveriesRes);
        setEmployees(employeesRes);
        setPpeItems(itemsRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveDelivery = async (deliveryData: Omit<PpeDelivery, 'id' | 'folio' | 'status' | 'requested_by_user_id' | 'approved_by_user_id'>) => {
        if(!currentUser) return;
        
        await db.addPpeDelivery({
            ...deliveryData,
            folio: '', // Will be replaced by DB logic
            status: 'En espera',
            approved_by_user_id: null,
            requested_by_user_id: currentUser.id
        });
        
        fetchData();
        setIsDeliveryModalOpen(false);
        alert('Solicitud de entrega enviada para aprobación.');
    };
    
    const handleApproveDelivery = async (deliveryId: string) => {
        if(!currentUser) return;
        
        const delivery = deliveries.find(d => d.id === deliveryId);
        if (!delivery || !delivery.ppe_items) return;

        const ppeItem = delivery.ppe_items;

        if (ppeItem.stock < delivery.quantity) {
            alert('Stock insuficiente para aprobar esta entrega. Por favor, actualice el inventario.');
            return;
        }
        
        await db.updatePpeItem(ppeItem.id, { stock: ppeItem.stock - delivery.quantity });
        await db.updatePpeDelivery(deliveryId, { status: 'Aprobado', approved_by_user_id: currentUser.id });
        
        fetchData();
    };

    const handlePrintReceipt = (delivery: PpeDeliveryWithDetails) => {
        setCurrentDeliveryForReceipt(delivery);
        setIsReceiptModalOpen(true);
    };

    const filteredDeliveries = deliveries.filter(delivery => {
        if (!deliverySearchTerm || !delivery.employees) return true;
        const employee = delivery.employees;
        const searchTermLower = deliverySearchTerm.toLowerCase();
        return (
            employee.name.toLowerCase().includes(searchTermLower) ||
            employee.employee_number.toLowerCase().includes(searchTermLower)
        );
    });

    const handleExport = () => {
        const dataToExport = filteredDeliveries.map(d => ({
            "Folio": d.folio,
            "Fecha de Entrega": d.date ? new Date(d.date).toLocaleDateString() : '',
            "Empleado": d.employees?.name || 'N/A',
            "Número de Empleado": d.employees?.employee_number || 'N/A',
            "EPP Entregado": d.ppe_items ? `${d.ppe_items.name} (${d.ppe_items.type} / ${d.ppe_items.size})` : 'N/A',
            "Cantidad": d.quantity,
            "Tipo de Entrega": d.delivery_type,
            "Fecha de Renovación": d.renewal_date ? new Date(d.renewal_date).toLocaleDateString() : '',
            "Estado": d.status,
            "Solicitado Por": d.profiles?.full_name || 'N/A',
            "Aprobado Por": d.approvedByUser?.full_name || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Entregas_EPP");
        XLSX.writeFile(wb, "entregas_epp.xlsx");
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-dark-text">Registro de Entregas de EPP</h2>
                 <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Buscar por empleado..."
                        value={deliverySearchTerm}
                        onChange={e => setDeliverySearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 flex-shrink-0">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                     {hasPermission('manage_ppe') && (
                        <button onClick={() => setIsDeliveryModalOpen(true)} className="px-4 py-2 bg-secondary text-dark-text rounded-md hover:bg-yellow-500 font-semibold flex-shrink-0">
                            + Registrar Entrega
                        </button>
                    )}
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Entrega</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EPP Entregado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDeliveries.map(d => (
                            <tr key={d.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{d.folio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(d.date + 'T00:00:00').toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{d.employees?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{d.ppe_items ? `${d.ppe_items.name} (${d.ppe_items.type} / ${d.ppe_items.size})` : 'EPP no encontrado'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        d.status === 'Aprobado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {d.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {d.status === 'Aprobado' && (
                                        <button onClick={() => handlePrintReceipt(d)} className="text-gray-600 hover:text-primary" title="Imprimir Comprobante">
                                            <PrinterIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    {currentUser?.level === 'Administrador' && d.status === 'En espera' && (
                                        <button onClick={() => handleApproveDelivery(d.id)} className="text-green-600 hover:text-green-900" title="Aprobar Entrega">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredDeliveries.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-gray-500">
                                    {deliveries.length > 0 ? 'No se encontraron entregas con ese criterio.' : 'No hay entregas registradas.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             {hasPermission('manage_ppe') && (
                 <Modal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} title="Registrar Nueva Entrega de EPP">
                    <PpeDeliveryForm onSave={handleSaveDelivery} onClose={() => {setIsDeliveryModalOpen(false)}} employees={employees} ppeItems={ppeItems} />
                </Modal>
             )}
            <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title={`Comprobante de Entrega - Folio ${currentDeliveryForReceipt?.folio || ''}`}>
                {currentDeliveryForReceipt && (
                    <DeliveryReceipt 
                        delivery={currentDeliveryForReceipt} 
                        employee={currentDeliveryForReceipt.employees}
                        ppeItem={currentDeliveryForReceipt.ppe_items}
                    />
                )}
            </Modal>
        </div>
    );
};

export default PpeDeliveries;