import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Heart, MapPin, Phone, Mail } from 'lucide-react'

export default async function Home() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: branches } = await admin.from('branches').select('id, name').order('name')
  const branchList = branches ?? []

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500" size={22} fill="currentColor" />
          <span className="font-bold text-gray-800 text-lg">מאירים</span>
        </div>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          כניסת צוות
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Heart size={14} fill="currentColor" /> מתנדבים שעושים את ההבדל
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight mb-6">
          מאירים לחיים — תומכים במשפחות ברחבי ישראל
        </h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-10">
          מאירים היא עמותת מתנדבים המוקדשת לסיוע למשפחות נזקקות באמצעות חלוקת מזון, פעילויות קהילתיות וליווי אישי — סניף אחד בכל פעם.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <a href="tel:0544444444" className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
            צרו קשר
          </a>
          <a href="#about" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
            קראו עוד
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-y border-gray-100">
        {[
          { value: String(branchList.length), label: 'סניפים' },
          { value: '+200', label: 'משפחות נתמכות' },
          { value: '+150', label: 'מתנדבים פעילים' },
          { value: '+10', label: 'שנות פעילות' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white py-10 flex flex-col items-center">
            <p className="text-3xl font-bold text-blue-600">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* About */}
      <section id="about" className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">מה אנחנו עושים</h2>
        <p className="text-gray-500 leading-relaxed mb-12">
          המתנדבים שלנו פועלים במספר ערים ומספקים תמיכה שוטפת למשפחות המתמודדות עם קשיים. מחלוקת מזון שבועית ועד פעילויות חגים וביקורים אישיים — אנו מאמינים שאף משפחה לא צריכה להרגיש לבד.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 text-right">
          {[
            { icon: '🛒', title: 'חלוקת מזון', desc: 'חלוקה שבועית של מצרכים חיוניים למשפחות נזקקות בכל הסניפים.' },
            { icon: '🎉', title: 'פעילויות קהילתיות', desc: 'אירועי חגים, סדנאות ומפגשים שמחזקים את הקהילה.' },
            { icon: '🤝', title: 'ליווי אישי', desc: 'מתנדבים מסורים הבונים קשרים ארוכי טווח עם המשפחות שהם מלווים.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Branches */}
      <section className="bg-blue-600 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-2">הסניפים שלנו</h2>
          <p className="text-blue-200 mb-8">פעילים בקהילות ברחבי הארץ</p>
          <div className="flex flex-wrap justify-center gap-3">
            {branchList.map(branch => (
              <div key={branch.id} className="flex items-center gap-1.5 bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                <MapPin size={13} /> {branch.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">צרו קשר</h2>
        <p className="text-gray-500 mb-8">רוצים להתנדב או זקוקים לעזרה? אנחנו כאן.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:0544444444" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors justify-center">
            <Phone size={16} /> 054-444-4444
          </a>
          <a href="mailto:contact@meirim.org.il" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors justify-center">
            <Mail size={16} /> contact@meirim.org.il
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} מאירים. כל הזכויות שמורות.
      </footer>

    </div>
  )
}
