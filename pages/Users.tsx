

import React, { useState, useEffect, useCallback } from 'react';
import { UserLevel, Permission, PERMISSIONS, UserProfile } from '../types';
import Modal from '../components/Modal';
import { PencilIcon, TrashIcon } from '../constants';
import { useAuth } from '../Auth';
import * as db from '../services/db';
import { useData } from '../contexts/DataContext';

const UserForm: React.FC<{
    onSave: (user: Omit<UserProfile, 'id'>, id: string | null) => void;
    onClose: () => void;
    initialData: UserProfile | null;
    allUsers: UserProfile[];
}> = ({ onSave, onClose, initialData, allUsers }) => {
    const [email, setEmail] = useState('');
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [level, setLevel] = useState<UserLevel>('Operador');
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setEmail(initialData.email || '');
            setEmployeeNumber(initialData.employee_number || '');
            setFullName(initialData.full_name || '');
            setLevel(initialData.level as UserLevel);
            setPermissions(initialData.permissions || []);
        } else {
            setEmail('');
            setEmployeeNumber('');
            setFullName('');
            setLevel('Operador');
            setPermissions([]);
        }
    }, [initialData]);

    const handlePermissionChange = (permissionId: Permission) => {
        setPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !employeeNumber || !fullName) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        if (!initialData && allUsers.some(u => u.email === email)) {
            alert('Ya existe un usuario con este correo electrónico.');
            return;
        }

        const profileData: Omit<UserProfile, 'id'> = { 
            employee_number: employeeNumber, 
            full_name: fullName, 
            level, 
            permissions, 
            email 
        };
        onSave(profileData, initialData ? initialData.id : null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={!!initialData} />
                {initialData && <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar después de la creación.</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Empleado</label>
                    <input type="text" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
            </div>
            <p className="text-sm text-gray-500">La contraseña para el inicio de sesión local puede ser cualquier valor.</p>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nivel de Usuario</label>
                <select value={level} onChange={e => setLevel(e.target.value as UserLevel)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md text-dark-text">
                    <option className="text-dark-text">Administrador</option>
                    <option className="text-dark-text">Supervisor</option>
                    <option className="text-dark-text">Operador</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Permisos del Usuario</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border rounded-md max-h-48 overflow-y-auto">
                    {PERMISSIONS.map(p => (
                        <label key={p.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100">
                            <input
                                type="checkbox"
                                checked={permissions.includes(p.id)}
                                onChange={() => handlePermissionChange(p.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">{p.label}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar Usuario</button>
            </div>
        </form>
    );
};

const Users: React.FC = () => {
    const { users, loading, refreshData } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const { hasPermission, currentUser } = useAuth();

    const handleSaveUser = async (profileData: Omit<UserProfile, 'id'>, id: string | null) => {
        if (id) {
            await db.updateUser(id, profileData);
        } else {
             alert("La creación de nuevos usuarios no está soportada en este modo de demostración.");
             return;
        }

        refreshData();
        setIsModalOpen(false);
        setEditingUser(null);
    };
    
    const handleAddNew = () => {
        alert("La creación de nuevos usuarios no está soportada en este modo de demostración. Por favor, edite un usuario existente.");
    };

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string) => {
       if (userId === currentUser?.id) {
           alert("No puedes eliminar tu propio usuario.");
           return;
       }
       if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.')) {
           await db.deleteUser(userId);
           refreshData();
       }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-text">Gestión de Usuarios</h2>
                {hasPermission('manage_users') && (
                    <button onClick={handleAddNew} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                        + Agregar Usuario
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Empleado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                            {hasPermission('manage_users') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {loading ? (
                           <tr><td colSpan={5} className="text-center py-4">Cargando...</td></tr>
                       ) : users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{user.employee_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.level}</td>
                                {hasPermission('manage_users') && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900" title="Modificar">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900" title="Eliminar" disabled={user.id === currentUser?.id}>
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {users.length === 0 && !loading &&(
                            <tr>
                                <td colSpan={hasPermission('manage_users') ? 5 : 4} className="text-center py-4 text-gray-500">
                                    No hay perfiles de usuario.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasPermission('manage_users') && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Modificar Usuario' : 'Agregar Nuevo Usuario'}>
                    <UserForm onSave={handleSaveUser} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} initialData={editingUser} allUsers={users}/>
                </Modal>
            )}
        </div>
    );
};

export default Users;