import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth';
import { AppSettings } from '../types';
import * as db from '../services/db';

const Settings: React.FC = () => {
    const { appSettings, setAppSettingsState } = useAuth();
    const [tempSettings, setTempSettings] = useState<Partial<AppSettings>>({});
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (appSettings) {
            setTempSettings(appSettings);
        }
    }, [appSettings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempSettings(prev => ({ ...prev, company_logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTempSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const { id, ...settingsToUpdate } = tempSettings;

        const updatedSettings = await db.updateSettings(settingsToUpdate as Omit<AppSettings, 'id'>);

        if (updatedSettings) {
            setAppSettingsState(updatedSettings); // Update global state
            setFeedback('Configuración guardada exitosamente.');
            setTimeout(() => setFeedback(''), 3000);
        } else {
             alert(`Error al guardar la configuración.`);
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-dark-text mb-6">Configuración General del Sistema</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                            <input type="text" id="company_name" name="company_name" value={tempSettings.company_name || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                         <div>
                            <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input type="tel" id="company_phone" name="company_phone" value={tempSettings.company_phone || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="company_address" className="block text-sm font-medium text-gray-700">Dirección</label>
                            <textarea id="company_address" name="company_address" value={tempSettings.company_address || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Logotipo de la Empresa</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {tempSettings.company_logo ? (
                                    <img src={tempSettings.company_logo} alt="Logo Preview" className="mx-auto h-24 w-auto" />
                                ) : (
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="companyLogoFile" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                                        <span>Subir un archivo</span>
                                        <input id="companyLogoFile" name="companyLogoFile" type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">o arrastrar y soltar</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, SVG hasta 5MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end items-center">
                        {feedback && <p className="text-sm text-green-600 mr-4">{feedback}</p>}
                        <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Settings;