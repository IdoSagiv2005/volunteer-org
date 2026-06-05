import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const caller = await createServerClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: me } = await admin.from('managers').select('is_super_admin').eq('user_id', user.id).single()
  if (!me?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()

  const { data: manager } = await admin.from('managers').select('user_id').eq('id', id).single()
  if (!manager) return NextResponse.json({ error: 'Manager not found' }, { status: 404 })

  await admin.from('managers').delete().eq('id', id)
  await admin.auth.admin.deleteUser(manager.user_id)

  return NextResponse.json({ success: true })
}
