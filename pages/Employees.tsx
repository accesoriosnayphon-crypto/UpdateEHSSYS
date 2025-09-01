import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../types';
import Modal from '../components/Modal';
import EmployeeImportModal from '../components/EmployeeImportModal';
import { PencilIcon, TrashIcon, ArrowDownTrayIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';
import { useData } from '../contexts/DataContext';
import * as XLSX from 'xlsx';

const EmployeeForm: React.FC<{
    onSave: (employee: Omit<Employee, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: Employee | null;
}> = ({ onSave, onClose, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [department, setDepartment] = useState(initialData?.department || '');
    const [position, setPosition] = useState(initialData?.position || '');
    const [employeeNumber, setEmployeeNumber] = useState(initialData?.employee_number || '');
    const [curp, setCurp] = useState(initialData?.curp || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !department || !position || !employeeNumber) return;
        const employeeData = { name, department, position, employee_number: employeeNumber, curp };
        onSave(employeeData, initialData ? initialData.id : null);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700">Número de Empleado</label>
                <input type="text" id="employeeNumber" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
            </div>
             <div>
                <label htmlFor="curp" className="block text-sm font-medium text-gray-700">CURP (Opcional)</label>
                <input type="text" id="curp" value={curp} onChange={e => setCurp(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            </div>
            <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento</label>
                <input type="text" id="department" value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Puesto</label>
                <input type="text" id="position" value={position} onChange={e => setPosition(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar</button>
            </div>
        </form>
    );
};

const Employees: React.FC = () => {
    const { employees, loading, refreshData } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { hasPermission } = useAuth();
    
    const handleSaveEmployee = async (employeeData: Omit<Employee, 'id'>, id: string | null) => {
        if (id) {
            await db.updateEmployee(id, employeeData);
        } else {
            await db.addEmployee(employeeData);
        }
        refreshData();
        setIsModalOpen(false);
        setEditingEmployee(null);
    };

    const handleImportComplete = async (newEmployees: Omit<Employee, 'id'>[]) => {
       if (newEmployees.length === 0) {
           alert("No hay nuevos empleados para importar.");
           return;
       }
       await db.addMultipleEmployees(newEmployees);
       alert(`${newEmployees.length} empleados importados exitosamente.`);
       refreshData();
    };

    const handleAddNew = () => {
        setEditingEmployee(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsModalOpen(true);
    };

    const handleDelete = async (employeeId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar a este empleado?')) {
            await db.deleteEmployee(employeeId);
            refreshData();
        }
    };

    const filteredEmployees = useMemo(() => employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.curp && employee.curp.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [employees, searchTerm]);
    
    const handleExport = () => {
        const dataToExport = filteredEmployees.map(emp => ({
            "Número de Empleado": emp.employee_number,
            "Nombre Completo": emp.name,
            "CURP": emp.curp || '',
            "Departamento": emp.department,
            "Puesto": emp.position,
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Empleados");
        XLSX.writeFile(wb, "lista_empleados.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-dark-text">Lista de Empleados</h2>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, número o CURP..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 flex-shrink-0">
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    {hasPermission('manage_employees') && (
                        <>
                            <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2 flex-shrink-0">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Importar</span>
                            </button>
                            <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex-shrink-0">
                                + Agregar Empleado
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Empleado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CURP</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                            {hasPermission('manage_employees') && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-4">Cargando...</td></tr>
                        ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map(employee => (
                                <tr key={employee.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{employee.employee_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.curp || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.position}</td>
                                    {hasPermission('manage_employees') && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            <button onClick={() => handleEdit(employee)} className="text-indigo-600 hover:text-indigo-900" title="Modificar">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={hasPermission('manage_employees') ? 6 : 5} className="text-center py-4 text-gray-500">
                                    {employees.length > 0 ? 'No se encontraron empleados con ese criterio.' : 'No hay empleados registrados.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {hasPermission('manage_employees') && (
                <>
                    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Modificar Empleado' : 'Agregar Nuevo Empleado'}>
                        <EmployeeForm onSave={handleSaveEmployee} onClose={() => { setIsModalOpen(false); setEditingEmployee(null); }} initialData={editingEmployee} />
                    </Modal>
                    <EmployeeImportModal 
                        isOpen={isImportModalOpen} 
                        onClose={() => setIsImportModalOpen(false)}
                        onComplete={handleImportComplete}
                        existingEmployeeNumbers={useMemo(() => employees.map(e => e.employee_number), [employees])}
                    />
                </>
            )}
        </div>
    );
};

export default Employees;