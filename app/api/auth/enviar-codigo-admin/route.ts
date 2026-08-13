import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

const pool = new Pool({
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT || '6543'),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (email !== 'opalouniversodedetalles@gmail.com') {
      return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 });
    }

    // 1. Generar código aleatorio de 6 dígitos
    const codigoAleatorio = Math.floor(100000 + Math.random() * 900000).toString();

    // 🚨 RESPALDO DE EMERGENCIA EN LA TERMINAL DE VS CODE
    console.log("\n========================================");
    console.log(`🔑 CÓDIGO TEMPORAL ADMIN PARA ${email}: ${codigoAleatorio}`);
    console.log("========================================\n");

    const client = await pool.connect();
    await client.query(
      'UPDATE usuarios SET codigo_admin_temp = $1 WHERE email = $2',
      [codigoAleatorio, email]
    );
    client.release();

    // Intentar enviar por correo (si falla por credenciales de app, ya lo tienes en la terminal)
    if (process.env.CORREO_PASS_APP) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'opalouniversodedetalles@gmail.com',
            pass: process.env.CORREO_PASS_APP,
          },
        });

        await transporter.sendMail({
          from: '"Universo Detalles 🧸" <opalouniversodedetalles@gmail.com>',
          to: email,
          subject: '🔑 Código de Acceso Temporal - Panel Admin',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #FFF9F6; border-radius: 15px;">
              <h2 style="color: #7c3aed;">🔐 Verificación de Administrador</h2>
              <p>Hola <b>Esteban</b>, tu contraseña temporal de un solo uso es:</p>
              <h1 style="background: #fbcfe8; color: #831843; padding: 10px 20px; display: inline-block; border-radius: 10px; letter-spacing: 5px;">${codigoAleatorio}</h1>
            </div>
          `,
        });
      } catch (mailError) {
        console.log("Aviso: El correo no se pudo enviar, pero puedes ver el código en la terminal de arriba.");
      }
    }

    return NextResponse.json({ mensaje: 'Código generado con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error al generar código:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}