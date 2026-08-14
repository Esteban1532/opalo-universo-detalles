import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wytwknnkxsdkryezcfiu.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request: Request) {
  try {
    const { usuario_id } = await request.json();

    if (!usuario_id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    // Borrar todos los items del carrito para este usuario
    const { error } = await supabase
      .from('carrito_items')
      .delete()
      .eq('usuario_id', usuario_id);

    if (error) {
      console.error("Error al limpiar carrito:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}