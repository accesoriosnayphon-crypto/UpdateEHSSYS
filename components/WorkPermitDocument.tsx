import React from 'react';
import { useAuth } from '../Auth';
import { WorkPermit, User, Jha, Employee } from '../types';

interface WorkPermitDocumentProps {
  permit: WorkPermit;
  users: User[];
  jhas: Jha[];
  employees: Employee[];
}

const WorkPermitDocument: React.FC<WorkPermitDocumentProps> = ({ permit, users, jhas, employees }) => {
    const { appSettings } = useAuth();
    
    const handlePrint = () => {
        window.print();
    };
    
    const getStatusClass = (status: string) => {
        switch(status) {
            case 'Aprobado': return 'bg-green-100 text-green-800 border-green-300';
            case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Cerrado': return 'bg-gray-200 text-gray-800 border-gray-300';
            case 'Rechazado': return 'bg-red-100 text-red-800 border-red-300';
            case 'Solicitado': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const requester = employees.find(u => u.id === permit.requester_employee_id);
    const approver = users.find(u => u.id === permit.approver_user_id);
    const closer = users.find(u => u.id === permit.closer_user_id);
    const linkedJha = jhas.find(j => j.id === permit.jha_id);

    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-permit, #print-section-permit * { visibility: visible; }
                    #print-section-permit { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-size: 10px; }
                    .no-print { display: none; }
                    .print-bg-transparent { background-color: transparent !important; }
                    #print-section-permit section, #print-section-permit footer { break-inside: avoid; }
                }
            `}</style>
            <div id="print-section-permit" className="p-4">
                <header className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-12 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Permiso de Trabajo de Alto Riesgo</h1>
                        <p className="text-gray-600">{appSettings?.company_name || 'EHS Integral Management'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio: <span className="text-primary font-mono">{permit.folio}</span></p>
                        <p className={`mt-1 font-bold text-lg border p-1 rounded-md ${getStatusClass(permit.status)} print-bg-transparent`}>{permit.status.toUpperCase()}</p>
                    </div>
                </header>
                
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">1. Información General</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Título del Trabajo:</strong> {permit.title}</div>
                        <div><strong>Tipo de Permiso:</strong> {permit.type}</div>
                        <div><strong>Ubicación:</strong> {permit.location}</div>
                        <div><strong>Tipo de Trabajo:</strong> {permit.work_type}</div>
                        <div><strong>Válido Desde:</strong> {permit.valid_from ? new Date(permit.valid_from).toLocaleString() : 'N/A'}</div>
                        <div><strong>Válido Hasta:</strong> {permit.valid_to ? new Date(permit.valid_to).toLocaleString() : 'N/A'}</div>
                        <div className="col-span-2"><strong>JHA Vinculado:</strong> {linkedJha ? `${linkedJha.title} (${linkedJha.area})` : 'N/A'}</div>
                    </div>
                </section>
                
                {permit.work_type === 'Externo' && (
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">1A. Información del Contratista</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Empresa Contratista:</strong> {permit.provider_name || 'N/A'}</div>
                        <div className="col-span-2"><strong>Datos Generales:</strong> {permit.provider_details || 'N/A'}</div>
                    </div>
                </section>
                )}
                
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">2. Descripción del Trabajo</h2>
                    <p className="text-sm whitespace-pre-wrap">{permit.description}</p>
                </section>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">3. Personal Autorizado y Verificaciones</h2>
                    <table className="min-w-full text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left p-2 font-semibold text-gray-600 uppercase border border-gray-300">Nombre del Trabajador</th>
                                {permit.type === 'Trabajo en Altura' && (
                                    <>
                                        <th className="text-left p-2 font-semibold text-gray-600 uppercase border border-gray-300">Presión Arterial</th>
                                        <th className="text-left p-2 font-semibold text-gray-600 uppercase border border-gray-300">Apto para Trabajar</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {(permit.authorized_workers || []).length > 0 ? (
                                permit.authorized_workers.map(worker => (
                                    <tr key={worker.id} className="border-b">
                                        <td className="p-2 border border-gray-300">{worker.name}</td>
                                        {permit.type === 'Trabajo en Altura' && (
                                            <>
                                                <td className="p-2 border border-gray-300">{worker.blood_pressure || 'No Registrado'}</td>
                                                <td className="p-2 border border-gray-300">{worker.is_fit === null ? 'No Registrado' : (worker.is_fit ? 'Sí, Apto' : 'No Apto')}</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={permit.type === 'Trabajo en Altura' ? 3 : 1} className="p-2 text-center text-gray-500">
                                        No hay trabajadores autorizados especificados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <section className="mb-4">
                     <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">4. Precauciones de Seguridad</h2>
                     <div className="grid grid-cols-2 gap-x-6 text-sm">
                         <div>
                            <h3 className="font-semibold mb-1">Equipo a Utilizar:</h3>
                            <ul className="list-disc list-inside">
                                {(permit.equipment || []).length > 0 ? permit.equipment.map((item, i) => <li key={i}>{item}</li>) : <li>Ninguno especificado.</li>}
                            </ul>
                         </div>
                         <div>
                            <h3 className="font-semibold mb-1">EPP Requerido:</h3>
                            <ul className="list-disc list-inside">
                                {(permit.ppe || []).length > 0 ? permit.ppe.map((item, i) => <li key={i}>{item}</li>) : <li>Ninguno especificado.</li>}
                            </ul>
                         </div>
                     </div>
                </section>
                
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">5. Autorizaciones</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Solicitado por:</strong> {requester?.name || 'N/A'}</div>
                        <div><strong>Fecha de Solicitud:</strong> {new Date(permit.request_date).toLocaleDateString()}</div>
                        <div><strong>Aprobado por:</strong> {approver?.full_name || 'Pendiente'}</div>
                        <div><strong>Cerrado por:</strong> {closer?.full_name || 'Pendiente'}</div>
                    </div>
                </section>

                {permit.status === 'Cerrado' && (
                    <section className="mb-4">
                        <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">6. Revisión Final y Cierre</h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><strong>¿Hubo algún accidente o incidente?:</strong> {permit.final_review_accident === null ? 'No registrado' : (permit.final_review_accident ? 'Sí' : 'No')}</div>
                            <div className="col-span-2"><strong>Comentarios / Observaciones de Cierre:</strong></div>
                            <div className="col-span-2 text-sm whitespace-pre-wrap bg-gray-50 p-2 border rounded print-bg-transparent">
                                {permit.final_review_comments || 'Sin comentarios.'}
                            </div>
                        </div>
                    </section>
                )}

                 <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">7. Notas de Seguridad Importantes</h2>
                    <ul className="text-xs text-gray-700 list-disc list-inside space-y-1">
                        <li>Todo trabajo de alto riesgo deberá ser autorizado por el jefe del área donde se realizará y/o por el responsable de Seguridad e Higiene.</li>
                        <li>El personal debe estar capacitado y calificado para realizar la tarea de manera segura.</li>
                        <li>Se debe inspeccionar todo el equipo, herramientas y EPP antes de iniciar el trabajo. Cualquier equipo defectuoso debe ser retirado de servicio.</li>
                        <li>Este permiso debe permanecer visible en el área de trabajo durante toda la duración de la tarea.</li>
                    </ul>
                </section>
                
                <footer className="pt-12 mt-8 space-y-8 text-center text-sm">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-4">Firmas de Trabajadores Autorizados</h3>
                        <div className="grid grid-cols-3 gap-x-12 gap-y-8">
                            {(permit.authorized_workers || []).map((worker) => (
                                <div key={worker.id}>
                                    <hr className="border-gray-400 mb-2"/>
                                    <p className="text-xs">{worker.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-16">
                        <div>
                            <hr className="border-gray-400 mb-2"/>
                            <p className="font-semibold text-gray-800">Firma de Aprobación (Seguridad)</p>
                             <p className="text-xs">{approver?.full_name || '________________'}</p>
                        </div>
                        <div>
                            <hr className="border-gray-400 mb-2"/>
                            <p className="font-semibold text-gray-800">Firma de Cierre</p>
                             <p className="text-xs">{closer?.full_name || '________________'}</p>
                        </div>
                    </div>
                </footer>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Permiso
                </button>
            </div>
        </div>
    );
};

export default WorkPermitDocument;