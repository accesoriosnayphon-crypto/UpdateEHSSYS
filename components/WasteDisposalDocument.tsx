
import React from 'react';
import { useAuth } from '../Auth';
import { WasteLog, Waste, User } from '../types';

interface WasteDisposalDocumentProps {
  log: WasteLog;
  waste: Waste;
  recordedByUser: User | null;
}

const WasteDisposalDocument: React.FC<WasteDisposalDocumentProps> = ({ log, waste, recordedByUser }) => {
    const { appSettings } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    const getWasteTypeClass = (type: string) => {
        switch(type) {
            case 'Peligroso': return 'bg-red-100 text-red-800 border-red-300';
            case 'Reciclable': return 'bg-green-100 text-green-800 border-green-300';
            case 'No Peligroso': return 'bg-gray-100 text-gray-800 border-gray-300';
            default: return 'bg-gray-100';
        }
    };
    
    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-waste, #print-section-waste * { visibility: visible; }
                    #print-section-waste { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-size: 10px; }
                    .no-print { display: none; }
                    .print-bg-transparent { background-color: transparent !important; }
                }
            `}</style>
            <div id="print-section-waste" className="p-4">
                <header className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-12 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Manifiesto de Disposición de Residuos</h1>
                        <p className="text-gray-600">{appSettings?.company_name || 'EHS Integral Management'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio: <span className="text-primary font-mono">{log.folio}</span></p>
                        <p className="mt-1 font-bold text-lg">Fecha: <span className="font-normal">{new Date(log.date).toLocaleDateString()}</span></p>
                    </div>
                </header>
                
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">1. Detalles del Residuo</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Nombre del Residuo:</strong> {waste.name}</div>
                        <div>
                            <strong>Tipo:</strong> 
                            <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getWasteTypeClass(waste.type)} print-bg-transparent`}>
                                {waste.type}
                            </span>
                        </div>
                        <div><strong>Cantidad Dispuesta:</strong> {log.quantity} {log.unit}</div>
                        <div><strong>Método de Disposición:</strong> {waste.disposal_method}</div>
                    </div>
                </section>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">2. Información del Transporte y Disposición</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div><strong>Empresa Transportista:</strong> {log.disposal_company || 'N/A'}</div>
                        <div><strong>Nº de Manifiesto Externo:</strong> {log.manifest_number || 'N/A'}</div>
                        <div><strong>Costo de Disposición:</strong> {log.cost !== undefined && log.cost !== null ? `$${log.cost.toFixed(2)} USD` : 'N/A'}</div>
                        <div><strong>Registrado por:</strong> {recordedByUser?.full_name || 'N/A'}</div>
                    </div>
                </section>
                
                {log.manifest_url && (
                    <section className="mb-4">
                        <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">3. Documento de Manifiesto Adjunto</h2>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                            {log.manifest_url.startsWith('data:application/pdf') ? (
                                 <iframe src={log.manifest_url} className="w-full h-96" title="Manifiesto PDF"></iframe>
                            ) : log.manifest_url.startsWith('data:image/') ? (
                                <img src={log.manifest_url} alt="Manifiesto" className="max-w-full max-h-96 mx-auto object-contain" />
                            ) : (
                                <a href={log.manifest_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline p-4 block">
                                    Ver documento adjunto
                                </a>
                            )}
                        </div>
                    </section>
                )}
                
                <footer className="pt-12 mt-8 grid grid-cols-2 gap-16 text-center text-sm">
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Firma del Generador (Empresa)</p>
                        <p className="text-xs">{recordedByUser?.full_name || '________________'}</p>
                    </div>
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Firma del Transportista</p>
                        <p className="text-xs">{log.disposal_company || '________________'}</p>
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

export default WasteDisposalDocument;