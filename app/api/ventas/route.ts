import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Si prefieres usar las de Vercel o quemarlas directamente para evitar el fallo de entorno:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wytwknnkxsdkryezcfiu.supabase.co/rest/v1/"; // <- Tu URL real de Supabase
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dHdrbm5reHNka3J5ZXpjZml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDI4NzU0MSwiZXhwIjoyMDk5ODYzNTQxfQ.Wl_iEq8huBc6KY7EzDNvjBP9lC_oOrj9zdbXLFmD9AE"; // <- Tu Service Role Key real

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { producto_nombre, cantidad, total, fecha } = body;

    const { data, error } = await supabase
      .from('ventas')
      .insert([
        { 
          producto_nombre, 
          cantidad: Number(cantidad), 
          total: Number(total), 
          fecha: fecha || new Date().toISOString() 
        }
      ]);

    if (error) {
      console.error("Error de Supabase al insertar venta:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error crítico en POST /api/ventas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}