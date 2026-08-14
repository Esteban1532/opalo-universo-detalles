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

function ProductoCard({ producto, agregarAlCarrito, usuarioActivo }: { producto: Producto, agregarAlCarrito: Function, usuarioActivo: any }) {
  const [indiceImg, setIndiceImg] = useState(0);
  const FALLBACK_IMAGE = "/logo.jpg";

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

  const imagenesValidas = galeriaArray.filter(
    item => item && typeof item.url === 'string' && item.url.trim() !== ''
  );

  const listaFinal = imagenesValidas.length > 0 
    ? imagenesValidas 
    : (producto.imagen_url && producto.imagen_url.trim() !== '' 
        ? [{ url: producto.imagen_url, etiqueta: 'Principal' }] 
        : [{ url: FALLBACK_IMAGE, etiqueta: 'Disponible' }]);

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
      <div className="h-48 sm:h-60 overflow-hidden bg-pink-50/50 relative">
        <img 
          src={imagenActual} 
          alt={producto.nombre} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-purple-600 shadow-xs border border-pink-100">
          {producto.categoria}
        </span>

        <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap">
          {etiquetaActual}
        </span>

        {listaFinal.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center text-purple-700 font-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100">‹</button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 w-8 h-8 rounded-full flex items-center justify-center text-purple-700 font-black shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100">›</button>
          </>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-1 truncate">{producto.nombre}</h3>
        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-grow">{producto.descripcion}</p>
        <div className="flex justify-between items-center pt-4 border-t border-pink-50 mb-4">
          <span className="text-lg sm:text-xl font-black text-purple-700">{formatearCOP(producto.precio)}</span>
          <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 bg-pink-50 text-pink-600 rounded-full">Stock: {producto.stock}</span>
        </div>
        <button 
          onClick={() => agregarAlCarrito(producto, listaFinal[indiceImg])}
          disabled={producto.stock <= 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm sm:text-base font-bold py-3 rounded-xl sm:rounded-2xl hover:opacity-95 shadow-md shadow-pink-200 transition-all hover:scale-105 disabled:opacity-50"
        >
          {producto.stock > 0 ? (usuarioActivo ? '🛒 Agregar' : '🔒 Iniciar Sesión') : 'Agotado'}
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
  const [modalRecuperar, setModalRecuperar] = useState(false);
  
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

    // 1. Generar código de pedido único
    const idPedido = `#OPALO-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = new Date().toLocaleString();

    // 2. Crear estructura del pedido para el Panel Admin local
    const nuevoPedidoAdmin = {
      id: idPedido,
      fecha: fechaActual,
      cliente: nombreCliente || 'No especificado',
      direccion: direccionCliente || 'No especificada',
      productos: carrito,
      total: totalCarrito,
      estado: 'Pendiente'
    };

    // 3. Guardar en localStorage para que el Admin lo gestione
    const pedidosPrevios = JSON.parse(localStorage.getItem('opalo_pedidos_whatsapp') || '[]');
    localStorage.setItem('opalo_pedidos_whatsapp', JSON.stringify([nuevoPedidoAdmin, ...pedidosPrevios]));

    // 4. Armar texto para WhatsApp
    const detalle = carrito.map(i => `• ${i.nombre} [${i.varianteSeleccionada}] (x${i.cantidad}) - ${formatearCOP(Number(i.precio) * i.cantidad)}`).join('%0A');
    
    const textoWhatsApp = `¡Hola! 👋 Me gustaría hacer un pedido en *Universo Detalles*:%0A%0A` +
      `🆔 *Código de Pedido:* ${idPedido}%0A` +
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
        setMensajeOpalito(`¡Bienvenido de nuevo, ${data.nombre.split(' ')[0]}! Tu carrito está listo ✨`);
      } else {
        const err = await res.json();
        setMensajeAuth({ texto: err.error || 'Credenciales incorrectas', tipo: 'error' });
      }
    } catch (error) {
      setMensajeAuth({ texto: 'Error de conexión', tipo: 'error' });
    }
  };

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
        setMensajeRecuperar({ texto: '✨ ¡Revisa tu correo para recuperar el acceso!', tipo: 'exito' });
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
    <div className="min-h-screen flex flex-col bg-[#FFF9F6] font-sans text-slate-800 relative selection:bg-pink-200 overflow-x-hidden">
      
      {toastNotificacion && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 border border-purple-400/30">
          <span>{toastNotificacion}</span>
        </div>
      )}

      {/* NAVBAR REDISEÑADA PARA MÓVIL */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            
            {/* LADO IZQUIERDO */}
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0 max-w-[55%] sm:max-w-none">
              
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-purple-200 group-hover:scale-105 transition-transform border border-purple-100 shrink-0">
                <img src="/logo.jpg" alt="Logo Ópalo" className="w-full h-full object-cover" />
              </div>

              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-50 to-purple-100 border border-purple-100 items-center justify-center shadow-sm shadow-purple-200 text-2xl group-hover:rotate-12 transition-transform shrink-0">
                🧸
              </div>
              
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-sm sm:text-xl font-black tracking-tight text-purple-600 block leading-tight truncate">
                  UNIVERSO<span className="text-pink-400">DETALLES</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate">
                  Ópalo Magia 🌟
                </span>
              </div>

            </div>
            
            {/* LADO DERECHO */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {usuarioActivo && (
                <button onClick={() => setModalCarritoAbierto(true)} className="relative bg-purple-100/70 hover:bg-purple-200 text-purple-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-all shrink-0">
                  <span className="text-sm sm:text-base">🛒</span>
                  <span className="hidden sm:inline">Carrito</span>
                  {totalArticulos > 0 && (
                    <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto bg-pink-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black">
                      {totalArticulos}
                    </span>
                  )}
                </button>
              )}

              {usuarioActivo?.esAdmin && (
                <Link href="/admin" className="text-xs sm:text-sm font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border border-purple-200 shadow-xs flex items-center gap-1.5 shrink-0">
                  ✨ <span className="hidden sm:inline">Panel Admin</span><span className="sm:hidden">Admin</span>
                </Link>
              )}

              {usuarioActivo ? (
                <div className="flex items-center gap-2 sm:gap-3 bg-pink-50/80 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-pink-100 shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[70px] sm:max-w-[150px]">
                    <span className="hidden sm:inline">Hola, </span><span className="font-bold text-purple-700">{usuarioActivo.nombre.split(' ')[0]}</span>
                  </span>
                  <button onClick={handleLogout} className="text-[10px] sm:text-xs font-bold text-red-400 hover:text-red-600 transition-colors border-l border-pink-200 pl-2 sm:pl-3 shrink-0">Salir</button>
                </div>
              ) : (
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  <button onClick={() => { setModalLogin(true); setMensajeAuth({texto:'', tipo:''}); }} className="text-xs sm:text-sm font-bold text-slate-600 hover:text-purple-600 px-2 py-2">Entrar</button>
                  <button onClick={() => { setModalRegistro(true); setMensajeAuth({texto:'', tipo:''}); }} className="text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-400 to-purple-500 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-md shrink-0">Registro</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-pink-100/80 via-purple-100/40 to-amber-50/60 py-16 sm:py-20 px-4 relative overflow-hidden border-b border-pink-100 text-center">
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-white/90 text-purple-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5 sm:px-4 rounded-full shadow-sm border border-pink-200 mb-4 inline-block">
            🧸 Detalles que enamoran y transforman
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight text-slate-800 leading-tight">
            Ilumina cada momento con <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500">ternura y magia.</span>
          </h1>
          <p className="text-slate-600 font-medium max-w-xl mx-auto text-xs sm:text-base px-2">
            {!usuarioActivo ? "Inicia sesión para armar tu carrito de compras y realizar pedidos personalizados." : "Explora tu catálogo y gestiona tus artículos favoritos."}
          </p>
        </div>
      </div>

      {/* CATÁLOGO */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 sm:mb-10 border-b border-pink-100 pb-6">
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-pink-500">Navegación rápida</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Catálogo Mágico Activo 🎁</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Todos', 'Peluches', 'Dulceria', 'Maletas y Bolsos', 'Ropa Deportiva', 'Mugs y Termos', 'Jugueteria', 'Cuidado personal', 'Tecnología'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all shadow-xs ${categoriaActiva === cat ? 'bg-purple-600 text-white shadow-purple-200 scale-105' : 'bg-white text-slate-600 hover:bg-pink-50 border border-pink-100'}`}
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
          <div className="bg-white p-12 sm:p-16 text-center rounded-3xl border border-pink-100 shadow-sm max-w-xl mx-auto">
            <span className="text-4xl block mb-3">📦</span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No hay productos en esta categoría</h3>
            <p className="text-slate-500 text-xs sm:text-sm">Intenta seleccionar otra categoría o añade nuevos artículos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {productosFiltrados.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} agregarAlCarrito={agregarAlCarrito} usuarioActivo={usuarioActivo} />
            ))}
          </div>
        )}
      </main>

      {/* --- MODAL CARRITO DE COMPRAS --- */}
      {modalCarritoAbierto && usuarioActivo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-4 sm:p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">🛒 Tu Carrito Mágico</h2>
              <button onClick={() => setModalCarritoAbierto(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200">✕</button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 sm:space-y-4 pr-1">
              {carrito.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <span className="text-5xl block mb-3">🛍️</span>
                  <p className="font-bold text-sm">Tu carrito está vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={`${item.id}-${item.varianteSeleccionada}`} className="flex items-center gap-3 sm:gap-4 bg-pink-50/40 p-2.5 sm:p-3 rounded-2xl border border-pink-100">
                    <img src={item.imagenVariante} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover" />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">{item.nombre}</h4>
                      <span className="text-[9px] sm:text-[10px] text-purple-700 bg-white border border-purple-100 px-2 py-0.5 rounded-md font-bold inline-block mt-1 truncate max-w-full">{item.varianteSeleccionada}</span>
                      <p className="text-purple-600 font-bold text-[10px] sm:text-xs mt-1">{formatearCOP(item.precio)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => cambiarCantidad(`${item.id}-${item.varianteSeleccionada}`, -1)} className="w-5 h-5 sm:w-6 sm:h-6 bg-white border rounded-lg font-bold text-xs shadow-xs hover:bg-slate-100">-</button>
                        <span className="text-[10px] sm:text-xs font-bold">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(`${item.id}-${item.varianteSeleccionada}`, 1)} className="w-5 h-5 sm:w-6 sm:h-6 bg-white border rounded-lg font-bold text-xs shadow-xs hover:bg-slate-100">+</button>
                      </div>
                    </div>
                    <button onClick={() => eliminarDelCarrito(`${item.id}-${item.varianteSeleccionada}`)} className="text-red-400 hover:text-red-600 font-bold p-2 text-sm">🗑️</button>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-base sm:text-lg font-black text-slate-800">
                  <span>Total a Pagar:</span>
                  <span className="text-purple-700">{formatearCOP(totalCarrito)}</span>
                </div>
                <button 
                  onClick={() => { setModalCarritoAbierto(false); setModalWhatsAppAbierto(true); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <span>💬 Enviar Pedido por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN SOBRE NOSOTROS / CONTEXTO SEO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-white rounded-3xl border border-pink-100 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 select-none pointer-events-none">🧸</div>
          
          <div className="max-w-3xl relative z-10 space-y-4">
            <span className="bg-white text-purple-600 font-black text-xs uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xs border border-purple-100 inline-block">
              ✨ Nuestra Esencia
            </span>
            
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
              Magia y ternura en cada detalle
            </h2>
            
            <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
              <strong>Somos Opalo Universo de detalles, tu tienda de regalos favorita ubicada en Tocancipá</strong>, especializados en transformar tus momentos especiales en recuerdos inolvidables. Creamos sonrisas con peluches, dulces, sorpresas personalizadas y obsequios únicos diseñados con todo el amor para sorprender a quienes más amas.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-pink-100 shadow-xs">
                <span className="text-xl block mb-1">🎁</span>
                <h4 className="font-black text-slate-800 text-xs uppercase">Detalles Únicos</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Diseñados para cada ocasión especial.</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-pink-100 shadow-xs">
                <span className="text-xl block mb-1">📍</span>
                <h4 className="font-black text-slate-800 text-xs uppercase">Ubicación Local</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Centro Comercial Fátima, Tocancipá.</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-pink-100 shadow-xs">
                <span className="text-xl block mb-1">💖</span>
                <h4 className="font-black text-slate-800 text-xs uppercase">Hecho con Amor</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Calidad y ternura garantizadas.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- MODAL WHATSAPP --- */}
      {modalWhatsAppAbierto && usuarioActivo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border border-emerald-100 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setModalWhatsAppAbierto(false)} className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">✕</button>
            <div className="text-center mb-5 sm:mb-6">
              <span className="text-3xl sm:text-4xl">💬</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-2">Finalizar por WhatsApp</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-1">Indícanos tus datos básicos para tu pedido.</p>
            </div>

            <form onSubmit={enviarPedidoWhatsApp} className="space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 mb-1">Tu Nombre o Quien Recibe</label>
                <input required type="text" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="Ej. Esteban Reinoso" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm" />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 mb-1">Dirección de Entrega / Ciudad</label>
                <input required type="text" value={direccionCliente} onChange={(e) => setDireccionCliente(e.target.value)} placeholder="Ej. Calle 123 # 45-67, Bogotá" className="w-full bg-slate-50 border border-slate-200 p-3 sm:p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm" />
              </div>

              <div className="bg-emerald-50 p-3 sm:p-4 rounded-2xl border border-emerald-100 text-[10px] sm:text-xs text-emerald-800">
                <p className="font-bold mb-1">✨ ¿Qué pasará a continuación?</p>
                Se abrirá tu aplicación de WhatsApp con el resumen de tus productos por un valor de <b>{formatearCOP(totalCarrito)}</b>.
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-bold py-3.5 sm:py-4 rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 hover:scale-105">
                <span>🚀 Abrir WhatsApp y Enviar Pedido</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALES DE AUTENTICACIÓN */}
      {modalLogin && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border">
            <button onClick={() => setModalLogin(false)} className="absolute top-4 right-4 sm:top-5 sm:right-5 font-bold w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">✕</button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4">Iniciar Sesión</h2>
            {mensajeAuth.texto && <div className={`p-3 mb-4 rounded-xl text-xs font-bold ${mensajeAuth.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>{mensajeAuth.texto}</div>}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input required type="email" name="email" value={formAuth.email} onChange={handleAuthChange} placeholder="Correo" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              <input required type="password" name="password" value={formAuth.password} onChange={handleAuthChange} placeholder="Contraseña" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              
              <div className="text-right">
                <button type="button" onClick={() => { setModalLogin(false); setModalRecuperar(true); setMensajeRecuperar({texto:'', tipo:''}); }} className="text-[10px] sm:text-xs text-purple-600 font-bold hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-base">Entrar</button>
            </form>
          </div>
        </div>
      )}

      {modalRecuperar && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border">
            <button onClick={() => setModalRecuperar(false)} className="absolute top-4 right-4 sm:top-5 sm:right-5 font-bold w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">✕</button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">Recuperar Contraseña 🔑</h2>
            <p className="text-slate-500 text-[10px] sm:text-xs mb-4">Ingresa tu correo registrado para generar un enlace de rescate.</p>
            
            {mensajeRecuperar.texto && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-bold ${mensajeRecuperar.tipo === 'error' ? 'bg-red-50 text-red-600' : mensajeRecuperar.tipo === 'info' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {mensajeRecuperar.texto}
              </div>
            )}

            <form onSubmit={handleRecuperarContrasena} className="space-y-4">
              <input required type="email" value={correoRecuperacion} onChange={(e) => setCorreoRecuperacion(e.target.value)} placeholder="Correo electrónico" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all text-sm sm:text-base">Enviar Enlace</button>
              <button type="button" onClick={() => { setModalRecuperar(false); setModalLogin(true); }} className="w-full text-[10px] sm:text-xs text-slate-500 font-bold hover:underline mt-2">
                ← Volver al inicio de sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {modalRegistro && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border">
            <button onClick={() => setModalRegistro(false)} className="absolute top-4 right-4 sm:top-5 sm:right-5 font-bold w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">✕</button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4">Crear Cuenta</h2>
            {mensajeAuth.texto && <div className="p-3 mb-4 rounded-xl text-xs font-bold bg-purple-50 text-purple-700">{mensajeAuth.texto}</div>}
            <form onSubmit={handleRegistro} className="space-y-4">
              <input required type="text" name="nombre" value={formAuth.nombre} onChange={handleAuthChange} placeholder="Nombre" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              <input required type="email" name="email" value={formAuth.email} onChange={handleAuthChange} placeholder="Correo" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              <input required type="password" name="password" value={formAuth.password} onChange={handleAuthChange} placeholder="Contraseña" className="w-full p-3 sm:p-3.5 border rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm" />
              <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-base">Registrarse</button>
            </form>
          </div>
        </div>
      )}

      {/* MASCOTA OPALITO Y WHATSAPP FLOTANTES */}
      {!modalCarritoAbierto && !modalWhatsAppAbierto && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-end gap-2 sm:gap-3 pointer-events-auto">
          
          {mostrarOpalitoBubble && (
            <div className="bg-white/95 backdrop-blur-md border border-pink-200 shadow-xl px-3 py-2 sm:px-4 sm:py-3 rounded-2xl max-w-[180px] sm:max-w-xs text-[10px] sm:text-xs font-bold text-slate-700 relative animate-in fade-in slide-in-from-bottom-2 mb-1 sm:mb-0">
              <button onClick={() => setMostrarOpalitoBubble(false)} className="absolute -top-2 -left-2 w-5 h-5 bg-pink-200 rounded-full flex items-center justify-center text-[10px] hover:bg-pink-300">✕</button>
              <p className="flex items-center gap-1.5 sm:gap-2"><span>🧸</span> {mensajeOpalito}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:gap-4">
            
            <a 
              href="https://wa.me/573193409024?text=¡Hola!%20Vengo%20de%20la%20tienda%20online%20y%20me%20gustaría%20hablar%20con%20un%20asistente.%20✨" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] shadow-xl shadow-green-300/50 flex items-center justify-center text-white hover:scale-110 transition-all border-2 border-white cursor-pointer shrink-0 animate-pulse hover:animate-none"
              title="¡Habla con un asesor!"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </a>

            <div 
              onClick={() => {
                setMostrarOpalitoBubble(true);
                const frases = usuarioActivo 
                  ? [
                      "¡Usa los filtros de arriba para encontrar lo que buscas más rápido! ✨",
                      "¡Tu carrito está activo y listo para tus pedidos! 🚀",
                      "¡Qué gran día para regalar una sonrisa! 💖",
                      "¿Tienes dudas? ¡Usa el botón verde para hablar con nosotros! 💬"
                    ]
                  : [
                      "¡Inicia sesión para activar tu carrito y comprar tus detalles! 🔑",
                      "¡Explora el catálogo libremente, pero inicia sesión para añadir al carrito! 🌟",
                      "¿Necesitas ayuda? ¡Toca el icono de WhatsApp arriba de mí! 💬"
                    ];
                setMensajeOpalito(frases[Math.floor(Math.random() * frases.length)]);
              }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-3xl bg-gradient-to-tr from-pink-400 to-purple-500 shadow-xl shadow-pink-300 flex items-center justify-center text-2xl sm:text-3xl text-white cursor-pointer hover:scale-110 transition-all border-2 border-white animate-bounce duration-1000 shrink-0"
              title="¡Haz clic en Opalito!"
            >
              🧸
            </div>

          </div>
        </div>
      )}

      {/* FOOTER PREMIUM */}
      <footer className="bg-gradient-to-b from-white to-pink-50 border-t border-pink-100 py-12 px-6 mt-16 pb-24 sm:pb-12">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Opalo Universo de detalles
            </h3>
            <a 
              href="https://www.google.com/maps/place/Opalo+Universo+de+detalles/data=!4m2!3m1!1s0x8e40738d38b44839:0x8eaf217c88c1b462?hl=es-419&trk=https%3A%2F%2Fc.gle%2FAKMee0eIh79RZRPwIvU5yEfnmv5QjfW6Nfw9x7XPf4Sm3EzfjAIAwzwC3Fjen4VlYe2qjroqY1abuqtU_KQk_wlGbhS0G2WcbevDhHote1-8JMQDKn8h2Jrj12WScsmi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md border border-pink-100 hover:border-purple-300 hover:shadow-purple-100 transition-all transform hover:scale-105"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <span className="text-slate-600 font-black text-xs uppercase tracking-widest group-hover:text-purple-700">Tocancipá (Centro comercial Fatima, Local 133), Colombia (Ver en Mapa ↗)</span>
            </a>
          </div>

          <div className="bg-white/50 p-6 rounded-3xl border border-pink-100 shadow-sm flex gap-6">
            {[
              { name: "Instagram", url: "https://www.instagram.com/opalo.ud", color: "text-pink-600", icon: "M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.556 0 5.829 0 8c0 2.171.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" },
              { name: "Facebook", url: "https://www.facebook.com/people/%C3%93palo-Universo-de-Detalles/61576582142049/", color: "text-blue-600", icon: "M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" },
              { name: "TikTok", url: "https://www.tiktok.com/@opalo.ud", color: "text-slate-800", icon: "M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.077-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" }
            ].map((social) => (
              <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm border border-pink-100 flex items-center justify-center ${social.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-purple-100 relative`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d={social.icon}/></svg>
                  <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold">↗</span>
                </div>
                <span className="mt-2 text-[9px] font-black uppercase text-slate-400 group-hover:text-purple-600 tracking-wider transition-colors">{social.name}</span>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            © 2026 Opalo Universo de detalles.
          </p>
        </div>
      </footer>

    </div>
  );
}