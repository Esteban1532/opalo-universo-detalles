"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface ItemCarrito extends Producto {
  cantidad: number;
  varianteSeleccionada: string;
  imagenVariante: string;
}

const formatearCOP = (valor: number | string) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor));
};

// COMPONENTE TARJETA CON CARRUSEL DE IMÁGENES Y PARSEOBINDADO
function ProductoCard({ producto, agregarAlCarrito, usuarioActivo }: { producto: Producto, agregarAlCarrito: Function, usuarioActivo: any }) {
  const [indiceImg, setIndiceImg] = useState(0);

  // 1. Parsear la galería de forma segura (maneja tanto arreglos como strings JSON de la base de datos)
  let galeriaArray: Variante[] = [];
  try {
    if (typeof producto.galeria === 'string') {
      galeriaArray = JSON.parse(producto.galeria);
    } else if (Array.isArray(producto.galeria)) {
      galeriaArray = producto.galeria;
    }
  } catch (e) {
    galeriaArray = [];
  }

  // 2. Filtrar imágenes válidas que tengan una URL real
  const imagenesValidas = galeriaArray.filter(
    item => item && typeof item.url === 'string' && item.url.trim() !== ''
  );

  // 3. Si hay galería válida, se usa; si no, se busca la imagen_url principal, o un placeholder neutral
  const listaFinal = imagenesValidas.length > 0 
    ? imagenesValidas 
    : (producto.imagen_url && producto.imagen_url.trim() !== '' 
        ? [{ url: producto.imagen_url, etiqueta: 'Principal' }] 
        : [{ url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=60', etiqueta: 'Disponible' }]);

  const imagenActual = listaFinal[indiceImg]?.url || listaFinal[0].url;
  const etiquetaActual = listaFinal[indiceImg]?.etiqueta || 'Principal';

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceImg((prev) => (prev + 1) % listaFinal.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceImg((prev) => (prev - 1 + listaFinal.length) % listaFinal.length);
  };

  return (
    <div className="bg-white rounded-3xl border border-pink-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-pink-300 transition-all duration-300 flex flex-col group">
      <div className="h-60 overflow-hidden bg-pink-50/50 relative">
        <img 
          src={imagenActual} 
          alt={producto.nombre} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-purple-600 shadow-xs border border-pink-100">
          {producto.categoria}
        </span>

        {/* ETIQUETA DE LA VARIANTE ACTUAL */}
        <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap">
          {etiquetaActual}
        </span>

        {/* FLECHAS DEL CARRUSEL */}
        {listaFinal.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center text-purple-700 font-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center text-purple-700 font-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100">›</button>
          </>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{producto.nombre}</h3>
        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-grow">{producto.descripcion}</p>
        <div className="flex justify-between items-center pt-4 border-t border-pink-50 mb-4">
          <span className="text-xl font-black text-purple-700">{formatearCOP(producto.precio)}</span>
          <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Stock: {producto.stock}</span>
        </div>
        <button 
          onClick={() => agregarAlCarrito(producto, listaFinal[indiceImg])}
          disabled={producto.stock <= 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-2xl hover:opacity-95 shadow-md shadow-pink-200 transition-all hover:scale-105 disabled:opacity-50"
        >
          {producto.stock > 0 ? (usuarioActivo ? '🛒 Agregar al Carrito' : '🔒 Iniciar Sesión para Comprar') : 'Agotado'}
        </button>
      </div>
    </div>
  );
}

export default function TiendaInteractivaTierna() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [toastNotificacion, setToastNotificacion] = useState('');
  
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [modalCarritoAbierto, setModalCarritoAbierto] = useState(false);
  const [modalWhatsAppAbierto, setModalWhatsAppAbierto] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');

  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalLogin, setModalLogin] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false); // Estado para el modal de recuperación
  
  const [formAuth, setFormAuth] = useState({ nombre: '', email: '', password: '' });
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [mensajeRecuperar, setMensajeRecuperar] = useState({ texto: '', tipo: '' });

  const [mensajeAuth, setMensajeAuth] = useState({ texto: '', tipo: '' });
  const [usuarioActivo, setUsuarioActivo] = useState<{ nombre: string; email: string; esAdmin: boolean } | null>(null);
  
  const [mensajeOpalito, setMensajeOpalito] = useState("¡Hola! Inicia sesión para desbloquear tu carrito mágico 🌟");
  const [mostrarOpalitoBubble, setMostrarOpalitoBubble] = useState(true);

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuarioActivo');
    if (sesionGuardada) {
      const parsedUser = JSON.parse(sesionGuardada);
      setUsuarioActivo(parsedUser);
      setNombreCliente(parsedUser.nombre || '');
    }

    const carritoGuardado = localStorage.getItem('carritoCompras');
    if (carritoGuardado) setCarrito(JSON.parse(carritoGuardado));

    const fetchProductos = async () => {
      try {
        const res = await fetch('/api/productos');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProductos(data);
            if (data.length > 0) setMensajeOpalito(`¡Tenemos ${data.length} tesoros listos para ti! 🧸`);
          } else {
            setProductos([]);
          }
        }
      } catch (error) {
        console.error("Error al cargar productos");
      } finally {
        setCargando(false);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    localStorage.setItem('carritoCompras', JSON.stringify(carrito));
  }, [carrito]);

  const mostrarToast = (texto: string) => {
    setToastNotificacion(texto);
    setTimeout(() => { setToastNotificacion(''); }, 3000);
  };

  const agregarAlCarrito = (producto: Producto, varianteInfo: Variante) => {
    if (!usuarioActivo) {
      setModalLogin(true);
      setMensajeAuth({ texto: '🔒 Debes iniciar sesión para usar el carrito de compras', tipo: 'error' });
      return;
    }

    setCarrito(prev => {
      const idUnicoCarrito = `${producto.id}-${varianteInfo.etiqueta}`;
      const existe = prev.find(item => `${item.id}-${item.varianteSeleccionada}` === idUnicoCarrito);
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          mostrarToast("⚠️ ¡Stock máximo alcanzado!");
          return prev;
        }
        return prev.map(item => `${item.id}-${item.varianteSeleccionada}` === idUnicoCarrito ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...producto, cantidad: 1, varianteSeleccionada: varianteInfo.etiqueta, imagenVariante: varianteInfo.url }];
    });
    mostrarToast(`✨ ¡${producto.nombre} (${varianteInfo.etiqueta}) añadido al carrito!`);
    setMensajeOpalito(`¡Excelente elección! ${producto.nombre} es precioso 💖`);
  };

  const cambiarCantidad = (idUnico: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (`${item.id}-${item.varianteSeleccionada}` === idUnico) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 && nuevaCant <= item.stock ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (idUnico: string) => {
    setCarrito(prev => prev.filter(item => `${item.id}-${item.varianteSeleccionada}` !== idUnico));
    mostrarToast("🗑️ Producto retirado del carrito");
  };

  const totalCarrito = carrito.reduce((acc, curr) => acc + (Number(curr.precio) * curr.cantidad), 0);
  const totalArticulos = carrito.reduce((acc, curr) => acc + curr.cantidad, 0);

  const productosFiltrados = Array.isArray(productos) 
    ? (categoriaActiva === 'Todos' ? productos : productos.filter(p => p.categoria.toLowerCase() === categoriaActiva.toLowerCase()))
    : [];

  const enviarPedidoWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return;

    const detalle = carrito.map(i => `• ${i.nombre} [${i.varianteSeleccionada}] (x${i.cantidad}) - ${formatearCOP(Number(i.precio) * i.cantidad)}`).join('%0A');
    
    const textoWhatsApp = `¡Hola! 👋 Me gustaría hacer un pedido en *Universo Detalles*:%0A%0A` +
      `👤 *Cliente:* ${nombreCliente || 'No especificado'}%0A` +
      `📍 *Dirección/Ciudad:* ${direccionCliente || 'No especificada'}%0A%0A` +
      `🛍️ *Productos:*%0A${detalle}%0A%0A` +
      `💰 *Total a Pagar:* *${formatearCOP(totalCarrito)}*%0A%0A` +
      `Quedo atento para coordinar el pago. ¡Gracias! ✨`;

    const numeroWhatsApp = "573193409024"; 
    window.open(`https://wa.me/${numeroWhatsApp}?text=${textoWhatsApp}`, '_blank');
    setModalWhatsAppAbierto(false);
  };

  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormAuth({ ...formAuth, [e.target.name]: e.target.value });
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeAuth({ texto: 'Tejiendo tu magia...', tipo: 'info' });
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAuth)
      });
      if (res.ok) {
        setMensajeAuth({ texto: '¡Cuenta creada! Ya puedes ingresar.', tipo: 'exito' });
        setTimeout(() => { setModalRegistro(false); setModalLogin(true); setMensajeAuth({ texto: '', tipo: '' }); }, 1500);
      } else {
        const err = await res.json();
        setMensajeAuth({ texto: err.error || 'Error al registrar', tipo: 'error' });
      }
    } catch (error) {
      setMensajeAuth({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeAuth({ texto: 'Abriendo el portal...', tipo: 'info' });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formAuth.email, password: formAuth.password })
      });
      if (res.ok) {
        const data = await res.json();
        const esAdministrador = data.email === 'opalouniversodedetalles@gmail.com';
        const datosUsuario = { nombre: data.nombre, email: data.email, esAdmin: esAdministrador };
        
        setUsuarioActivo(datosUsuario);
        setNombreCliente(data.nombre);
        localStorage.setItem('usuarioActivo', JSON.stringify(datosUsuario));
        setModalLogin(false);
        setFormAuth({ nombre: '', email: '', password: '' });
        setMensajeAuth({ texto: '', tipo: '' });
        setMensajeOpalito(`¡Bienvenido de nuevo, ${data.nombre}! Tu carrito está listo ✨`);
      } else {
        const err = await res.json();
        setMensajeAuth({ texto: err.error || 'Credenciales incorrectas', tipo: 'error' });
      }
    } catch (error) {
      setMensajeAuth({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

  // Función para enviar solicitud de recuperación
  const handleRecuperarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeRecuperar({ texto: 'Enviando enlace de rescate...', tipo: 'info' });
    try {
      const res = await fetch('/api/auth/olvide-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correoRecuperacion })
      });
      if (res.ok) {
        setMensajeRecuperar({ texto: '✨ ¡Revisa tu correo o terminal para recuperar el acceso!', tipo: 'exito' });
      } else {
        const err = await res.json();
        setMensajeRecuperar({ texto: err.error || 'No se pudo procesar la solicitud', tipo: 'error' });
      }
    } catch {
      setMensajeRecuperar({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

  const handleLogout = () => {
    setUsuarioActivo(null);
    setNombreCliente('');
    setCarrito([]);
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('adminVerificado');
    localStorage.removeItem('carritoCompras');
    setMensajeOpalito("¡Has cerrado sesión! Inicia sesión para ver tu carrito. 👋");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6] font-sans text-slate-800 relative selection:bg-pink-200">
      
      {toastNotificacion && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 border border-purple-400/30">
          <span>{toastNotificacion}</span>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
           <div className="flex items-center space-x-3 cursor-pointer group">
 
            {/* 1. Logo Ópalo */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shadow-purple-200 group-hover:scale-105 transition-transform border border-purple-100 flex-shrink-0">
              <img src="/logo.jpg" alt="Logo Ópalo" className="w-full h-full object-cover" />
            </div>

            {/* 2. El Osito */}
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-50 to-purple-100 border border-purple-100 flex items-center justify-center shadow-sm shadow-purple-200 text-2xl group-hover:rotate-12 transition-transform flex-shrink-0">
              🧸
            </div>
            
            {/* 3. Texto */}
            <div className="hidden sm:block">
              <span className="text-xl font-black tracking-tight text-purple-600 block leading-none">
                UNIVERSO<span className="text-pink-400">DETALLES</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Ópalo Magia 🌟
              </span>
            </div>

          </div>
            
            <div className="flex items-center space-x-3">
              {usuarioActivo && (
                <button onClick={() => setModalCarritoAbierto(true)} className="relative bg-purple-100/70 hover:bg-purple-200 text-purple-700 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 animate-in fade-in">
                  <span>🛒 Carrito</span>
                  {totalArticulos > 0 && (
                    <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce">
                      {totalArticulos}
                    </span>
                  )}
                </button>
              )}

              {usuarioActivo?.esAdmin && (
                <Link href="/admin" className="text-sm font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2.5 rounded-2xl border border-purple-200 shadow-xs flex items-center gap-2 hover:scale-105 transition-all">
                  ✨ Panel Admin
                </Link>
              )}

              {usuarioActivo ? (
                <div className="flex items-center space-x-3 bg-pink-50/80 px-4 py-2 rounded-2xl border border-pink-100">
                  <span className="text-sm font-medium text-slate-700">Hola, <span className="font-bold text-purple-700">{usuarioActivo.nombre}</span></span>
                  <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">Salir</button>
                </div>
              ) : (
                <div className="space-x-2">
                  <button onClick={() => { setModalLogin(true); setMensajeAuth({texto:'', tipo:''}); }} className="text-sm font-bold text-slate-600 hover:text-purple-600 px-3 py-2">Ingresar</button>
                  <button onClick={() => { setModalRegistro(true); setMensajeAuth({texto:'', tipo:''}); }} className="text-sm font-bold bg-gradient-to-r from-pink-400 to-purple-500 text-white px-5 py-2.5 rounded-full shadow-md hover:scale-105 transition-all">Crear Cuenta</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-pink-100/80 via-purple-100/40 to-amber-50/60 py-20 px-4 relative overflow-hidden border-b border-pink-100 text-center">
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-white/90 text-purple-600 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border border-pink-200 mb-4 inline-block">
            🧸 Detalles que enamoran y transforman días
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-slate-800 leading-tight">
            Ilumina cada momento con <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500">ternura y magia.</span>
          </h1>
          <p className="text-slate-600 font-medium max-w-xl mx-auto text-sm md:text-base">
            {!usuarioActivo ? "Inicia sesión para armar tu carrito de compras y realizar pedidos personalizados." : "Explora tu catálogo y gestiona tus artículos favoritos."}
          </p>
        </div>
      </div>

      {/* CATÁLOGO */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-10 border-b border-pink-100 pb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-pink-500">Navegación rápida</span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catálogo Mágico Activo 🎁</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Todos', 'Peluches', 'Dulceria', 'Maletas y Bolsos', 'Ropa Deportiva', 'Mugs y Termos', 'Jugueteria', 'Cuidado personal', 'Tecnología'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${categoriaActiva === cat ? 'bg-purple-600 text-white shadow-purple-200 scale-105' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="flex flex-col justify-center items-center h-48 space-y-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-pink-300 border-t-purple-600"></div>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-3xl border border-pink-100 shadow-sm max-w-xl mx-auto">
            <span className="text-4xl block mb-3">📦</span>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay productos en esta categoría</h3>
            <p className="text-slate-500 text-sm">Intenta seleccionar otra categoría o añade nuevos artículos desde el panel de administrador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productosFiltrados.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} agregarAlCarrito={agregarAlCarrito} usuarioActivo={usuarioActivo} />
            ))}
          </div>
        )}
      </main>

      {/* --- MODAL CARRITO DE COMPRAS --- */}
      {modalCarritoAbierto && usuarioActivo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">🛒 Tu Carrito Mágico</h2>
              <button onClick={() => setModalCarritoAbierto(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-1">
              {carrito.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <span className="text-5xl block mb-3">🛍️</span>
                  <p className="font-bold">Tu carrito está vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={`${item.id}-${item.varianteSeleccionada}`} className="flex items-center gap-4 bg-pink-50/40 p-3 rounded-2xl border border-pink-100">
                    <img src={item.imagenVariante} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{item.nombre}</h4>
                      <span className="text-[10px] text-purple-700 bg-white border border-purple-100 px-2 py-0.5 rounded-md font-bold inline-block mt-1">{item.varianteSeleccionada}</span>
                      <p className="text-purple-600 font-bold text-xs mt-1">{formatearCOP(item.precio)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => cambiarCantidad(`${item.id}-${item.varianteSeleccionada}`, -1)} className="w-6 h-6 bg-white border rounded-lg font-bold text-xs shadow-xs hover:bg-slate-100">-</button>
                        <span className="text-xs font-bold">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(`${item.id}-${item.varianteSeleccionada}`, 1)} className="w-6 h-6 bg-white border rounded-lg font-bold text-xs shadow-xs hover:bg-slate-100">+</button>
                      </div>
                    </div>
                    <button onClick={() => eliminarDelCarrito(`${item.id}-${item.varianteSeleccionada}`)} className="text-red-400 hover:text-red-600 font-bold p-2">🗑️</button>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-black text-slate-800">
                  <span>Total a Pagar:</span>
                  <span className="text-purple-700">{formatearCOP(totalCarrito)}</span>
                </div>
                <button 
                  onClick={() => { setModalCarritoAbierto(false); setModalWhatsAppAbierto(true); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>💬 Enviar Pedido por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL WHATSAPP --- */}
      {modalWhatsAppAbierto && usuarioActivo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setModalWhatsAppAbierto(false)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">✕</button>
            <div className="text-center mb-6">
              <span className="text-4xl">💬</span>
              <h2 className="text-2xl font-black text-slate-800 mt-2">Finalizar por WhatsApp</h2>
              <p className="text-slate-500 text-xs mt-1">Indícanos tus datos básicos para adjuntarlos a tu pedido automático.</p>
            </div>

            <form onSubmit={enviarPedidoWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tu Nombre o Quien Recibe</label>
                <input required type="text" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Ej. Esteban Reinoso" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Dirección de Entrega / Ciudad</label>
                <input required type="text" value={direccionCliente} onChange={(e) => setDireccionCliente(e.target.value)} placeholder="Ej. Calle 123 # 45-67, Bogotá" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 text-sm" />
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-emerald-800">
                <p className="font-bold mb-1">✨ ¿Qué pasará a continuación?</p>
                Se abrirá tu aplicación de WhatsApp con el resumen de tus productos por un valor de <b>{formatearCOP(totalCarrito)}</b>.
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 hover:scale-105">
                <span>🚀 Abrir WhatsApp y Enviar Pedido</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALES DE AUTENTICACIÓN */}
      {modalLogin && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border">
            <button onClick={() => setModalLogin(false)} className="absolute top-5 right-5 font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Iniciar Sesión</h2>
            {mensajeAuth.texto && <div className={`p-3 mb-4 rounded-xl text-xs font-bold ${mensajeAuth.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>{mensajeAuth.texto}</div>}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input required type="email" name="email" value={formAuth.email} onChange={handleAuthChange} placeholder="Correo" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              <input required type="password" name="password" value={formAuth.password} onChange={handleAuthChange} placeholder="Contraseña" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              
              <div className="text-right">
                <button type="button" onClick={() => { setModalLogin(false); setModalRecuperar(true); setMensajeRecuperar({texto:'', tipo:''}); }} className="text-xs text-purple-600 font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl">Entrar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECUPERAR CONTRASEÑA */}
      {modalRecuperar && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border">
            <button onClick={() => setModalRecuperar(false)} className="absolute top-5 right-5 font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Recuperar Contraseña 🔑</h2>
            <p className="text-slate-500 text-xs mb-4">Ingresa tu correo registrado para generar un enlace de rescate.</p>
            
            {mensajeRecuperar.texto && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-bold ${mensajeRecuperar.tipo === 'error' ? 'bg-red-50 text-red-600' : mensajeRecuperar.tipo === 'info' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {mensajeRecuperar.texto}
              </div>
            )}

            <form onSubmit={handleRecuperarContrasena} className="space-y-4">
              <input required type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} placeholder="Correo electrónico" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition-all">Enviar Enlace</button>
              <button type="button" onClick={() => { setModalRecuperar(false); setModalLogin(true); }} className="w-full text-xs text-slate-500 font-bold hover:underline mt-2">
                ← Volver al inicio de sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {modalRegistro && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative border">
            <button onClick={() => setModalRegistro(false)} className="absolute top-5 right-5 font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-4">Crear Cuenta</h2>
            {mensajeAuth.texto && <div className="p-3 mb-4 rounded-xl text-xs font-bold bg-purple-50 text-purple-700">{mensajeAuth.texto}</div>}
            <form onSubmit={handleRegistro} className="space-y-4">
              <input required type="text" name="nombre" value={formAuth.nombre} onChange={handleAuthChange} placeholder="Nombre" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              <input required type="email" name="email" value={formAuth.email} onChange={handleAuthChange} placeholder="Correo" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              <input required type="password" name="password" value={formAuth.password} onChange={handleAuthChange} placeholder="Contraseña" className="w-full p-3.5 border rounded-2xl outline-none text-sm" />
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-2xl">Registrarse</button>
            </form>
          </div>
        </div>
      )}

      {/* MASCOTA OPALITO */}
      {!modalCarritoAbierto && !modalWhatsAppAbierto && (
        <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3 pointer-events-auto">
          {mostrarOpalitoBubble && (
            <div className="bg-white/95 backdrop-blur-md border border-pink-200 shadow-xl px-4 py-3 rounded-2xl max-w-xs text-xs font-bold text-slate-700 relative animate-in fade-in slide-in-from-bottom-2">
              <button onClick={() => setMostrarOpalitoBubble(false)} className="absolute -top-2 -left-2 w-5 h-5 bg-pink-200 rounded-full flex items-center justify-center text-[10px] hover:bg-pink-300">✕</button>
              <p className="flex items-center gap-2"><span>🧸</span> {mensajeOpalito}</p>
            </div>
          )}
          <div 
            onClick={() => {
              setMostrarOpalitoBubble(true);
              const frases = usuarioActivo 
                ? [
                    "¡Usa los filtros de arriba para encontrar lo que buscas más rápido! ✨",
                    "¡Tu carrito está activo y listo para tus pedidos! 🚀",
                    "¡Qué gran día para regalar una sonrisa! 💖"
                  ]
                : [
                    "¡Inicia sesión para activar tu carrito y comprar tus detalles! 🔑",
                    "¡Explora el catálogo libremente, pero inicia sesión para añadir al carrito! 🌟"
                  ];
              setMensajeOpalito(frases[Math.floor(Math.random() * frases.length)]);
            }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-400 to-purple-500 shadow-xl shadow-pink-300 flex items-center justify-center text-3xl text-white cursor-pointer hover:scale-110 transition-all border-2 border-white animate-bounce duration-1000"
            title="¡Haz clic en Opalito!"
          >
            🧸
          </div>
        </div>
      )}
    </div>
  );
}