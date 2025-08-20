import React from 'react';
import { useAuth } from '../Auth';
import { AuditWithFindings, UserProfile } from '../types';

interface AuditReportProps {
  audit: AuditWithFindings;
  users: UserProfile[];
}

const AuditReport: React.FC<AuditReportProps> = ({ audit, users }) => {
    const { appSettings } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    const leadAuditor = users.find(u => u.id === audit.lead_auditor_id);
    const auditTeam = (audit.auditor_ids || []).map(id => users.find(u => u.id === id)?.full_name).filter(Boolean);
    
    const getFindingTypeClass = (type: string) => {
        switch (type) {
            case 'No Conformidad': return 'bg-red-100 text-red-800 border-red-300';
            case 'Observación': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Oportunidad de Mejora': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-audit, #print-section-audit * { visibility: visible; }
                    #print-section-audit { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-size: 10px; }
                    .no-print { display: none; }
                    .print-bg-transparent { background-color: transparent !important; }
                }
            `}</style>
            <div id="print-section-audit" className="p-4">
                <header className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-12 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Reporte de Auditoría</h1>
                        <p className="text-gray-600">{appSettings?.company_name}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio: <span className="text-primary font-mono">{audit.folio}</span></p>
                    </div>
                </header>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">1. Detalles de la Auditoría</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Título:</strong> {audit.title}</div>
                        <div><strong>Norma de Referencia:</strong> {audit.standard}</div>
                        <div><strong>Fecha de Inicio:</strong> {new Date(audit.start_date).toLocaleDateString()}</div>
                        <div><strong>Fecha de Fin:</strong> {new Date(audit.end_date).toLocaleDateString()}</div>
                        <div className="col-span-2"><strong>Alcance:</strong> {audit.scope}</div>
                        <div><strong>Auditor Líder:</strong> {leadAuditor?.full_name || 'N/A'}</div>
                        <div><strong>Equipo Auditor:</strong> {auditTeam.join(', ')}</div>
                    </div>
                </section>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">2. Hallazgos de la Auditoría</h2>
                    <table className="min-w-full border-collapse border border-gray-300 text-sm mt-2">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase w-[25%]">Tipo / Severidad</th>
                                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase w-[40%]">Descripción del Hallazgo</th>
                                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Referencia</th>
                                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {audit.findings && audit.findings.length > 0 ? audit.findings.map(finding => (
                                <tr key={finding.id}>
                                    <td className={`border p-2 font-semibold ${getFindingTypeClass(finding.type)} print-bg-transparent`}>
                                        {finding.type}
                                        {finding.type === 'No Conformidad' && ` (${finding.severity})`}
                                    </td>
                                    <td className="border p-2">{finding.description}</td>
                                    <td className="border p-2">{finding.reference}</td>
                                    <td className="border p-2">{finding.status}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="border p-2 text-center text-gray-500">No se registraron hallazgos para esta auditoría.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
                
                <footer className="pt-12 mt-8 grid grid-cols-2 gap-16 text-center text-sm">
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Firma del Auditor Líder</p>
                        <p className="text-xs">{leadAuditor?.full_name || '________________'}</p>
                    </div>
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Firma del Representante de la Dirección</p>
                        <p className="text-xs">________________</p>
                    </div>
                </footer>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Reporte
                </button>
            </div>
        </div>
    );
};

export default AuditReport;