import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Faltan las variables de entorno de Supabase en Vercel" }, { status: 500 });
    }

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
    console.error("Error en API route POST /api/ventas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}