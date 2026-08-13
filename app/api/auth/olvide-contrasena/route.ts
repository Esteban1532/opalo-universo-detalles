import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { Resend } from 'resend';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    // 🟢 MOVIDO AQUÍ ADENTRO para evitar el error de compilación en Vercel
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { email } = await request.json();
    const token = crypto.randomBytes(32).toString('hex');

    const client = await pool.connect();
    
    const user = await client.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Correo no encontrado' }, { status: 404 });
    }

    await client.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')", 
      [email, token]
    );
    client.release();

    const origin = request.headers.get('origin') || 'https://opalo-universo-detalles.vercel.app';
    const enlaceRecuperacion = `${origin}/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
      from: 'Universo Detalles <onboarding@resend.dev>', 
      to: email,
      subject: '🔑 Recuperación de contraseña - Universo Detalles',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #9333ea;">Universo Detalles 🧸</h2>
          <p>Hemos recibido una solicitud para cambiar tu contraseña.</p>
          <a href="${enlaceRecuperacion}" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 10px; font-weight: bold;">Cambiar mi contraseña</a>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Este enlace es seguro y expirará en 1 hora.</p>
        </div>
      `
    });

    if (error) {
      console.error("Error de Resend:", error);
      return NextResponse.json({ error: 'No se pudo enviar el correo' }, { status: 500 });
    }
    
    return NextResponse.json({ mensaje: '¡Revisa tu correo para recuperar el acceso!' });
  } catch (error: any) {
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}