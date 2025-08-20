

import React from 'react';
import { useAuth } from '../Auth';
import { Incident, Employee } from '../types';

interface IncidentReportProps {
  incident: Incident;
  employee?: Employee | null;
}

const IncidentReport: React.FC<IncidentReportProps> = ({ incident, employee }) => {
    const { appSettings } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none; }
                }
            `}</style>
            <div id="print-section" className="p-4">
                <header className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-12 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Reporte de Investigación de Incidente</h1>
                        <p className="text-gray-600">{appSettings?.company_name || 'EHS Integral Management'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio</p>
                        <p className="text-red-600 font-mono text-xl">{incident.folio}</p>
                    </div>
                </header>

                <section className="mb-6">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Detalles del Evento</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <p><strong>Fecha:</strong> <span className="text-gray-900 font-medium">{new Date(incident.date).toLocaleDateString()}</span></p>
                        <p><strong>Hora:</strong> <span className="text-gray-900 font-medium">{incident.time}</span></p>
                        <p><strong>Tipo de Evento:</strong> <span className="text-gray-900 font-medium">{incident.event_type}</span></p>
                        <p><strong>Área/Lugar:</strong> <span className="text-gray-900 font-medium">{incident.area}</span></p>
                        <p><strong>Máquina/Operación:</strong> <span className="text-gray-900 font-medium">{incident.machine_or_operation}</span></p>
                    </div>
                </section>
                
                {employee && (
                    <section className="mb-6">
                        <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Empleado Involucrado</h2>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                            <p><strong>Nombre:</strong> <span className="text-gray-900 font-medium">{employee.name}</span></p>
                            <p><strong>Nº Empleado:</strong> <span className="text-gray-900 font-medium">{employee.employee_number}</span></p>
                            <p><strong>Puesto:</strong> <span className="text-gray-900 font-medium">{employee.position}</span></p>
                            <p><strong>Área/Depto:</strong> <span className="text-gray-900 font-medium">{employee.department}</span></p>
                        </div>
                    </section>
                )}

                <section className="mb-6">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Descripción y Tratamiento</h2>
                    <div>
                        <h3 className="font-semibold mt-2 text-gray-800">Descripción del suceso:</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold mt-4 text-gray-800">Tratamiento o procedimiento aplicado:</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.treatment}</p>
                    </div>
                </section>

                {incident.evidence_image_url && (
                    <section className="mb-8">
                        <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Evidencia Fotográfica</h2>
                        <img src={incident.evidence_image_url} alt="Evidencia del incidente" className="mt-2 max-w-full md:max-w-md mx-auto rounded-lg shadow-md" />
                    </section>
                )}

                <footer className="pt-12 mt-8 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-800">Firma del Investigador / Supervisor</p>
                    </div>
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-800">Firma del Empleado (si aplica)</p>
                    </div>
                </footer>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Reporte
                </button>
            </div>
        </div>
    );
};

export default IncidentReport;