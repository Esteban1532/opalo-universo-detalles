"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Variante {
  url: string;
  etiqueta: string;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string | number;
  stock: number;
  imagen_url: string;
  categoria: string;
  galeria?: Variante[];
}

interface Venta {
  id: string;
  producto_nombre: string;
  cantidad: number;
  total: string | number;
  fecha: string;
}

// Nueva interfaz para los usuarios
interface UsuarioRegistrado {
  id: string | number;
  nombre: string;
  email: string;
}

const formatearCOP = (valor: number | string) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor));
};

export default function AdminDashboardSeguro() {
  const router = useRouter();
  
  const [verificando, setVerificando] = useState(true);
  const [usuarioAdmin, setUsuarioAdmin] = useState<{ nombre: string; email: string } | null>(null);
  const [adminVerificado, setAdminVerificado] = useState(false);
  const [estado2FA, setEstado2FA] = useState<'INICIAL' | 'ENVIADO'>('INICIAL');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [mensaje2FA, setMensaje2FA] = useState({ texto: '', tipo: '' });

  // Agregamos 'USUARIOS' a las vistas activas
  const [vistaActiva, setVistaActiva] = useState<'DASHBOARD' | 'NUEVO' | 'INVENTARIO' | 'HISTORIAL' | 'USUARIOS'>('DASHBOARD');
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [usuariosLista, setUsuariosLista] = useState<UsuarioRegistrado[]>([]); // Estado para usuarios

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [mensajeGlobal, setMensajeGlobal] = useState({ texto: '', tipo: '' });

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '', categoria: 'Tecnología' });
  const [editando, setEditando] = useState(false);

  // Estados para la galería de colores/diseños
  const [galeria, setGaleria] = useState<Variante[]>([]);
  const [nuevaImg, setNuevaImg] = useState({ url: '', etiqueta: '' });

  useEffect(() => {
    const sesion = localStorage.getItem('usuarioActivo');
    if (!sesion) { router.push('/'); return; }
    const usuario = JSON.parse(sesion);
    
    if (usuario.email !== 'opalouniversodedetalles@gmail.com') {
      alert("Acceso denegado: Esta zona es exclusiva para el administrador principal.");
      router.push('/'); return;
    }
    setUsuarioAdmin(usuario);

    const yaVerificado = localStorage.getItem('adminVerificado');
    if (yaVerificado === 'true') {
      setAdminVerificado(true);
    }

    setVerificando(false);
  }, [router]);

  const fetchData = async () => {
    setCargandoDatos(true);
    try {
      // Hacemos las 3 peticiones al mismo tiempo
      const [resProductos, resVentas, resUsuarios] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/ventas'),
        fetch('/api/usuarios')
      ]);

      if (resProductos.ok) {
        const dataProductos = await resProductos.json();
        setProductos(dataProductos);
      }
      
      if (resVentas.ok) {
        const dataVentas = await resVentas.json();
        setVentas(dataVentas);
      }

      if (resUsuarios.ok) {
        const dataUsuarios = await resUsuarios.json();
        setUsuariosLista(dataUsuarios);
      }
    } catch (error) {
      console.error("Error cargando los datos del dashboard");
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (adminVerificado) fetchData();
  }, [adminVerificado]);

  const solicitarCodigo = async () => {
    setMensaje2FA({ texto: 'Generando código de seguridad...', tipo: 'info' });
    try {
      const res = await fetch('/api/auth/enviar-codigo-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: usuarioAdmin?.email }) });
      if (res.ok) {
        setEstado2FA('ENVIADO');
        setMensaje2FA({ texto: '¡Código enviado! Revisa tu correo, SMS o terminal.', tipo: 'exito' });
      } else { setMensaje2FA({ texto: 'Error al generar el código.', tipo: 'error' }); }
    } catch (error) { setMensaje2FA({ texto: 'Error de conexión', tipo: 'error' }); }
  };

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje2FA({ texto: 'Verificando...', tipo: 'info' });
    try {
      const res = await fetch('/api/auth/verificar-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: usuarioAdmin?.email, codigo: codigoSeguridad }) });
      if (res.ok) { 
        localStorage.setItem('adminVerificado', 'true');
        setAdminVerificado(true); 
      } else { 
        setMensaje2FA({ texto: 'Código incorrecto, intenta de nuevo.', tipo: 'error' }); 
      }
    } catch (error) { setMensaje2FA({ texto: 'Error de conexión', tipo: 'error' }); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, esGaleria: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { 
        if (esGaleria) {
          setNuevaImg(prev => ({ ...prev, url: reader.result as string }));
        } else {
          setFormData(prev => ({ ...prev, imagen_url: reader.result as string })); 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const agregarAGaleria = () => {
    if (!nuevaImg.url || !nuevaImg.etiqueta) {
      alert("Sube una imagen y escribe una etiqueta para el color o diseño.");
      return;
    }
    setGaleria([...galeria, nuevaImg]);
    setNuevaImg({ url: '', etiqueta: '' });
  };

  const eliminarDeGaleria = (index: number) => {
    setGaleria(galeria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensajeGlobal({ texto: 'Guardando magia en Supabase...', tipo: 'info' });

    const url = editando ? `/api/productos/${formData.id}` : '/api/productos';
    const method = editando ? 'PUT' : 'POST';

    const imagenPrincipal = galeria.length > 0 ? galeria[0].url : formData.imagen_url;

    const payload = {
      ...formData,
      imagen_url: imagenPrincipal,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10),
      galeria: galeria.length > 0 ? galeria : [{ url: imagenPrincipal, etiqueta: 'Principal' }]
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMensajeGlobal({ texto: editando ? '¡Producto actualizado! ✨' : '¡Producto creado con éxito! ✨', tipo: 'exito' });
        setFormData({ id: '', nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '', categoria: 'Tecnología' });
        setGaleria([]);
        setEditando(false);
        fetchData(); 
        setTimeout(() => setVistaActiva('INVENTARIO'), 1500); 
      } else { setMensajeGlobal({ texto: 'Error al procesar la solicitud.', tipo: 'error' }); }
    } catch (error) { setMensajeGlobal({ texto: 'Error de conexión.', tipo: 'error' }); } 
    finally { setLoading(false); }
  };

  const iniciarEdicion = (producto: Producto) => {
    setFormData({
      id: producto.id, 
      nombre: producto.nombre, 
      descripcion: producto.descripcion,
      precio: Math.round(Number(producto.precio)).toString(),
      stock: producto.stock.toString(),
      imagen_url: producto.imagen_url, 
      categoria: producto.categoria
    });
    setGaleria(producto.galeria && producto.galeria.length > 0 ? producto.galeria : [{ url: producto.imagen_url, etiqueta: 'Principal' }]);
    setEditando(true);
    setVistaActiva('NUEVO');
  };

  const eliminarProducto = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta magia para siempre? 🧸💔")) return;
    try {
      const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMensajeGlobal({ texto: 'Producto eliminado correctamente.', tipo: 'exito' });
        fetchData();
      } else {
        setMensajeGlobal({ texto: 'Error al intentar eliminar el producto.', tipo: 'error' });
      }
    } catch (error) { setMensajeGlobal({ texto: 'Error de conexión.', tipo: 'error' }); }
  };

  const totalStock = productos.reduce((acc, curr) => acc + curr.stock, 0);
  const totalVentasDinero = ventas.reduce((acc, curr) => acc + Number(curr.total), 0);
  const totalProductosVendidos = ventas.reduce((acc, curr) => acc + curr.cantidad, 0);
  const productosBajoStock = productos.filter(p => p.stock < 5);

  if (verificando) return <div className="min-h-screen bg-[#FFF9F6] flex justify-center items-center font-bold text-purple-600">Verificando credenciales...</div>;

  return (
    <div className="min-h-screen bg-[#FFF9F6] font-sans text-slate-800 flex flex-col relative selection:bg-pink-200">
      
      <nav className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shadow-purple-200 border border-purple-100 flex-shrink-0">
                <img src="/logo.jpg" alt="Logo Ópalo" className="w-full h-full object-cover" />
              </div>

             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-50 to-purple-100 border border-purple-100 flex items-center justify-center shadow-sm shadow-purple-200 text-2xl flex-shrink-0">
                🧸
             </div>
             
             <div className="hidden sm:block">
               <span className="text-xl font-black tracking-tight text-purple-600 block leading-none">
                 UNIVERSO<span className="text-pink-400">DETALLES</span>
               </span>
               <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Centro de Comando 🛡️</span>
             </div>
            </div>
            <Link href="/" className="text-sm font-bold bg-pink-50 text-purple-700 px-5 py-2.5 rounded-2xl border border-pink-200 shadow-xs hover:bg-pink-100 transition-colors">🏠 Volver a la Tienda</Link>
          </div>
        </div>
      </nav>

      {!adminVerificado ? (
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-pink-100 p-8 md:p-10 text-center w-full max-w-lg animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">Seguridad Administrativa</h1>
            <p className="text-slate-500 mb-8">Esteban, ingresa tu llave temporal para acceder al centro de comando.</p>

            {mensaje2FA.texto && (
              <div className={`p-4 mb-6 rounded-2xl font-bold text-sm ${mensaje2FA.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>
                {mensaje2FA.texto}
              </div>
            )}

            {estado2FA === 'INICIAL' ? (
              <button onClick={solicitarCodigo} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-2xl shadow-md hover:scale-105 transition-all">
                Generar Código de Acceso
              </button>
            ) : (
              <form onSubmit={verificarCodigo} className="space-y-4">
                <input required type="text" value={codigoSeguridad} onChange={(e) => setCodigoSeguridad(e.target.value)} placeholder="000000" className="w-full bg-pink-50/30 border border-pink-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-400 text-center text-3xl font-black tracking-[0.5em] text-purple-700" maxLength={6} />
                <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-md hover:scale-105 transition-all">Verificar e Ingresar</button>
              </form>
            )}
          </div>
        </main>
      ) : (

        <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full animate-in fade-in duration-500">
          
          <div className="flex flex-wrap gap-3 mb-8 border-b border-pink-100 pb-4">
            <button onClick={() => setVistaActiva('DASHBOARD')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${vistaActiva === 'DASHBOARD' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}>📊 Resumen</button>
            <button onClick={() => { setVistaActiva('NUEVO'); setEditando(false); setFormData({ id: '', nombre: '', descripcion: '', precio: '', stock: '', imagen_url: '', categoria: 'Tecnología' }); setGaleria([]); setMensajeGlobal({texto:'', tipo:''}); }} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${vistaActiva === 'NUEVO' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}>🎁 {editando ? 'Editar Producto' : 'Nuevo Producto'}</button>
            <button onClick={() => setVistaActiva('INVENTARIO')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${vistaActiva === 'INVENTARIO' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}>📦 Inventario</button>
            <button onClick={() => setVistaActiva('HISTORIAL')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${vistaActiva === 'HISTORIAL' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}>🧾 Ventas</button>
            <button onClick={() => setVistaActiva('USUARIOS')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${vistaActiva === 'USUARIOS' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}>👥 Usuarios</button>
          </div>

          {mensajeGlobal.texto && (
            <div className={`p-4 mb-6 rounded-2xl text-center font-bold text-sm ${mensajeGlobal.tipo === 'error' ? 'bg-red-50 text-red-600' : mensajeGlobal.tipo === 'info' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {mensajeGlobal.texto}
            </div>
          )}

          {vistaActiva === 'DASHBOARD' && (
            <div className="space-y-6 animate-in slide-in-from-left-4">
              <h2 className="text-2xl font-black text-slate-800">Estadísticas Mágicas 📈</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-3">🛍️</div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Catálogo</p>
                  <p className="text-2xl font-black text-purple-700">{productos.length} items</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-3">📦</div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Stock Actual</p>
                  <p className="text-2xl font-black text-emerald-600">{totalStock} und</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-3">🛒</div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Vendidos</p>
                  <p className="text-2xl font-black text-blue-600">{totalProductosVendidos} und</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl mb-3">💰</div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Ingresos</p>
                  <p className="text-2xl font-black text-amber-600">{formatearCOP(totalVentasDinero)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl mb-3">👥</div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Clientes</p>
                  <p className="text-2xl font-black text-pink-600">{usuariosLista.length} reg.</p>
                </div>
              </div>

              {productosBajoStock.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mt-6">
                  <h3 className="text-red-700 font-black flex items-center gap-2 mb-4"><span>⚠️</span> Opalito alerta: Stock bajo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {productosBajoStock.map(p => (
                      <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm flex items-center gap-3 border border-red-100">
                        <img src={p.imagen_url} className="w-12 h-12 rounded-xl object-cover" />
                        <div><p className="text-xs font-bold text-slate-800 truncate">{p.nombre}</p><p className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full inline-block">Quedan {p.stock}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {vistaActiva === 'NUEVO' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-purple-100/50 border border-pink-100 p-8 md:p-10 animate-in slide-in-from-bottom-4">
              <div className="text-center mb-8">
                <span className="bg-emerald-50 text-emerald-600 font-bold text-xs uppercase px-4 py-1.5 rounded-full border border-emerald-100 mb-3 inline-block">✅ {editando ? 'Modo Edición' : 'Modo Creación'}</span>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{editando ? 'Actualizar Producto' : 'Crear Nueva Magia'}</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-pink-50/30 border border-pink-100 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300" placeholder="Nombre del Producto" />
                <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="w-full bg-pink-50/30 border border-pink-100 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 resize-none" placeholder="Descripción"></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="1" name="precio" value={formData.precio} onChange={handleChange} className="w-full bg-pink-50/30 border border-pink-100 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300" placeholder="Precio en COP" />
                  <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-pink-50/30 border border-pink-100 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300" placeholder="Stock Inicial" />
                </div>
                
                {/* GESTOR DE GALERÍA DE COLORES / DISEÑOS */}
                <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100 space-y-4">
                  <label className="block text-xs font-bold uppercase text-purple-700">🎨 Galería de Colores o Diseños</label>
                  
                  <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="file" accept="image/*" onChange={(e) => handleImageCapture(e, true)} className="text-xs font-bold text-slate-500 file:bg-purple-500 file:text-white file:border-0 file:py-2 file:px-3 file:rounded-xl cursor-pointer" />
                      <input type="text" placeholder="Ej: Color Rosa, Diseño Estrellas..." value={nuevaImg.etiqueta} onChange={(e) => setNuevaImg({ ...nuevaImg, etiqueta: e.target.value })} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs outline-none" />
                    </div>
                    {nuevaImg.url && (
                      <div className="flex items-center gap-3">
                        <img src={nuevaImg.url} className="w-12 h-12 object-cover rounded-xl border" />
                        <span className="text-xs text-slate-500">Vista previa lista</span>
                      </div>
                    )}
                    <button type="button" onClick={agregarAGaleria} className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 transition-colors">
                      ➕ Añadir Variante a la Galería
                    </button>
                  </div>

                  {galeria.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pt-2 pb-2">
                      {galeria.map((img, index) => (
                        <div key={index} className="relative flex-shrink-0 group">
                          <img src={img.url} className="w-20 h-20 object-cover rounded-2xl border-2 border-white shadow-sm" />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-2 rounded-full truncate max-w-[70px]">{img.etiqueta}</span>
                          <button type="button" onClick={() => eliminarDeGaleria(index)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold shadow-md hover:bg-red-600">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select 
                  name="categoria" 
                  value={formData.categoria} 
                  onChange={handleChange} 
                  className="w-full bg-pink-50/30 border border-pink-100 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-pink-300 font-bold text-slate-600"
                >
                  <option value="Peluches">🧸 Peluches</option>
                  <option value="Dulceria">🍬 Dulceria</option>
                  <option value="Maletas y Bolsos">🎒 Maletas y Bolsos</option>
                  <option value="Ropa Deportiva">🎽 Ropa Deportiva</option>
                  <option value="Mugs y Termos">🥤 Mugs y Termos</option>
                  <option value="Jugueteria">🎲 Jugueteria</option>
                  <option value="Cuidado personal">✨ Cuidado personal</option>
                  <option value="Tecnología">💻 Tecnología</option>
                </select>

                <button disabled={loading} type="submit" className="w-full mt-6 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold py-4 rounded-2xl hover:scale-105 transition-all shadow-md disabled:opacity-50">
                  {loading ? 'Procesando...' : (editando ? '💾 Guardar Cambios' : '✨ Publicar Producto')}
                </button>
              </form>
            </div>
          )}

          {vistaActiva === 'INVENTARIO' && (
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden animate-in slide-in-from-right-4">
              {cargandoDatos ? (
                <div className="p-12 text-center text-purple-600 font-bold animate-pulse">Cargando inventario...</div>
              ) : productos.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No hay productos registrados aún.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-50 text-purple-700 text-xs uppercase tracking-wider">
                        <th className="p-4 font-black">Producto</th>
                        <th className="p-4 font-black">Categoría</th>
                        <th className="p-4 font-black">Precio (COP)</th>
                        <th className="p-4 font-black">Stock</th>
                        <th className="p-4 font-black text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-pink-50">
                      {productos.map(p => (
                        <tr key={p.id} className="hover:bg-pink-50/30 transition-colors group">
                          <td className="p-4 flex items-center gap-3">
                            <img src={p.imagen_url} className="w-10 h-10 rounded-xl object-cover border border-pink-100" />
                            <span className="font-bold text-slate-800">{p.nombre}</span>
                          </td>
                          <td className="p-4"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">{p.categoria}</span></td>
                          <td className="p-4 font-bold text-slate-700">{formatearCOP(p.precio)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{p.stock} und</span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => iniciarEdicion(p)} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors" title="Editar">✏️</button>
                            <button onClick={() => eliminarProducto(p.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Eliminar">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {vistaActiva === 'HISTORIAL' && (
             <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6 md:p-10 animate-in slide-in-from-right-4">
               <div className="mb-6 flex justify-between items-end border-b border-pink-50 pb-4">
                 <div>
                   <h2 className="text-2xl font-black text-slate-800">Recibos de Venta 🧾</h2>
                   <p className="text-slate-500 text-sm">Historial cronológico de todos los ingresos.</p>
                 </div>
                 <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                   <span className="text-amber-700 font-bold text-sm">Total Histórico: {formatearCOP(totalVentasDinero)}</span>
                 </div>
               </div>
               
               {cargandoDatos ? (
                 <div className="p-12 text-center text-purple-600 font-bold animate-pulse">Cargando recibos...</div>
               ) : ventas.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                   <div className="text-4xl mb-3">🕸️</div>
                   <p>Aún no hay ventas registradas.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {ventas.map((venta) => (
                     <div key={venta.id} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-[#fafafa] relative hover:border-pink-300 transition-colors">
                       <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-[10px]">📌</div>
                       
                       <div className="text-center border-b border-slate-200 pb-3 mb-3 mt-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Universo Detalles</p>
                         <p className="text-xs text-slate-500">{new Date(venta.fecha).toLocaleString('es-CO')}</p>
                       </div>
                       
                       <div className="flex justify-between items-start mb-2">
                         <div className="pr-4">
                           <p className="text-sm font-bold text-slate-800 leading-tight">{venta.producto_nombre}</p>
                           <p className="text-xs text-slate-500 mt-1">Cant: {venta.cantidad}</p>
                         </div>
                       </div>
                       
                       <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center">
                         <span className="text-xs font-bold uppercase text-slate-400">Total Pago</span>
                         <span className="text-lg font-black text-emerald-600">{formatearCOP(venta.total)}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          )}

          {/* NUEVA VISTA DE USUARIOS */}
          {vistaActiva === 'USUARIOS' && (
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden animate-in slide-in-from-right-4">
              <div className="p-6 md:p-10 border-b border-pink-50">
                  <h2 className="text-2xl font-black text-slate-800">Directorio de Clientes 👥</h2>
                  <p className="text-slate-500 text-sm">Listado de todos los exploradores mágicos registrados en la tienda.</p>
              </div>
              
              {cargandoDatos ? (
                 <div className="p-12 text-center text-purple-600 font-bold animate-pulse">Cargando usuarios...</div>
              ) : usuariosLista.length === 0 ? (
                 <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                   <div className="text-4xl mb-3">👻</div>
                   <p>Aún no hay clientes registrados.</p>
                 </div>
              ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-purple-50 text-purple-700 text-xs uppercase tracking-wider">
                         <th className="p-4 font-black">ID</th>
                         <th className="p-4 font-black">Nombre del Cliente</th>
                         <th className="p-4 font-black">Correo Electrónico</th>
                       </tr>
                     </thead>
                     <tbody className="text-sm divide-y divide-pink-50">
                       {usuariosLista.map((u, index) => (
                         <tr key={u.id || index} className="hover:bg-pink-50/30 transition-colors">
                           <td className="p-4 text-xs font-bold text-slate-400 w-16">#{u.id}</td>
                           <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-200 to-purple-300 flex items-center justify-center text-purple-700 uppercase shadow-sm">
                               {u.nombre.charAt(0)}
                             </div>
                             {u.nombre}
                             {u.email === 'opalouniversodedetalles@gmail.com' && (
                               <span className="bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded-full font-black ml-2 uppercase">👑 Admin</span>
                             )}
                           </td>
                           <td className="p-4 text-slate-500 font-medium">{u.email}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              )}
            </div>
          )}

        </main>
      )}

      {adminVerificado && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-pink-200 shadow-xl px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 animate-bounce">
            <p className="flex items-center gap-2"><span>🧸</span> ¡Todo funcionando al 100%!</p>
          </div>
        </div>
      )}
    </div>
  );
}