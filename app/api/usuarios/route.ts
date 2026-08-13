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
    
    // Seleccionamos solo el ID, nombre y email (NUNCA la contraseña)
    const result = await client.query('SELECT id, nombre, email FROM usuarios ORDER BY id DESC');
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}