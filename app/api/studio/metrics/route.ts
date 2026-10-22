import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Recupera le metriche di consumo di token e costi
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "admin-super-unix";

    // Simulazione o recupero dati reali dal database delle metriche
    const metricsData = {
      totalTokensUsed: 48250,
      promptTokens: 31200,
      completionTokens: 17050,
      estimatedCostUsd: 0.0485,
      activeModels: ["gemini-2.5-flash", "openai/gpt-oss-20b"],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      metrics: metricsData
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Registra nuove metriche dopo una chiamata API
export async function POST(req: Request) {
  try {
    const { userId, promptTokens, completionTokens, modelName } = await req.json();

    // Calcolo stimato dei costi (es. tariffe indicative per token)
    const costPer1kInput = 0.0005;
    const costPer1kOutput = 0.0008;
    const estimatedCost = ((promptTokens || 0) / 1000) * costPer1kInput + ((completionTokens || 0) / 1000) * costPer1kOutput;

    // Qui potresti salvare i dati su Supabase in una tabella dedicata 'api_metrics'
    
    return NextResponse.json({
      success: true,
      recorded: {
        userId: userId || 'admin-super-unix',
        modelName: modelName || 'default',
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        estimatedCost: estimatedCost.toFixed(5),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}