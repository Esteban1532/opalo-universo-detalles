import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const { email, codigo } = await request.json();

    const client = await pool.connect();
    const result = await client.query(
      'SELECT codigo_admin_temp, es_admin FROM usuarios WHERE email = $1',
      [email]
    );
    client.release();

    if (result.rows.length === 0 || !result.rows[0].es_admin) {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
    }

    if (result.rows[0].codigo_admin_temp !== codigo) {
      return NextResponse.json({ error: 'Código temporal incorrecto' }, { status: 400 });
    }

    return NextResponse.json({ exito: true }, { status: 200 });
  } catch (error) {
    console.error('Error al verificar código:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}