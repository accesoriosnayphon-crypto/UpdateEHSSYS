import React, { useState, useMemo, useEffect } from 'react';
import { Employee, PpeDelivery, Incident, Inspection, Training, PpeItem } from '../types';
import * as db from '../services/db';

const History: React.FC = () => {
    // State
    const [allData, setAllData] = useState<{
        employees: Employee[],
        ppeDeliveries: PpeDelivery[],
        incidents: Incident[],
        inspections: Inspection[],
        trainings: Training[],
        ppeItems: PpeItem[]
    }>({ employees: [], ppeDeliveries: [], incidents: [], inspections: [], trainings: [], ppeItems: []});
    
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ppe' | 'inspections' | 'incidents' | 'trainings'>('ppe');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [
                employees, ppeDeliveries, incidents, inspections, trainings, ppeItems
            ] = await Promise.all([
                db.getEmployees(),
                db.getPpeDeliveries(),
                db.getIncidents(),
                db.getInspections(),
                db.getTrainings(),
                db.getPpeItems(),
            ]);
            
            setAllData({ employees, ppeDeliveries, incidents, inspections, trainings, ppeItems });
            setLoading(false);
        }
        fetchData();
    }, []);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return [];
        return allData.employees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 7);
    }, [searchTerm, allData.employees]);

    const employeeHistory = useMemo(() => {
        if (!selectedEmployee) return null;
        return {
            ppeDeliveries: allData.ppeDeliveries.filter(d => d.employee_id === selectedEmployee.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            incidents: allData.incidents.filter(i => i.employee_id === selectedEmployee.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            inspections: allData.inspections.filter(i => i.employee_id === selectedEmployee.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            trainings: allData.trainings.filter(t => t.attendees && t.attendees.includes(selectedEmployee.id)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
    }, [selectedEmployee, allData]);

    const getPpeName = (id: string) => {
        const item = allData.ppeItems.find(p => p.id === id);
        return item ? `${item.name} (${item.type})` : 'N/A';
    };

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSearchTerm('');
    };

    const handleClearSelection = () => {
        setSelectedEmployee(null);
        setActiveTab('ppe');
    };

    if (!selectedEmployee) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-dark-text mb-4">Historial por Empleado</h2>
                <p className="text-medium-text mb-6">Busque y seleccione un empleado para ver su información histórica.</p>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o número de empleado..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={loading}
                    />
                     {loading && <p className="text-sm mt-2">Cargando datos...</p>}
                    {filteredEmployees.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                            {filteredEmployees.map(emp => (
                                <li
                                    key={emp.id}
                                    onClick={() => handleSelectEmployee(emp)}
                                    className="p-3 hover:bg-primary-dark/10 cursor-pointer text-left"
                                >
                                    <p className="font-semibold text-dark-text">{emp.name}</p>
                                    <p className="text-sm text-medium-text">Nº: {emp.employee_number} - {emp.position}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    }
    
    // Employee History View
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            {/* Employee Header */}
            <div className="flex justify-between items-start mb-6 p-4 border rounded-lg bg-gray-50">
                <div>
                    <h2 className="text-2xl font-bold text-primary">{selectedEmployee.name}</h2>
                    <p className="text-medium-text"><strong>Nº Empleado:</strong> {selectedEmployee.employee_number}</p>
                    <p className="text-medium-text"><strong>Departamento:</strong> {selectedEmployee.department}</p>
                    <p className="text-medium-text"><strong>Puesto:</strong> {selectedEmployee.position}</p>
                </div>
                <button onClick={handleClearSelection} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-semibold">
                    Buscar Otro
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('ppe')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'ppe' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Entregas de EPP ({employeeHistory?.ppeDeliveries.length})
                    </button>
                     <button onClick={() => setActiveTab('inspections')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'inspections' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Inspecciones de EPP ({employeeHistory?.inspections.length})
                    </button>
                    <button onClick={() => setActiveTab('incidents')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'incidents' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Incidentes ({employeeHistory?.incidents.length})
                    </button>
                    <button onClick={() => setActiveTab('trainings')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'trainings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Capacitaciones ({employeeHistory?.trainings.length})
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'ppe' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo Entrega</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employeeHistory?.ppeDeliveries.map(d => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(d.date + 'T00:00:00').toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{getPpeName(d.ppe_id)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{d.quantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{d.delivery_type}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${d.status === 'Aprobado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{d.status}</span></td>
                                    </tr>
                                ))}
                                {employeeHistory?.ppeDeliveries.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">No hay entregas de EPP registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'inspections' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hubo Violación</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipos de Faltas</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {employeeHistory?.inspections.map(i => (
                                    <tr key={i.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(i.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${i.violation ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{i.violation ? 'Sí' : 'No'}</span></td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{i.violations ? i.violations.join(', ') : 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={i.observations || 'N/A'}>{i.observations || 'N/A'}</td>
                                    </tr>
                                ))}
                                {employeeHistory?.inspections.length === 0 && (
                                     <tr><td colSpan={4} className="text-center py-4 text-gray-500">No hay inspecciones de EPP registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                 {activeTab === 'incidents' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Evento</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {employeeHistory?.incidents.map(i => (
                                    <tr key={i.id}>
                                        <td className="px-4 py-3 whitespace-nowrap font-mono text-sm text-gray-500">{i.folio}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(i.date + 'T00:00:00').toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{i.event_type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={i.description}>{i.description}</td>
                                    </tr>
                                ))}
                                {employeeHistory?.incidents.length === 0 && (
                                     <tr><td colSpan={4} className="text-center py-4 text-gray-500">No hay incidentes registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'trainings' && (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tema</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Impartido por</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duración (hrs)</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {employeeHistory?.trainings.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{new Date(t.date + 'T00:00:00').toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{t.topic}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.instructor}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{t.duration_hours}</td>
                                    </tr>
                                ))}
                                {employeeHistory?.trainings.length === 0 && (
                                     <tr><td colSpan={4} className="text-center py-4 text-gray-500">No hay capacitaciones registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;