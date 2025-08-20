
import React from 'react';
import { useAuth } from '../Auth';
import { PpeDelivery, Employee, PpeItem, UserProfile } from '../types';

interface DeliveryReceiptProps {
  delivery: PpeDelivery;
  employee?: Employee;
  ppeItem?: PpeItem;
}

const DeliveryReceipt: React.FC<DeliveryReceiptProps> = ({ delivery, employee, ppeItem }) => {
    const { appSettings, currentUser } = useAuth();

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
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
                `}
            </style>
            <div id="print-section" className="p-4">
                <header className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                        {appSettings?.company_logo && <img src={appSettings.company_logo} alt={`${appSettings.company_name} Logo`} className="h-12 w-auto mb-2" />}
                        <h1 className="text-2xl font-bold text-gray-900">Comprobante de Entrega de EPP</h1>
                        <p className="text-gray-600">{appSettings?.company_name || 'EHS Integral Management'}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">Folio</p>
                        <p className="text-primary font-mono text-xl">{delivery.folio}</p>
                    </div>
                </header>

                <section className="mb-6">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Datos del Empleado</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <p><strong>Nombre:</strong> <span className="text-gray-900 font-medium">{employee?.name || 'No encontrado'}</span></p>
                        <p><strong>Nº Empleado:</strong> <span className="text-gray-900 font-medium">{employee?.employee_number || 'N/A'}</span></p>
                        <p><strong>Puesto:</strong> <span className="text-gray-900 font-medium">{employee?.position || 'N/A'}</span></p>
                        <p><strong>Área/Depto:</strong> <span className="text-gray-900 font-medium">{employee?.department || 'N/A'}</span></p>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Detalles de la Entrega</h2>
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left p-2 font-semibold text-gray-600 uppercase">Cantidad</th>
                                <th className="text-left p-2 font-semibold text-gray-600 uppercase">EPP Entregado</th>
                                <th className="text-left p-2 font-semibold text-gray-600 uppercase">Tipo / Talla</th>
                                <th className="text-left p-2 font-semibold text-gray-600 uppercase">Tipo de Entrega</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2 font-medium text-gray-900">{delivery.quantity}</td>
                                <td className="p-2 font-medium text-gray-900">{ppeItem?.name || 'No encontrado'}</td>
                                <td className="p-2 text-gray-700">{ppeItem ? `${ppeItem.type} / ${ppeItem.size}` : 'N/A'}</td>
                                <td className="p-2 text-gray-700">{delivery.delivery_type}</td>
                            </tr>
                        </tbody>
                    </table>
                     <div className="grid grid-cols-2 gap-x-4 mt-2 text-sm text-gray-700">
                        <p><strong>Fecha de Entrega:</strong> <span className="text-gray-900 font-medium">{new Date(delivery.date).toLocaleDateString()}</span></p>
                        <p><strong>Fecha de Renovación:</strong> <span className="text-gray-900 font-medium">{delivery.renewal_date ? new Date(delivery.renewal_date).toLocaleDateString() : 'N/A'}</span></p>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold border-b mb-2 pb-1 text-gray-900">Notas Legales y Responsabilidades</h2>
                    <p className="text-xs text-gray-700">
                        El empleado abajo firmante reconoce haber recibido el Equipo de Protección Personal (EPP) descrito anteriormente, en perfectas condiciones y de acuerdo a las políticas de seguridad de la empresa. El empleado se compromete a utilizar el EPP de manera correcta, a mantenerlo en buen estado, y a reportar cualquier daño o pérdida de inmediato. El no cumplimiento de estas normas puede resultar en acciones disciplinarias.
                    </p>
                </section>

                <footer className="pt-12 grid grid-cols-2 gap-8 text-center">
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-800">Firma del Empleado</p>
                        <p className="text-xs text-gray-700">{employee?.name}</p>
                    </div>
                    <div>
                        <hr className="border-gray-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-800">Firma del Responsable de Entrega</p>
                        <p className="text-xs text-gray-700">{currentUser?.full_name || 'N/A'}</p>
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

export default DeliveryReceipt;