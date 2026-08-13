import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const { nombre, descripcion, precio, stock, imagen_url, categoria, galeria } = body;

    const client = await pool.connect();
    await client.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, imagen_url = $5, categoria = $6, galeria = $7 WHERE id = $8',
      [nombre, descripcion, precio, stock, imagen_url, categoria, JSON.stringify(galeria || []), id]
    );
    client.release();

    return NextResponse.json({ mensaje: 'Producto actualizado' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const client = await pool.connect();
    await client.query('DELETE FROM productos WHERE id = $1', [id]);
    client.release();
    return NextResponse.json({ mensaje: 'Producto eliminado' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}