import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useDebounce } from '../hooks/useDebounce';
import { MagnifyingGlassIcon, UserGroupIcon, ExclamationTriangleIcon, ShieldCheckIcon, ShieldExclamationIcon } from '../constants';

const GlobalSearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { employees, incidents, ppeItems, safetyEquipment, loading } = useData();
    const navigate = useNavigate();
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const searchResults = useMemo(() => {
        if (loading || !debouncedSearchTerm || debouncedSearchTerm.length < 2) {
            return [];
        }

        const lowerCaseTerm = debouncedSearchTerm.toLowerCase();

        const employeeResults = employees
            .filter(e => e.name.toLowerCase().includes(lowerCaseTerm) || e.employee_number.includes(lowerCaseTerm))
            .slice(0, 3)
            .map(e => ({
                type: 'Empleados',
                id: e.id,
                title: e.name,
                subtitle: `Nº ${e.employee_number}`,
                link: '/employees',
                icon: <UserGroupIcon className="w-5 h-5 text-blue-500" />
            }));

        const incidentResults = incidents
            .filter(i => i.folio.toLowerCase().includes(lowerCaseTerm) || i.description.toLowerCase().includes(lowerCaseTerm))
            .slice(0, 3)
            .map(i => ({
                type: 'Incidentes',
                id: i.id,
                title: `Folio ${i.folio}`,
                subtitle: i.description,
                link: '/incidents',
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            }));
            
        const ppeResults = ppeItems
            .filter(p => p.name.toLowerCase().includes(lowerCaseTerm))
            .slice(0, 3)
            .map(p => ({
                type: 'Inventario EPP',
                id: p.id,
                title: p.name,
                subtitle: `Stock: ${p.stock}`,
                link: '/ppe-inventory',
                icon: <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            }));

        const safetyEquipmentResults = safetyEquipment
            .filter(s => s.name.toLowerCase().includes(lowerCaseTerm) || s.location.toLowerCase().includes(lowerCaseTerm))
            .slice(0, 3)
            .map(s => ({
                type: 'Equipos de Seguridad',
                id: s.id,
                title: s.name,
                subtitle: s.location,
                link: '/safety-inspections',
                icon: <ShieldExclamationIcon className="w-5 h-5 text-yellow-600" />
            }));

        return [
            ...employeeResults,
            ...incidentResults,
            ...ppeResults,
            ...safetyEquipmentResults,
        ];
    }, [debouncedSearchTerm, employees, incidents, ppeItems, safetyEquipment, loading]);

    const groupedResults = useMemo(() => {
        return searchResults.reduce((acc, result) => {
            if (!acc[result.type]) {
                acc[result.type] = [];
            }
            acc[result.type].push(result);
            return acc;
        }, {} as Record<string, typeof searchResults>);
    }, [searchResults]);

    const handleResultClick = () => {
        setSearchTerm('');
        setIsFocused(false);
    };

    return (
        <div className="relative w-full" ref={searchContainerRef}>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Buscar en todo el sistema..."
                    className="block w-full rounded-md border-0 bg-gray-100 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                />
            </div>

            {isFocused && debouncedSearchTerm.length > 1 && (
                <div className="absolute z-20 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {loading && <p className="px-4 py-2 text-sm text-gray-500">Buscando...</p>}
                        {!loading && searchResults.length === 0 && (
                             <p className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados para "{debouncedSearchTerm}".</p>
                        )}
                        {Object.entries(groupedResults).map(([group, results]) => (
                            <div key={group}>
                                <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{group}</h3>
                                {results.map(result => (
                                     <Link
                                        key={`${result.type}-${result.id}`}
                                        to={result.link}
                                        onClick={handleResultClick}
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <span className="flex-shrink-0">{result.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{result.title}</p>
                                            <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
