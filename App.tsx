

import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Route, Routes, NavLink, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import PPE from './pages/PPE';
import Incidents from './pages/Incidents';
import Training from './pages/Training';
import Inspections from './pages/Inspections';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Login from './pages/Login';
import SafetyInspections from './pages/SafetyInspections';
import Activities from './pages/Activities';
import RiskManagement from './pages/RiskManagement';
import Chemicals from './pages/Chemicals';
import WorkPermits from './pages/WorkPermits';
import WasteManagement from './pages/WasteManagement';
import Settings from './pages/Settings';
import Audits from './pages/Audits';
import History from './pages/History';
import CAPA from './pages/CAPA';
import { AuthProvider, useAuth } from './Auth';
import { HomeIcon, UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon, AcademicCapIcon, ChartBarIcon, ClipboardDocumentCheckIcon, UsersIcon, ArrowLeftOnRectangleIcon, ShieldExclamationIcon, CalendarDaysIcon, DocumentMagnifyingGlassIcon, VialIcon, BriefcaseIcon, ArrowPathIcon, Cog6ToothIcon, DocumentCheckIcon, ArchiveBoxIcon, WrenchScrewdriverIcon, ChevronDownIcon } from './constants';
import { Permission } from './types';

const navLinkGroups = [
    {
        name: 'Principal',
        links: [
            { permission: 'view_dashboard' as Permission, path: '/', label: 'Dashboard', icon: <HomeIcon className="w-6 h-6" /> },
        ]
    },
    {
        name: 'Gestión Humana',
        links: [
            { permission: 'manage_employees' as Permission, path: '/employees', label: 'Empleados', icon: <UserGroupIcon className="w-6 h-6" /> },
            { permission: 'manage_trainings' as Permission, path: '/training', label: 'Capacitaciones', icon: <AcademicCapIcon className="w-6 h-6" /> },
            { permission: 'view_history' as Permission, path: '/history', label: 'Historial', icon: <ArchiveBoxIcon className="w-6 h-6" /> },
        ]
    },
    {
        name: 'Operaciones EHS',
        links: [
            { permission: 'manage_ppe' as Permission, path: '/ppe', label: 'EPP', icon: <ShieldCheckIcon className="w-6 h-6" /> },
            { permission: 'manage_inspections' as Permission, path: '/inspections', label: 'Insp. EPP', icon: <ClipboardDocumentCheckIcon className="w-6 h-6" /> },
            { permission: 'manage_safety_inspections' as Permission, path: '/safety-inspections', label: 'Insp. de Seguridad', icon: <ShieldExclamationIcon className="w-6 h-6" /> },
            { permission: 'manage_chemicals' as Permission, path: '/chemicals', label: 'Inventario Químico', icon: <VialIcon className="w-6 h-6" /> },
            { permission: 'manage_waste' as Permission, path: '/waste-management', label: 'Gestión de Residuos', icon: <ArrowPathIcon className="w-6 h-6" /> },
        ]
    },
    {
        name: 'Análisis y Planificación',
        links: [
            { permission: 'manage_incidents' as Permission, path: '/incidents', label: 'Incidentes', icon: <ExclamationTriangleIcon className="w-6 h-6" /> },
            { permission: 'manage_jha' as Permission, path: '/risk-management', label: 'Gestión de Riesgos', icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" /> },
            { permission: 'manage_work_permits' as Permission, path: '/work-permits', label: 'Permisos de Trabajo', icon: <BriefcaseIcon className="w-6 h-6" /> },
            { permission: 'manage_activities' as Permission, path: '/activities', label: 'Actividades', icon: <CalendarDaysIcon className="w-6 h-6" /> },
            { permission: 'manage_audits' as Permission, path: '/audits', label: 'Auditorías', icon: <DocumentCheckIcon className="w-6 h-6" /> },
            { permission: 'manage_capa' as Permission, path: '/capa', label: 'Acciones CAPA', icon: <WrenchScrewdriverIcon className="w-6 h-6" /> },
            { permission: 'view_reports' as Permission, path: '/reports', label: 'Reportes', icon: <ChartBarIcon className="w-6 h-6" /> },
        ]
    },
     {
        name: 'Administración',
        links: [
            { permission: 'manage_users' as Permission, path: '/users', label: 'Usuarios', icon: <UsersIcon className="w-6 h-6" /> },
            { permission: 'manage_settings' as Permission, path: '/settings', label: 'Ajustes', icon: <Cog6ToothIcon className="w-6 h-6" /> },
        ]
    }
];

const NavGroup: React.FC<{group: typeof navLinkGroups[0], availableLinks: typeof navLinkGroups[0]['links']}> = ({ group, availableLinks }) => {
    const [isOpen, setIsOpen] = useState(group.name === 'Principal');

    if (availableLinks.length === 0) return null;

    return (
        <div>
            {group.name !== 'Principal' && (
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left px-3 py-2 text-xs font-bold uppercase text-gray-400 hover:text-white">
                    <span>{group.name}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}
            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                {availableLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/'}
                        className={({ isActive }) => 
                            `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-sm hover:bg-primary-dark/50 ${isActive ? 'bg-primary-dark' : ''}`
                        }
                    >
                        {link.icon}
                        <span className="ml-3">{link.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}

const Sidebar: React.FC = () => {
  const { hasPermission, logout, currentUser, appSettings } = useAuth();
  
  const availableGroups = useMemo(() => {
    return navLinkGroups.map(group => ({
        ...group,
        links: group.links.filter(link => hasPermission(link.permission))
    })).filter(group => group.links.length > 0);
  }, [hasPermission]);

  return (
    <div className="w-64 bg-primary text-white flex flex-col flex-shrink-0">
       <div className="p-4 text-center border-b border-primary-dark">
        {appSettings?.company_logo ? 
            <img src={appSettings.company_logo} alt="Logo" className="h-12 mx-auto mb-2" /> 
            : null
        }
        <h1 className="text-xl font-bold">{appSettings?.company_name || 'EHS Manager'}</h1>
      </div>
      <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
        {availableGroups.map((group) => (
           <NavGroup key={group.name} group={group} availableLinks={group.links} />
        ))}
      </nav>
      <div className="p-4 border-t border-primary-dark">
            <div className="text-center mb-2">
                <p className="text-sm font-semibold truncate" title={currentUser?.full_name || ''}>{currentUser?.full_name}</p>
                <p className="text-xs opacity-75">{currentUser?.level}</p>
            </div>
            <button
                onClick={logout}
                className="flex items-center justify-center w-full p-3 my-2 rounded-lg transition-colors duration-200 bg-red-500 hover:bg-red-600"
            >
                <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                <span className="ml-4">Cerrar Sesión</span>
            </button>
        </div>
    </div>
  );
};

const Header: React.FC = () => {
    const location = useLocation();
    const currentLink = navLinkGroups.flatMap(g => g.links).find(link => link.path === location.pathname);
    const title = currentLink ? currentLink.label : 'Dashboard';

    return (
        <header className="bg-white shadow-md p-4">
            <h1 className="text-2xl font-bold text-dark-text">{title}</h1>
        </header>
    );
}

const ProtectedLayout: React.FC = () => {
    const { hasPermission } = useAuth();
    return (
        <div className="flex h-screen bg-light-bg">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 p-6 overflow-y-auto">
                    <Routes>
                        {hasPermission('view_dashboard') && <Route path="/" element={<Dashboard />} />}
                        {hasPermission('manage_employees') && <Route path="/employees" element={<Employees />} />}
                        {hasPermission('manage_ppe') && <Route path="/ppe" element={<PPE />} />}
                        {hasPermission('manage_incidents') && <Route path="/incidents" element={<Incidents />} />}
                        {hasPermission('manage_trainings') && <Route path="/training" element={<Training />} />}
                        {hasPermission('manage_inspections') && <Route path="/inspections" element={<Inspections />} />}
                        {hasPermission('manage_safety_inspections') && <Route path="/safety-inspections" element={<SafetyInspections />} />}
                        {hasPermission('manage_jha') && <Route path="/risk-management" element={<RiskManagement />} />}
                        {hasPermission('manage_chemicals') && <Route path="/chemicals" element={<Chemicals />} />}
                        {hasPermission('manage_work_permits') && <Route path="/work-permits" element={<WorkPermits />} />}
                        {hasPermission('manage_waste') && <Route path="/waste-management" element={<WasteManagement />} />}
                        {hasPermission('manage_activities') && <Route path="/activities" element={<Activities />} />}
                        {hasPermission('manage_audits') && <Route path="/audits" element={<Audits />} />}
                        {hasPermission('manage_capa') && <Route path="/capa" element={<CAPA />} />}
                        {hasPermission('manage_users') && <Route path="/users" element={<Users />} />}
                        {hasPermission('view_reports') && <Route path="/reports" element={<Reports />} />}
                        {hasPermission('manage_settings') && <Route path="/settings" element={<Settings />} />}
                        {hasPermission('view_history') && <Route path="/history" element={<History />} />}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-light-bg">
                <div role="status" className="flex flex-col items-center">
                    <svg aria-hidden="true" className="w-12 h-12 text-gray-300 animate-spin fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                    <span className="text-lg font-semibold text-medium-text mt-4">Conectando...</span>
                </div>
            </div>
        );
    }
    
    return (
         <Routes>
            {!currentUser ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </>
            ) : (
                <Route path="/*" element={<ProtectedLayout />} />
            )}
        </Routes>
    )
}

const App: React.FC = () => {
  return (
    <HashRouter>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </HashRouter>
  );
};

export default App;