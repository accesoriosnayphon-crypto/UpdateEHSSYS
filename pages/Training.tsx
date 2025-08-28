import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Training, Employee, TrainingType } from '../types';
import Modal from '../components/Modal';
import TrainingReport from '../components/TrainingReport';
import { EyeIcon, TrashIcon, PrinterIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';

const TrainingForm: React.FC<{ onSave: (training: Omit<Training, 'id'>) => void, onClose: () => void, employees: Employee[] }> = ({ onSave, onClose, employees }) => {
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [trainingType, setTrainingType] = useState<TrainingType>('Interna');
    const [instructor, setInstructor] = useState('');
    const [durationHours, setDurationHours] = useState<number>(1);
    const [attendees, setAttendees] = useState<string[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    
    const availableEmployees = useMemo(() => {
        return employees.filter(emp => !attendees.includes(emp.id));
    }, [employees, attendees]);

    const filteredEmployees = searchTerm
        ? availableEmployees.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 5)
        : [];
    
    const selectedEmployees = useMemo(() => {
        return employees.filter(emp => attendees.includes(emp.id));
    }, [employees, attendees]);

    const handleAddAttendee = (employeeId: string) => {
        setAttendees(prev => [...prev, employeeId]);
        setSearchTerm('');
    };

    const handleRemoveAttendee = (employeeId: string) => {
        setAttendees(prev => prev.filter(id => id !== employeeId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !instructor || attendees.length === 0) {
            alert("Por favor complete todos los campos y agregue al menos un asistente.");
            return;
        }
        onSave({ topic, date, training_type: trainingType, instructor, duration_hours: durationHours, attendees });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tema de la Capacitación</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select value={trainingType} onChange={e => setTrainingType(e.target.value as TrainingType)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                        <option className="text-dark-text" value="Interna">Interna</option>
                        <option className="text-dark-text" value="Externa">Externa</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Impartida por</label>
                    <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="Nombre del instructor" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Duración (horas)</label>
                    <input type="number" value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            
            <div className="pt-4 border-t">
                <label className="block text-sm font-bold text-gray-700 mb-2">Asistentes</label>
                 <input
                    type="text"
                    placeholder="Buscar empleado por nombre o número para agregar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                {searchTerm && (
                    <ul className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white z-10">
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                                <li key={emp.id} onClick={() => handleAddAttendee(emp.id)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-dark-text">
                                    {emp.name} ({emp.employee_number})
                                </li>
                            ))
                        ) : (<li className="p-2 text-gray-500 text-sm">No se encontraron empleados.</li>)}
                    </ul>
                )}
                <div className="mt-3 max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-800">({selectedEmployees.length}) Empleados Seleccionados:</h4>
                    {selectedEmployees.length > 0 ? (
                        selectedEmployees.map(emp => (
                            <div key={emp.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                <span className="text-sm text-dark-text font-medium">{emp.name}</span>
                                <button type="button" onClick={() => handleRemoveAttendee(emp.id)} className="text-red-500 hover:text-red-700">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (<p className="text-sm text-gray-500 p-2">Aún no se han agregado asistentes.</p>)}
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Guardar Capacitación</button>
            </div>
        </form>
    );
}

const Training: React.FC = () => {
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const { hasPermission, appSettings } = useAuth();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [trainingsRes, employeesRes] = await Promise.all([
            db.getTrainings(),
            db.getEmployees()
        ]);
        setTrainings(trainingsRes);
        setEmployees(employeesRes);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveTraining = async (trainingData: Omit<Training, 'id'>) => {
        await db.addTraining(trainingData);
        fetchData();
        setIsFormModalOpen(false);
    };
    
    const handleViewAttendees = (training: Training) => {
        setSelectedTraining(training);
        setIsAttendeesModalOpen(true);
    };
    
    const handleGenerateReport = (training: Training) => {
        setSelectedTraining(training);
        setIsReportModalOpen(true);
    };

    const attendeesForSelectedTraining = useMemo(() => {
        if (!selectedTraining) return [];
        return (selectedTraining.attendees || []).map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[];
    }, [selectedTraining, employees]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Registro de Capacitaciones</h2>
                {hasPermission('manage_trainings') && (
                    <button onClick={() => setIsFormModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                        + Registrar Capacitación
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tema</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impartida por</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asistentes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-4">Cargando...</td></tr>
                        ) : trainings.map(training => (
                            <tr key={training.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{training.topic}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(training.date + 'T00:00:00').toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{training.training_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{training.instructor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{training.duration_hours}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(training.attendees || []).length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-4">
                                    <button onClick={() => handleViewAttendees(training)} className="text-gray-700 hover:text-primary" title="Ver Asistentes">
                                        <EyeIcon className="w-5 h-5 text-dark-text"/>
                                    </button>
                                    <button onClick={() => handleGenerateReport(training)} className="text-gray-700 hover:text-primary" title="Generar Reporte">
                                        <PrinterIcon className="w-5 h-5 text-dark-text"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {trainings.length === 0 && !loading && (
                            <tr><td colSpan={7} className="text-center py-4 text-gray-500">No hay capacitaciones registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {hasPermission('manage_trainings') && (
                <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Registrar Nueva Capacitación">
                    <TrainingForm onSave={handleSaveTraining} onClose={() => setIsFormModalOpen(false)} employees={employees} />
                </Modal>
            )}
             <Modal isOpen={isAttendeesModalOpen} onClose={() => setIsAttendeesModalOpen(false)} title={`Asistentes de: ${selectedTraining?.topic || ''}`}>
                {selectedTraining && (
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="space-y-2">
                           {attendeesForSelectedTraining.map(emp => (
                               <li key={emp.id} className="p-2 bg-gray-50 rounded-md text-sm text-dark-text">
                                   <span className="font-semibold">{emp.name}</span> ({emp.employee_number})
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </Modal>
             <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Constancia de Habilidades Laborales">
                {selectedTraining && appSettings && (
                    <TrainingReport 
                        training={selectedTraining}
                        attendees={attendeesForSelectedTraining}
                        appSettings={appSettings}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Training;