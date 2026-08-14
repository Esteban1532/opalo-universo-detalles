import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createClient(supabaseUrl, supabaseKey);

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
  // Capturamos directamente dentro de la función para asegurar que Vercel lea el entorno en tiempo de ejecución
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  console.log("DEBUG URL:", supabaseUrl ? "URL Presente (Longitud: " + supabaseUrl.length + ")" : "URL VACÍA");
  console.log("DEBUG KEY:", supabaseKey ? "KEY Presente" : "KEY VACÍA");

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    return NextResponse.json({ 
      error: `URL de Supabase inválida o vacía en Vercel: "${supabaseUrl}". Revisa tus Environment Variables.` 
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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