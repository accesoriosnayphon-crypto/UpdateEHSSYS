import React from 'react';
import { useAuth } from '../Auth';
import { RespelRecord, UserProfile } from '../types';

type RespelRecordWithDetails = RespelRecord & {
    generatorUser?: UserProfile;
};

interface RespelDocumentProps {
  record: RespelRecordWithDetails;
}

const RespelDocument: React.FC<RespelDocumentProps> = ({ record }) => {
    const { appSettings } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="text-dark-text">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-respel, #print-section-respel * { visibility: visible; }
                    #print-section-respel { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 1.5rem; 
                        font-size: 10pt;
                    }
                    .no-print { display: none; }
                }
            `}</style>
            <div id="print-section-respel" className="p-4">
                <header className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-16 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">FORMATO DE MANEJO DE RESIDUOS PELIGROSOS (RESPEL)</h1>
                        <p className="text-gray-600 font-semibold">{appSettings?.company_name}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio: <span className="text-primary font-mono">{record.folio}</span></p>
                        <p className="mt-1 font-bold text-lg">Fecha: <span className="font-normal">{new Date(record.creation_date).toLocaleDateString()}</span></p>
                    </div>
                </header>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">1. Identificación del Residuo</h2>
                    <table className="min-w-full text-sm">
                        <tbody>
                            <tr className="border-b"><td className="font-semibold p-2 w-1/3">Nombre del Residuo:</td><td className="p-2">{record.waste_name}</td></tr>
                            <tr className="border-b"><td className="font-semibold p-2">Descripción / Composición:</td><td className="p-2">{record.waste_description}</td></tr>
                            <tr className="border-b"><td className="font-semibold p-2">Tipo de Residuo:</td><td className="p-2">{record.waste_type}</td></tr>
                            <tr className="border-b"><td className="font-semibold p-2">Cantidad Generada:</td><td className="p-2">{record.quantity} {record.unit}</td></tr>
                            <tr className="border-b"><td className="font-semibold p-2">Área de Generación:</td><td className="p-2">{record.area}</td></tr>
                        </tbody>
                    </table>
                </section>
                
                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">2. Información de Disposición</h2>
                     <table className="min-w-full text-sm">
                        <tbody>
                            <tr className="border-b"><td className="font-semibold p-2 w-1/3">Proveedor/Empresa de Disposición:</td><td className="p-2">{record.disposal_provider}</td></tr>
                            <tr className="border-b"><td className="font-semibold p-2">Generado por (Usuario):</td><td className="p-2">{record.generatorUser?.full_name || 'N/A'}</td></tr>
                        </tbody>
                    </table>
                </section>

                <section className="mb-4">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">3. Notas Adicionales</h2>
                    <div className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 p-3 border rounded min-h-[5rem]">
                        {record.notes || 'No hay notas adicionales.'}
                    </div>
                </section>

                <footer className="pt-16 grid grid-cols-2 gap-16 text-center text-sm">
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Nombre y Firma del Generador</p>
                        <p className="text-xs text-gray-700">{record.generatorUser?.full_name || '________________'}</p>
                    </div>
                    <div>
                        <hr className="border-gray-400 mb-2"/>
                        <p className="font-semibold text-gray-800">Nombre y Firma del Transportista / Receptor</p>
                        <p className="text-xs text-gray-700">{record.disposal_provider || '________________'}</p>
                    </div>
                </footer>

            </div>
            <div className="flex justify-end pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Formato
                </button>
            </div>
        </div>
    );
};

export default RespelDocument;
