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
    const { nombre, email, password } = body;

    // 1. Validar que no falten datos
    if (!nombre || !email || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const client = await pool.connect();

    // 2. Verificar si el correo ya existe en pgAdmin
    const userCheck = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      client.release();
      return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 });
    }

    // 3. Encriptar la contraseña (crea un "hash" ilegible)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Guardar el nuevo usuario en PostgreSQL
    const result = await client.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [nombre, email, password_hash]
    );

    client.release();
    
    // Retornar éxito
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error al guardar en la base de datos' }, { status: 500 });
  }
}