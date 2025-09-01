

import React, { useState, useEffect, useCallback } from 'react';
import { Inspection, Employee, ViolationType, VIOLATION_TYPES } from '../types';
import Modal from '../components/Modal';
import { EyeIcon, ArrowDownTrayIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';
import { useData } from '../contexts/DataContext';
import * as XLSX from 'xlsx';

const InspectionForm: React.FC<{
    onSave: (inspection: Omit<Inspection, 'id'>) => void;
    onClose: () => void;
    employees: Employee[];
}> = ({ onSave, onClose, employees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [violation, setViolation] = useState(false);
    const [selectedViolations, setSelectedViolations] = useState<ViolationType[]>([]);
    const [observations, setObservations] = useState('');

    const filteredEmployees = searchTerm
        ? employees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 5)
        : [];

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSearchTerm('');
    };
    
    const handleViolationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hasViolation = e.target.value === 'yes';
        setViolation(hasViolation);
        if (!hasViolation) {
            setSelectedViolations([]);
        }
    };

    const handleViolationTypeChange = (violationType: ViolationType) => {
        setSelectedViolations(prev =>
            prev.includes(violationType)
                ? prev.filter(v => v !== violationType)
                : [...prev, violationType]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) {
            alert('Por favor, seleccione un empleado.');
            return;
        }
        if (violation && selectedViolations.length === 0) {
            alert('Si hubo una violación, debe seleccionar al menos un tipo.');
            return;
        }

        onSave({
            employee_id: selectedEmployee.id,
            date: new Date().toISOString(),
            violation,
            violations: violation ? selectedViolations : null,
            observations: observations || null,
        });
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">1. Buscar Empleado</label>
                {!selectedEmployee ? (
                    <div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                         {searchTerm && (
                            <ul className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(emp => (
                                        <li key={emp.id} onClick={() => handleSelectEmployee(emp)} className="p-3 hover:bg-gray-100 cursor-pointer text-dark-text">
                                            {emp.name} ({emp.employee_number})
                                        </li>
                                    ))
                                ) : (<li className="p-3 text-gray-500">No se encontraron empleados.</li>)}
                            </ul>
                        )}
                    </div>
                ) : (
                     <div className="mt-1 p-4 border border-green-300 bg-green-50 rounded-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-dark-text">{selectedEmployee.name}</p>
                                <p className="text-sm text-medium-text">Nº: {selectedEmployee.employee_number}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedEmployee(null)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">Cambiar</button>
                        </div>
                    </div>
                )}
            </div>
            
            {selectedEmployee && (
                <div className="space-y-4 pt-4 border-t">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. ¿Se detectó una violación en el uso de EPP?</label>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input type="radio" name="violation" value="yes" checked={violation === true} onChange={handleViolationChange} className="focus:ring-primary h-4 w-4 text-primary border-gray-300"/>
                                <span className="ml-2 text-gray-700">Sí</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="violation" value="no" checked={violation === false} onChange={handleViolationChange} className="focus:ring-primary h-4 w-4 text-primary border-gray-300"/>
                                <span className="ml-2 text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                    
                    {violation && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">3. Tipos de Violación (marque todas las que apliquen)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border p-3 rounded-md max-h-48 overflow-y-auto">
                                {VIOLATION_TYPES.map(type => (
                                    <label key={type} className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={selectedViolations.includes(type)}
                                            onChange={() => handleViolationTypeChange(type)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{violation ? '4.' : '3.'} Observaciones</label>
                        <textarea
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                            rows={4}
                            placeholder="Añadir comentarios, acciones correctivas tomadas, etc."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark" disabled={!selectedEmployee}>Guardar Inspección</button>
            </div>
        </form>
    );
};

const InspectionDetails: React.FC<{ inspection: Inspection, employeeName: string }> = ({ inspection, employeeName }) => {
    return (
        <div className="space-y-4">
            <p><strong>Empleado:</strong> {employeeName}</p>
            <p><strong>Fecha:</strong> {new Date(inspection.date).toLocaleString()}</p>
            <p><strong>Hubo Violación:</strong> {inspection.violation ? 'Sí' : 'No'}</p>
            {inspection.violation && (
                <div>
                    <strong>Tipos de Violaciones:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                        {inspection.violations?.map(v => <li key={v}>{v}</li>)}
                    </ul>
                </div>
            )}
            <p><strong>Observaciones:</strong> {inspection.observations || 'N/A'}</p>
        </div>
    );
};

const Inspections: React.FC = () => {
    const { inspections, employees, loading, refreshData } = useData();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { hasPermission } = useAuth();
    
    const handleSaveInspection = async (inspectionData: Omit<Inspection, 'id'>) => {
        await db.addInspection(inspectionData);
        refreshData();
        setIsFormModalOpen(false);
    };

    const handleViewDetails = (inspection: Inspection) => {
        setSelectedInspection(inspection);
        setIsViewModalOpen(true);
    };
    
    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'N/A';
    
    const filteredInspections = inspections.filter(inspection => {
        if (!searchTerm) return true;
        const employee = employees.find(e => e.id === inspection.employee_id);
        if (!employee) return false;
        const searchTermLower = searchTerm.toLowerCase();
        return (
            employee.name.toLowerCase().includes(searchTermLower) ||
            employee.employee_number.toLowerCase().includes(searchTermLower)
        );
    });

    const handleExport = () => {
        const dataToExport = filteredInspections.map(item => ({
            "Fecha": new Date(item.date).toLocaleString(),
            "Empleado": getEmployeeName(item.employee_id),
            "Hubo Violación": item.violation ? 'Sí' : 'No',
            "Tipos de Violación": item.violations ? item.violations.join(', ') : '',
            "Observaciones": item.observations || '',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inspecciones_EPP");
        XLSX.writeFile(wb, "reporte_inspecciones_epp.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-dark-text">Inspecciones de EPP</h2>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Buscar por empleado..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 flex-shrink-0">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_inspections') && (
                        <button onClick={() => setIsFormModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex-shrink-0">
                            + Nueva Inspección
                        </button>
                    )}
                </div>
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violación</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr>
                        ) : filteredInspections.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.date).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getEmployeeName(item.employee_id)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {item.violation ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Sí</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">No</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={item.observations || 'N/A'}>{item.observations || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleViewDetails(item)} className="text-gray-600 hover:text-primary" title="Ver Detalles">
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {hasPermission('manage_inspections') && (
                <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Registrar Nueva Inspección de EPP">
                    <InspectionForm onSave={handleSaveInspection} onClose={() => setIsFormModalOpen(false)} employees={employees} />
                </Modal>
            )}
             <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles de la Inspección">
                {selectedInspection && <InspectionDetails inspection={selectedInspection} employeeName={getEmployeeName(selectedInspection.employee_id)} />}
             </Modal>
        </div>
    );
};

export default Inspections;