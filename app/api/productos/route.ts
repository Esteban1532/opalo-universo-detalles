import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM productos ORDER BY creado_en DESC');
    client.release();
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar productos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, stock, imagen_url, categoria, galeria } = body;

    const client = await pool.connect();
    await client.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria, galeria) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [nombre, descripcion, precio, stock, imagen_url, categoria, JSON.stringify(galeria || [])]
    );
    client.release();

    return NextResponse.json({ mensaje: 'Producto creado con éxito' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}