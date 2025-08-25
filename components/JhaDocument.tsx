import React from 'react';
import { useAuth } from '../Auth';
import { JhaWithSteps } from '../types';

interface JhaDocumentProps {
  jha: JhaWithSteps;
}

const JhaDocument: React.FC<JhaDocumentProps> = ({ jha }) => {
    const { appSettings } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    const getRiskLevelClass = (level: string) => {
        switch (level) {
            case 'Alto': return 'bg-red-100 text-red-800';
            case 'Medio': return 'bg-yellow-100 text-yellow-800';
            case 'Bajo': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-jha, #print-section-jha * { visibility: visible; }
                    #print-section-jha { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                    .no-print { display: none; }
                }
            `}</style>
            <div id="print-section-jha" className="p-4">
                <header className="text-center border-b pb-4 mb-4">
                    {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-16 w-auto mx-auto mb-4" />}
                    <h1 className="text-2xl font-bold text-gray-900">Análisis de Trabajo Seguro (ATS)</h1>
                    <p className="text-gray-600">{appSettings?.company_name || 'EHS Integral Management'}</p>
                </header>
                
                <section className="mb-4 p-2 border rounded-md">
                     <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><strong>Tarea/Trabajo:</strong> <span className="font-normal">{jha.title}</span></div>
                        <div><strong>Área/Depto:</strong> <span className="font-normal">{jha.area}</span></div>
                        <div><strong>Fecha de Análisis:</strong> <span className="font-normal">{new Date(jha.creation_date).toLocaleDateString()}</span></div>
                     </div>
                </section>

                <section>
                    <table className="min-w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-primary-dark text-white">
                            <tr>
                                <th className="border border-gray-300 p-2 w-1/4">Secuencia de Pasos del Trabajo</th>
                                <th className="border border-gray-300 p-2 w-1/4">Peligros Potenciales</th>
                                <th className="border border-gray-300 p-2 w-2/4">Acciones o Procedimientos de Control Recomendados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jha.steps.map((step, stepIndex) => (
                                <tr key={step.id}>
                                    <td className="border border-gray-300 p-2 align-top">
                                        <strong>{stepIndex + 1}.</strong> {step.description}
                                    </td>
                                    <td className="border border-gray-300 p-0 align-top">
                                        <table className="min-w-full h-full"><tbody>
                                        {step.hazards.map(hazard => (
                                            <tr key={hazard.id} className="border-b last:border-b-0"><td className="p-2">{hazard.description}</td></tr>
                                        ))}
                                        </tbody></table>
                                    </td>
                                    <td className="border border-gray-300 p-0 align-top">
                                        <table className="min-w-full h-full"><tbody>
                                        {step.hazards.map(hazard => (
                                            <tr key={hazard.id} className="border-b last:border-b-0">
                                                <td className="p-2 w-3/4">{hazard.controls}</td>
                                                <td className={`p-2 w-1/4 text-center font-bold ${getRiskLevelClass(hazard.risk_level)}`}>
                                                    {hazard.risk_level}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody></table>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                
                 <footer className="pt-16 grid grid-cols-2 gap-16 text-center text-sm">
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 font-semibold text-gray-800">Realizado por (Nombre y Firma)</p>
                    </div>
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 font-semibold text-gray-800">Revisado y Aprobado por (Nombre y Firma)</p>
                    </div>
                </footer>

            </div>
            <div className="flex justify-end pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Documento
                </button>
            </div>
        </div>
    );
};

export default JhaDocument;