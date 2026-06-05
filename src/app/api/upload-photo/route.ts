import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const caller = await createServerClient()
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const addressId = formData.get('address_id') as string
  if (!file || !addressId) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const path = `door-photos/${addressId}`
  const { error } = await admin.storage.from('deliveries').upload(path, file, { upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: { publicUrl } } = admin.storage.from('deliveries').getPublicUrl(path)
  return NextResponse.json({ publicUrl })
}
