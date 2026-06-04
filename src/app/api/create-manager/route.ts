import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify caller is super admin using service role (bypasses RLS)
  const caller = await createServerClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await admin.from('managers').select('is_super_admin').eq('user_id', user.id).single()
  if (!me?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, phone, branch_id, is_super_admin } = await req.json()

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { data: manager, error: dbError } = await admin.from('managers').insert({
    user_id: newUser.user.id,
    name,
    email,
    phone: phone || null,
    branch_id: branch_id || null,
    is_super_admin: is_super_admin ?? false,
  }).select('*, branches(name)').single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ manager })
}
