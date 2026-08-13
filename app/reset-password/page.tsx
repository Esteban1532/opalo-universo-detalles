"use client";
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function FormularioReset() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMensaje({ texto: 'Falta el token de seguridad', tipo: 'error' });
      return;
    }

    setCargando(true);
    setMensaje({ texto: 'Actualizando contraseña...', tipo: 'info' });

    try {
      const res = await fetch('/api/auth/resetear-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      if (res.ok) {
        setMensaje({ texto: '¡Contraseña actualizada! Redirigiendo...', tipo: 'exito' });
        setTimeout(() => router.push('/'), 2000); // Vuelve al inicio tras 2 segundos
      } else {
        const err = await res.json();
        setMensaje({ texto: err.error || 'Error al actualizar', tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  if (!token) {
    return <div className="p-8 text-center text-red-500 font-bold">Enlace inválido o sin token.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input 
        required 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Nueva contraseña" 
        className="w-full p-4 border border-purple-200 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-purple-400" 
      />
      
      {mensaje.texto && (
        <div className={`p-3 rounded-xl text-xs font-bold ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <button disabled={cargando} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl shadow-md transition-all disabled:opacity-50">
        {cargando ? 'Guardando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F6] p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 max-w-md w-full relative">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Nueva Contraseña 🔑</h1>
        <p className="text-slate-500 text-sm mb-6">Ingresa tu nueva clave mágica a continuación.</p>
        <Suspense fallback={<div className="text-purple-500 font-bold text-center">Cargando formulario...</div>}>
          <FormularioReset />
        </Suspense>
      </div>
    </div>
  );
}