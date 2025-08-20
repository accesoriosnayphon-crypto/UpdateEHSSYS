import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import { Employee } from '../types';
import { CheckCircleIcon } from '../constants';

interface EmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (newEmployees: Omit<Employee, 'id'>[]) => void;
  existingEmployeeNumbers: string[];
}

type ParsedEmployee = {
    employee_number?: string;
    name?: string;
    department?: string;
    position?: string;
}

const EmployeeImportModal: React.FC<EmployeeImportModalProps> = ({ isOpen, onClose, onComplete, existingEmployeeNumbers }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedEmployee[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{ added: number; skipped: number; invalid: number } | null>(null);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setParsedData([]);
        setError(null);
        setImportResult(null);
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = ['employee_number', 'name', 'department', 'position'];
        const ws = XLSX.utils.json_to_sheet([{}], { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
        XLSX.writeFile(wb, 'plantilla_empleados.xlsx');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setError(null);
            setFile(selectedFile);
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json: ParsedEmployee[] = XLSX.utils.sheet_to_json(worksheet, {
                         header: ["employee_number", "name", "department", "position"],
                         range: 1 // Skip header row in data
                    });

                    if (json.length === 0) {
                        setError('El archivo está vacío o no tiene el formato correcto.');
                        return;
                    }

                    // Ensure employeeNumber is treated as string
                    const formattedJson = json.map(row => ({
                        ...row,
                        employee_number: row.employee_number ? String(row.employee_number) : undefined
                    }));

                    setParsedData(formattedJson);
                    setStep(2);
                } catch (err) {
                    setError('Error al procesar el archivo. Asegúrese de que es un archivo .xlsx válido.');
                    console.error(err);
                }
            };
            reader.onerror = () => {
                 setError('No se pudo leer el archivo.');
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleConfirmImport = () => {
        const newEmployees: Omit<Employee, 'id'>[] = [];
        let skipped = 0;
        let invalid = 0;

        const existingNumbersSet = new Set(existingEmployeeNumbers);

        parsedData.forEach(row => {
            const { employee_number, name, department, position } = row;
            if (employee_number && name && department && position) {
                if (existingNumbersSet.has(employee_number)) {
                    skipped++;
                } else {
                    newEmployees.push({ employee_number, name, department, position });
                    existingNumbersSet.add(employee_number); // Add to set to handle duplicates within the same file
                }
            } else {
                invalid++;
            }
        });

        onComplete(newEmployees);
        setImportResult({ added: newEmployees.length, skipped, invalid });
        setStep(3);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1: // Upload
                return (
                    <div className="space-y-4">
                        <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                            <h3 className="font-bold text-blue-800">Paso 1: Preparar y Subir Archivo</h3>
                            <p className="text-sm text-blue-700">
                                Descargue la plantilla para asegurar el formato correcto. Llene el archivo y súbalo aquí.
                            </p>
                        </div>
                        <button type="button" onClick={handleDownloadTemplate} className="w-full text-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                            Descargar Plantilla .xlsx
                        </button>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subir archivo completado</label>
                            <input type="file" accept=".xlsx" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark" />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );
            case 2: // Preview
                return (
                    <div className="space-y-4">
                        <div className="p-4 border-l-4 border-green-500 bg-green-50">
                            <h3 className="font-bold text-green-800">Paso 2: Previsualizar y Confirmar</h3>
                            <p className="text-sm text-green-700">
                               Revise los datos a continuación. Los empleados con un número de empleado que ya existe serán omitidos.
                            </p>
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                             <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Nº Empleado</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Nombre</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Departamento</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {parsedData.slice(0, 5).map((row, index) => (
                                        <tr key={index}>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.employee_number}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.name}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.department}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <p className="text-sm text-center text-gray-500">
                            Se encontraron <span className="font-bold">{parsedData.length}</span> registros. Se muestra una vista previa de los primeros 5.
                        </p>
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Volver</button>
                            <button type="button" onClick={handleConfirmImport} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Confirmar Importación</button>
                        </div>
                    </div>
                );
             case 3: // Result
                return (
                    <div className="text-center space-y-4 py-8">
                         <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
                        <h3 className="text-2xl font-bold text-dark-text">Importación Completa</h3>
                        <p className="text-medium-text">
                            <span className="font-semibold text-green-600">{importResult?.added}</span> empleados agregados.
                        </p>
                         <p className="text-sm text-medium-text">
                            <span className="font-semibold text-yellow-600">{importResult?.skipped}</span> duplicados omitidos.
                        </p>
                        <p className="text-sm text-medium-text">
                            <span className="font-semibold text-red-600">{importResult?.invalid}</span> filas inválidas ignoradas.
                        </p>
                        <button type="button" onClick={resetState} className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Cerrar</button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetState} title="Importar Empleados desde Excel">
            {renderStepContent()}
        </Modal>
    );
};

export default EmployeeImportModal;