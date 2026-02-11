'use client';

import { useState } from 'react';

export function AuthScreen({ onAuth }: { onAuth: (s: string) => void }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) { setError('Digite a chave'); return; }
    onAuth(secret);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Admin</h1>
        <p className="text-gray-400 mb-6">Digite a chave de acesso</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Chave..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button type="submit" className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors">
            Acessar
          </button>
        </form>
      </div>
    </div>
  );
}
