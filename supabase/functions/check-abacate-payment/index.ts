import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Não autorizado");

    const { pixId, dependentId } = await req.json();
    if (!pixId) throw new Error("ID do PIX não fornecido");

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Identifica o usuário logado via JWT (muito mais seguro e garantido)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error("Sessão inválida na verificação");

    // 1. Consultar status no AbacatePay
    const abacateResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const result = await abacateResponse.json();
    const status = result.data?.status;
    const amount = result.data?.amount;
    
    // Pequeno delay proposital se estiver pago para garantir que o banco de dados processe o update antes do refresh do App
    if (status === 'PAID') {
        const finalPlan = amount === 3000 ? 'DIGITAL' : 'PRINTED';
        const now = new Date().toISOString();

        if (dependentId) {
            // Se o App enviou um ID de dependente, atualiza ele
            await supabaseAdmin.from('dependents').update({
                payment_status: 'PAID',
                payment_confirmed_at: now,
                payment_plan: finalPlan
            }).eq('id', dependentId);
        } else {
            // Caso contrário, atualiza o perfil do usuário que está fazendo a requisição
            await supabaseAdmin.from('profiles').update({
                payment_status: 'PAID',
                payment_confirmed_at: now,
                payment_plan: finalPlan
            }).eq('id', user.id);
        }
        
        // Aguarda 1 segundo antes de responder para o App não dar refresh antes do commit do banco
        await new Promise(r => setTimeout(r, 1000));
    }

    return new Response(JSON.stringify({ status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});