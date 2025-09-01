import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../Auth';
import { BellIcon, ShieldExclamationIcon, ArchiveBoxIcon, WrenchScrewdriverIcon, BuildingOffice2Icon } from '../constants';
import { Notification, SafetyEquipment, SafetyInspectionLog } from '../types';

const getComprehensiveEquipmentStatus = (
    equipment: SafetyEquipment,
    allLogs: SafetyInspectionLog[]
): {
    statusText: 'En Regla' | 'Próximo a Vencer' | 'Vencido' | 'Nunca' | 'Atención Requerida';
    nextDate: Date | null;
    notes: string | null;
} => {
    const equipmentLogs = allLogs
        .filter(log => log.equipment_id === equipment.id)
        .sort((a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime());
    const latestLog = equipmentLogs[0];

    if (latestLog && (latestLog.status === 'Reparación Requerida' || latestLog.status === 'Reemplazo Requerido')) {
        return { statusText: 'Atención Requerida', nextDate: null, notes: `Último estado: ${latestLog.status}` };
    }
    if (!equipment.last_inspection_date) {
        return { statusText: 'Nunca', nextDate: null, notes: 'Nunca inspeccionado' };
    }
    const lastDate = new Date(equipment.last_inspection_date.includes('T') ? equipment.last_inspection_date : `${equipment.last_inspection_date}T00:00:00`);
    if (isNaN(lastDate.getTime())) return { statusText: 'Nunca', nextDate: null, notes: 'Fecha inválida' };
    
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + equipment.inspection_frequency);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return { statusText: 'Vencido', nextDate, notes: null };
    if (diffDays <= 7) return { statusText: 'Próximo a Vencer', nextDate, notes: null };
    
    return { statusText: 'En Regla', nextDate, notes: null };
};


const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser } = useAuth();
    const { 
        safetyEquipment, safetyInspectionLogs, ppeDeliveries, capas, 
        contractors, contractorDocuments, loading 
    } = useData();
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (loading || !currentUser) return;

        let generatedNotifications: Omit<Notification, 'isRead'>[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Safety Inspection Notifications
        safetyEquipment.forEach(eq => {
            const { statusText } = getComprehensiveEquipmentStatus(eq, safetyInspectionLogs);
            if (statusText === 'Vencido' || statusText === 'Próximo a Vencer' || statusText === 'Atención Requerida') {
                generatedNotifications.push({
                    id: `insp-${eq.id}`,
                    type: 'inspection',
                    title: `Inspección: ${statusText}`,
                    message: `${eq.name} - ${eq.location}`,
                    link: '/safety-inspections',
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // PPE Delivery Notifications for Admins
        if (currentUser.level === 'Administrador') {
            ppeDeliveries.filter(d => d.status === 'En espera').forEach(d => {
                generatedNotifications.push({
                    id: `pped-${d.id}`,
                    type: 'ppe_delivery',
                    title: 'Solicitud de EPP',
                    message: `Folio ${d.folio} requiere aprobación`,
                    link: '/ppe-deliveries',
                    timestamp: d.date
                });
            });
        }
        
        // CAPA notifications for assigned user
        capas.filter(c => c.responsible_user_id === currentUser.id && c.status === 'Abierta').forEach(c => {
             const commitmentDate = new Date(c.commitment_date);
             const diffDays = Math.ceil((commitmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
             if (diffDays <= 7) {
                  generatedNotifications.push({
                    id: `capa-${c.id}`,
                    type: 'capa',
                    title: `CAPA por Vencer: ${c.folio}`,
                    message: `Fecha compromiso en ${diffDays} días.`,
                    link: '/capa',
                    timestamp: c.creation_date
                });
             }
        });

        // Contractor Document Expiry Notifications
        contractorDocuments.forEach(doc => {
            const expiryDate = new Date(doc.expiry_date);
            const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
                const contractorName = contractors.find(c => c.id === doc.contractor_id)?.name || 'Contratista desconocido';
                generatedNotifications.push({
                    id: `contractor-doc-${doc.id}`,
                    type: 'contractor_document',
                    title: `Doc. por Vencer: ${contractorName}`,
                    message: `${doc.document_name} vence en ${diffDays} días.`,
                    link: '/contractors',
                    timestamp: new Date().toISOString()
                });
            }
        });


        // Merge with read status from local storage
        const readNotifIds: string[] = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const finalNotifications = generatedNotifications.map(n => ({
            ...n,
            isRead: readNotifIds.includes(n.id)
        }));
        
        setNotifications(finalNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    }, [loading, safetyEquipment, safetyInspectionLogs, ppeDeliveries, capas, contractors, contractorDocuments, currentUser]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        localStorage.setItem('read_notifications', JSON.stringify(allIds));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    
    const markAsRead = (id: string) => {
        const readNotifIds: string[] = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        if(!readNotifIds.includes(id)){
            const newReadIds = [...readNotifIds, id];
            localStorage.setItem('read_notifications', JSON.stringify(newReadIds));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };
    
    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return "Ahora";
    }

    const icons = {
        inspection: <ShieldExclamationIcon className="w-5 h-5 text-yellow-600" />,
        ppe_delivery: <ArchiveBoxIcon className="w-5 h-5 text-blue-500" />,
        capa: <WrenchScrewdriverIcon className="w-5 h-5 text-indigo-500" />,
        contractor_document: <BuildingOffice2Icon className="w-5 h-5 text-purple-500" />
    }

    return (
        <div className="relative" ref={notificationRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-500 hover:text-gray-700">
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Marcar todas como leídas</button>}
                    </div>
                    <ul className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                            <li key={n.id} className={`${!n.isRead ? 'bg-blue-50' : ''}`}>
                                <Link to={n.link} onClick={() => markAsRead(n.id)} className="flex items-start gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
                                     <span className="flex-shrink-0 mt-0.5">{icons[n.type as keyof typeof icons]}</span>
                                     <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{n.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{n.message}</p>
                                         <p className="text-xs text-gray-400 mt-1">{timeSince(n.timestamp)}</p>
                                     </div>
                                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0"></div>}
                                </Link>
                            </li>
                        )) : (
                            <li className="px-4 py-3 text-sm text-center text-gray-500">No hay notificaciones.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Notifications;