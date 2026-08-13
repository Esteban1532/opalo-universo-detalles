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
    const body = await request.json();
    const { items, metodoPago, total } = body; // items: [{id, nombre, cantidad, precio}]

    const client = await pool.connect();

    // 1. Registrar cada producto vendido en la tabla de ventas y descontar stock
    for (const item of items) {
      await client.query(
        'INSERT INTO ventas (producto_nombre, cantidad, total) VALUES ($1, $2, $3)',
        [item.nombre, item.cantidad, Number(item.precio) * item.cantidad]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.id]
      );
    }
    client.release();

    // 2. Enviar correo de notificación al Administrador
    if (process.env.CORREO_PASS_APP) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'reinosoesteban73@gmail.com',
            pass: process.env.CORREO_PASS_APP,
          },
        });

        const itemsHtml = items.map((i: any) => `<li><b>${i.nombre}</b> (x${i.cantidad}) - $${Number(i.precio) * i.cantidad}</li>`).join('');

        await transporter.sendMail({
          from: '"Universo Detalles 🛒" <reinosoesteban73@gmail.com>',
          to: 'reinosoesteban73@gmail.com',
          subject: `🚨 ¡Nueva Venta Realizada via ${metodoPago}!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #FFF9F6; border-radius: 15px;">
              <h2 style="color: #7c3aed;">🛍️ ¡Nuevo Pedido Exitoso en la Tienda!</h2>
              <p><b>Método de Pago:</b> ${metodoPago}</p>
              <p><b>Total Recaudado:</b> $${total}</p>
              <h3>Productos comprados:</h3>
              <ul>${itemsHtml}</ul>
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Este aviso se generó automáticamente y ya fue sincronizado con tu panel de control.</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.error("Aviso: No se pudo enviar el correo de alerta, pero la venta se registró en BD.");
      }
    }

    return NextResponse.json({ exito: true, mensaje: 'Compra procesada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error en checkout:', error);
    return NextResponse.json({ error: 'Error al procesar la compra' }, { status: 500 });
  }
}