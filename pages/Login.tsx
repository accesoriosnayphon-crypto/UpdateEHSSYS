

import React, { useState } from 'react';
import { useAuth } from '../Auth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { error: authError } = await auth.login(email, password);
            if (authError) {
                 if (authError.message === 'Invalid login credentials') {
                    setError('Email o contraseña incorrectos.');
                } else {
                    setError(`Error: ${authError.message}`);
                }
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError('Ocurrió un error inesperado al intentar iniciar sesión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-light-bg">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="text-3xl font-bold text-center text-primary">EHS Manager</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">Inicia sesión para continuar</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-t-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Dirección de Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white rounded-b-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;