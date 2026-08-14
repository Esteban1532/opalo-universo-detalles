import { NextResponse } from 'next/server';

const SUPABASE_URL = "https://wytwknnkxsdkryezcfiu.supabase.co";
// Asegúrate de que Vercel tenga configurada SUPABASE_SERVICE_ROLE_KEY o usará la clave anónima
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ventas?select=*&order=fecha.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { producto_nombre, cantidad, total, fecha } = body;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/ventas`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        producto_nombre,
        cantidad: Number(cantidad),
        total: Number(total),
        fecha: fecha || new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en Supabase REST API al insertar venta:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error crítico en POST /api/ventas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}