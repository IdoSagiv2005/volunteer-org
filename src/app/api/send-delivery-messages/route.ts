import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function formatPhone(phone: string): string {
  // Convert Israeli number (0501234567) to WhatsApp chatId (972501234567@c.us)
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('972') ? digits : '972' + digits.replace(/^0/, '')
  return `${normalized}@c.us`
}

async function sendWhatsApp(phone: string, message: string, photoUrl?: string | null) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID!
  const token = process.env.GREEN_API_TOKEN!
  const chatId = formatPhone(phone)
  const base = `https://api.green-api.com/waInstance${instanceId}`

  if (photoUrl) {
    const res = await fetch(`${base}/sendFileByUrl/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, urlFile: photoUrl, fileName: 'door.jpg', caption: message }),
    })
    return res.ok
  } else {
    const res = await fetch(`${base}/sendMessage/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    })
    return res.ok
  }
}

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: coordinations, error } = await supabaseAdmin
    .from('coordinations')
    .select('*, volunteers(name, phone)')
    .eq('date', today)
    .not('volunteer_id', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!coordinations?.length) return NextResponse.json({ sent: 0, message: 'No deliveries today' })

  const results: { volunteer: string; address: string; photo: boolean; sent: boolean }[] = []

  for (const coord of coordinations) {
    const volunteer = coord.volunteers as { name: string; phone: string | null } | null
    if (!volunteer?.phone) continue

    // Match address back to deliveries table to get door photo
    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('door_photo_url')
      .eq('address', coord.address)
      .eq('branch_id', coord.branch_id)
      .maybeSingle()

    const photoUrl = delivery?.door_photo_url ?? null
    const time = coord.scheduled_time.slice(0, 5)

    const message = photoUrl
      ? `שלום ${volunteer.name}!\nיש לך משלוח היום בשעה ${time} לכתובת:\n${coord.address}\nתמונת הדלת מצורפת 📸`
      : `שלום ${volunteer.name}!\nיש לך משלוח היום בשעה ${time} לכתובת:\n${coord.address}\n\nאין תמונת דלת במערכת — אנא צלם/י את הדלת בסיום המשלוח ושלח/י אלינו 🙏`

    const sent = await sendWhatsApp(volunteer.phone, message, photoUrl)
    results.push({ volunteer: volunteer.name, address: coord.address, photo: !!photoUrl, sent })
  }

  return NextResponse.json({ sent: results.filter(r => r.sent).length, results })
}
