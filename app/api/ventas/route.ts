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
    // Traer las ventas ordenadas por fecha (las más nuevas primero)
    const result = await client.query('SELECT * FROM ventas ORDER BY fecha DESC');
    client.release();

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error al cargar historial de ventas:', error);
    return NextResponse.json({ error: 'Error al cargar las ventas' }, { status: 500 });
  }
}