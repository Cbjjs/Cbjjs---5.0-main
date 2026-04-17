import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Não autorizado")

    const { targetUserId } = await req.json()
    if (!targetUserId) throw new Error("ID do usuário não fornecido")

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar se quem pede é um ADMIN
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !requester) throw new Error("Sessão inválida")

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      throw new Error("Apenas administradores podem realizar esta ação")
    }

    // 2. LIMPEZA TOTAL EM CASCATA (Ordem de dependência)
    
    // a) Remover dependentes/filhos
    await supabaseAdmin.from('dependents').delete().eq('parent_id', targetUserId);
    
    // b) Remover solicitações de alteração de perfil
    await supabaseAdmin.from('profile_change_requests').delete().eq('user_id', targetUserId);

    // c) Remover logs de pagamento
    await supabaseAdmin.from('payment_logs').delete().eq('user_id', targetUserId);

    // d) Remover Academias (se o usuário for professor/dono)
    // Isso é crucial pois a academia trava a exclusão do perfil do dono
    await supabaseAdmin.from('academies').delete().eq('owner_id', targetUserId);

    // 3. EXCLUSÃO FINAL NO AUTH (Isso dispara o cascade automático no public.profiles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ 
        message: "Usuário e todos os dados vinculados foram removidos permanentemente.",
        cleaned: ["dependents", "academies", "requests", "logs", "auth_user"]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[DELETE-FATAL-ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})