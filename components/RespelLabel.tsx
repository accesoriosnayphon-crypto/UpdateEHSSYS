import React from 'react';
import { useAuth } from '../Auth';
import { RespelRecord } from '../types';

interface RespelLabelProps {
  record: RespelRecord;
}

const CRETIB_TABLE_DATA: { key: keyof RespelRecord; label: string }[] = [
    { key: 'is_corrosive', label: 'Corrosivo' },
    { key: 'is_reactive', label: 'Reactivo' },
    { key: 'is_explosive', label: 'Explosivo' },
    { key: 'is_flammable', label: 'Inflamable' },
    { key: 'is_toxic', label: 'Tóxico' },
    { key: 'is_biologic', label: 'Biológico Infeccioso' },
];

const RespelLabel: React.FC<RespelLabelProps> = ({ record }) => {
    const { appSettings } = useAuth();
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section-label, #print-section-label * { visibility: visible; }
                    #print-section-label {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .label-container {
                        /* A5 size approx in inches for print scaling */
                        width: 5.8in;
                        height: 8.3in;
                        box-sizing: border-box;
                    }
                    .no-print { display: none; }
                }
            `}</style>
            <div id="print-section-label" className="flex justify-center items-center bg-gray-100 p-4">
                <div className="label-container bg-yellow-300 p-4 border-4 border-black flex flex-col space-y-3 font-sans text-black">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-5xl font-extrabold tracking-wide">RESIDUO PELIGROSO</h1>
                        <p className="text-sm font-semibold mt-1">SI LO ENCUENTRAS AVISE A SEGURIDAD PUBLICA O PROFEPA MAS CERCANA.</p>
                    </div>

                    {/* Waste Name */}
                    <div className="border-2 border-black p-2 text-center">
                        <label className="block text-left text-sm font-bold">Nombre del Residuo:</label>
                        <p className="text-3xl font-bold py-2">{record.waste_name.toUpperCase()}</p>
                    </div>

                    {/* Generator Info */}
                    <div>
                        <label className="block text-sm font-bold">Nombre del Generador:</label>
                        <div className="border-2 border-black p-2 font-semibold">
                           {appSettings?.company_name || 'Nombre de la empresa no configurado'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold">Dirección:</label>
                        <div className="border-2 border-black p-2 text-sm font-semibold">
                            {appSettings?.company_address || 'Dirección no configurada'}
                        </div>
                    </div>
                    
                    <div className="flex-grow flex items-stretch space-x-3">
                        {/* CRETIB Table */}
                        <table className="w-1/2 border-2 border-black border-collapse">
                            <tbody>
                                {CRETIB_TABLE_DATA.map(({ key, label }) => (
                                    <tr key={key}>
                                        <td className="border-2 border-black p-2 text-sm font-bold">{label}.</td>
                                        <td className="border-2 border-black w-12 text-center text-3xl font-black">
                                            {record[key as keyof RespelRecord] ? 'X' : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Warnings */}
                        <div className="w-1/2 flex flex-col justify-center items-center text-center space-y-4">
                            <p className="text-4xl font-extrabold">MANÉJESE<br/>CON<br/>CUIDADO!</p>
                            <p className="text-sm font-bold">No usar este recipiente ni su contenido.</p>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-bold">Fecha de Ingreso Almacén:</label>
                         <div className="border-b-2 border-black p-2 font-semibold text-xl text-center">
                             {new Date(record.creation_date + 'T00:00:00').toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
             <div className="flex justify-end pt-4 border-t mt-4 no-print">
                <button type="button" onClick={handlePrint} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    Imprimir Etiqueta
                </button>
            </div>
        </div>
    );
};

export default RespelLabel;