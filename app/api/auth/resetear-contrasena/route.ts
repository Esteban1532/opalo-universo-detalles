import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    const client = await pool.connect();
    
    // Verificar si el token es válido y no ha expirado
    const reset = await client.query('SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()', [token]);
    
    if (reset.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña en la tabla usuarios
    await client.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [hashedPassword, reset.rows[0].email]);
    
    // Eliminar el token usado por seguridad
    await client.query('DELETE FROM password_resets WHERE token = $1', [token]);
    
    client.release();
    return NextResponse.json({ mensaje: 'Contraseña actualizada' });
  } catch (error: any) {
    console.error('Error al resetear contraseña:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}