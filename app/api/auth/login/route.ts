import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const client = await pool.connect();
    
    // 1. Buscar al usuario por su correo
    const result = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const usuario = result.rows[0];

    // 2. Desencriptar y comparar contraseñas
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValida) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // 3. Login exitoso (enviamos los datos públicos del usuario)
    return NextResponse.json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email }, { status: 200 });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}