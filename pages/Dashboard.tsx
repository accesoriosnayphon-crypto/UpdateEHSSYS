
import React, { useMemo, useState, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import { UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon, AcademicCapIcon, ArrowPathIcon } from '../constants';
import { Employee, Incident, PpeItem, Training, Waste, WasteLog, Inspection, ViolationType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as db from '../services/db';

const Dashboard: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [ppeItems, setPpeItems] = useState<PpeItem[]>([]);
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
    const [wastes, setWastes] = useState<Waste[]>([]);
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [
                employeesRes,
                incidentsRes,
                ppeItemsRes,
                trainingsRes,
                wasteLogsRes,
                wastesRes,
                inspectionsRes,
            ] = await Promise.all([
                db.getEmployees(),
                db.getIncidents(),
                db.getPpeItems(),
                db.getTrainings(),
                db.getWasteLogs(),
                db.getWastes(),
                db.getInspections(),
            ]);

            setEmployees(employeesRes);
            setIncidents(incidentsRes);
            setPpeItems(ppeItemsRes);
            setTrainings(trainingsRes);
            setWasteLogs(wasteLogsRes);
            setWastes(wastesRes);
            setInspections(inspectionsRes);

            setLoading(false);
        };
        fetchData();
    }, []);
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const totalPpeStock = ppeItems.reduce((sum, item) => sum + (item.stock || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);

    const upcomingTrainings = trainings
        .filter(training => {
            if (!training.date) return false;
            const trainingDate = new Date(training.date);
            return trainingDate >= today && trainingDate <= fifteenDaysFromNow;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const hazardousWasteGenerated = wasteLogs.filter(log => {
        const logDate = new Date(log.date);
        const wasteInfo = wastes.find(w => w.id === log.waste_id);
        return wasteInfo?.type === 'Peligroso' && logDate >= thirtyDaysAgo;
    }).reduce((sum, log) => sum + (log.unit === 'Kg' ? log.quantity : 0), 0);

    const filteredInspectionsWithViolation = useMemo(() => {
        return inspections.filter(inspection => {
            if (!inspection.violation) return false;
            const inspectionDate = new Date(inspection.date);
            if (startDate && inspectionDate < new Date(startDate)) return false;
            if (endDate && inspectionDate > new Date(endDate)) return false;
            return true;
        });
    }, [inspections, startDate, endDate]);

    const violationsByArea = useMemo(() => {
        const data = filteredInspectionsWithViolation.reduce((acc, inspection) => {
            const employee = employees.find(e => e.id === inspection.employee_id);
            const area = employee?.department || 'Desconocido';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(data).map(([name, violaciones]) => ({ name, violaciones }));
    }, [filteredInspectionsWithViolation, employees]);

    const violationsByType = useMemo(() => {
        const data = filteredInspectionsWithViolation
            .flatMap(i => i.violations || [])
            .reduce((acc, violationType) => {
                if(violationType) {
                   acc[violationType as ViolationType] = (acc[violationType as ViolationType] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredInspectionsWithViolation]);

    const PIE_COLORS = ['#FF8042', '#d946ef', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444' ];
    
    if (loading) {
        return <div className="text-center p-8">Cargando datos del dashboard...</div>;
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <DashboardCard title="Total de Empleados" value={employees.length} icon={<UserGroupIcon className="w-8 h-8 text-blue-500" />} colorClass="bg-blue-100" />
                <DashboardCard title="Total de Incidentes" value={incidents.length} icon={<ExclamationTriangleIcon className="w-8 h-8 text-red-500" />} colorClass="bg-red-100" />
                <DashboardCard title="Stock Total de EPP" value={totalPpeStock} icon={<ShieldCheckIcon className="w-8 h-8 text-green-500" />} colorClass="bg-green-100" />
                <DashboardCard title="Residuo Peligroso (30d)" value={`${hazardousWasteGenerated.toFixed(2)} Kg`} icon={<ArrowPathIcon className="w-8 h-8 text-purple-500" />} colorClass="bg-purple-100" />
                <DashboardCard title="Capacitaciones" value={trainings.length} icon={<AcademicCapIcon className="w-8 h-8 text-yellow-500" />} colorClass="bg-yellow-100" />
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-dark-text mb-4">Bienvenido al Sistema de Gestión EHS</h2>
                <p className="text-medium-text">
                    Utilice la navegación de la izquierda para gestionar los módulos. La sección de reportes le proporcionará una visión gráfica de todos los datos registrados.
                </p>
            </div>
            
            <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-dark-text">Análisis de Inspecciones de EPP</h2>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Desde:</label>
                            <input type="date" id="startDate" name="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-2 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">Hasta:</label>
                            <input type="date" id="endDate" name="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="ml-2 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                    </div>
                </div>

                 {filteredInspectionsWithViolation.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{minHeight: '400px'}}>
                        <div>
                            <h3 className="text-lg font-semibold text-dark-text text-center mb-2">Violaciones por Área</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={violationsByArea} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={70} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend verticalAlign="top" />
                                    <Bar dataKey="violaciones" fill="#ef4444" name="Nº de Violaciones" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-dark-text text-center mb-2">Tipos de Faltas de EPP</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie data={violationsByType} cx="50%" cy="50%" labelLine={false} outerRadius={140} fill="#8884d8" dataKey="value" nameKey="name" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {violationsByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} casos`, name]} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ right: -20, top: '25%' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 ) : (
                    <div className="text-center py-16 text-medium-text">
                        <p>No hay datos de violaciones para el período seleccionado.</p>
                        <p className="text-sm">Asegúrese de registrar inspecciones con violaciones o ajuste los filtros de fecha.</p>
                    </div>
                 )}
            </div>
            
             <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Últimos Incidentes</h3>
                    {incidents.slice(-5).reverse().map(incident => (
                        <div key={incident.id} className="border-b last:border-b-0 py-2">
                            <p className="font-semibold text-dark-text">{incident.machine_or_operation}</p>
                            <p className="text-sm text-medium-text">Fecha: {new Date(incident.date).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {incidents.length === 0 && <p className="text-medium-text">No hay incidentes registrados.</p>}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-dark-text mb-4">Próximas Capacitaciones (Próximos 15 días)</h3>
                     {upcomingTrainings.length > 0 ? (
                        upcomingTrainings.map(training => (
                             <div key={training.id} className="border-b last:border-b-0 py-2">
                                <p className="font-semibold text-dark-text">{training.topic}</p>
                                <p className="text-sm text-medium-text">Fecha: {new Date(training.date).toLocaleDateString()}</p>
                            </div>
                        ))
                     ) : (
                        <p className="text-medium-text">No hay capacitaciones programadas para los próximos 15 días.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;