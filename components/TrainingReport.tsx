import React from 'react';
import { Training, Employee, AppSettings } from '../types';

interface TrainingReportProps {
  training: Training;
  attendees: Employee[];
  appSettings: AppSettings;
}

const TrainingReport: React.FC<TrainingReportProps> = ({ training, attendees, appSettings }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="text-dark-text">
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-section-training, #print-section-training * {
                        visibility: visible;
                    }
                    #print-section-training {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        font-size: 10pt;
                    }
                    .no-print {
                        display: none;
                    }
                }
                `}
            </style>
            <div id="print-section-training" className="p-4">
                <header className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-16 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Constancia de Habilidades Laborales</h1>
                        <p className="text-gray-600">{appSettings?.company_name}</p>
                    </div>
                </header>

                <section className="mb-6">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Detalles de la Capacitación</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <p><strong>Curso/Tema:</strong> <span className="text-gray-900 font-medium">{training.topic}</span></p>
                        <p><strong>Tipo:</strong> <span className="text-gray-900 font-medium">{training.training_type}</span></p>
                        <p><strong>Fecha:</strong> <span className="text-gray-900 font-medium">{new Date(training.date + 'T00:00:00').toLocaleDateString()}</span></p>
                        <p><strong>Duración:</strong> <span className="text-gray-900 font-medium">{training.duration_hours} horas</span></p>
                        <p className="col-span-2"><strong>Instructor/Proveedor:</strong> <span className="text-gray-900 font-medium">{training.instructor}</span></p>
                    </div>
                </section>

                <section>
                     <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Lista de Asistentes</h2>
                     <table className="min-w-full text-sm mt-2 border-collapse border border-gray-400">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left p-2 font-semibold text-gray-600 border border-gray-400">Nombre Completo</th>
                                <th className="text-left p-2 font-semibold text-gray-600 border border-gray-400">Nº de Empleado</th>
                                <th className="text-left p-2 font-semibold text-gray-600 border border-gray-400">CURP</th>
                                <th className="text-left p-2 font-semibold text-gray-600 border border-gray-400 w-1/3">Firma</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendees.map(employee => (
                                <tr key={employee.id} className="border-b">
                                    <td className="p-2 border border-gray-400">{employee.name}</td>
                                    <td className="p-2 border border-gray-400">{employee.employee_number}</td>
                                    <td className="p-2 border border-gray-400">{employee.curp || 'N/A'}</td>
                                    <td className="p-2 border border-gray-400 h-12"></td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </section>

                 <footer className="pt-16 grid grid-cols-2 gap-16 text-center text-sm">
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 font-semibold text-gray-800">Firma del Instructor</p>
                        <p className="text-xs text-gray-700">{training.instructor}</p>
                    </div>
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 font-semibold text-gray-800">Firma del Responsable de EHS</p>
                    </div>
                </footer>

            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir
                </button>
            </div>
        </div>
    );
};

export default TrainingReport;
