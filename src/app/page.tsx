import Link from 'next/link'
import { Heart, Users, MapPin, Phone, Mail } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Heart className="text-red-500" size={22} fill="currentColor" />
          <span className="font-bold text-gray-800 text-lg">מאירים</span>
        </div>
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Staff Login
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Heart size={14} fill="currentColor" /> Volunteers making a difference
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight mb-6">
          Helping Families Across Israel
        </h1>
        <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-10">
          מאירים is a volunteer organization dedicated to supporting families in need through food deliveries, community activities, and personal care — one branch at a time.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <a href="mailto:contact@yadbyadorg.il" className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
            Get in Touch
          </a>
          <a href="#about" className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
            Learn More
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-y border-gray-100">
        {[
          { value: '5', label: 'Branches' },
          { value: '200+', label: 'Families Supported' },
          { value: '150+', label: 'Active Volunteers' },
          { value: '10+', label: 'Years of Service' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white py-10 flex flex-col items-center">
            <p className="text-3xl font-bold text-blue-600">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* About */}
      <section id="about" className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">What We Do</h2>
        <p className="text-gray-500 leading-relaxed mb-12">
          Our volunteers work across multiple cities to provide ongoing support to families facing hardship. From weekly food deliveries to holiday activities and personal visits, we believe no family should feel alone.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '🛒', title: 'Food Deliveries', desc: 'Weekly deliveries of essential groceries to families in need across all our branches.' },
            { icon: '🎉', title: 'Community Activities', desc: 'Holiday events, workshops, and gatherings that bring communities together.' },
            { icon: '🤝', title: 'Personal Support', desc: 'Dedicated volunteers who build lasting relationships with the families they serve.' },
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
          <h2 className="text-2xl font-bold text-white mb-2">Our Branches</h2>
          <p className="text-blue-200 mb-8">Active in communities across the country</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Tel Aviv', 'Jerusalem', 'Eilat', 'Beer Sheva', 'Kiryat Ata'].map(city => (
              <div key={city} className="flex items-center gap-1.5 bg-white/10 text-white px-4 py-2 rounded-full text-sm">
                <MapPin size={13} /> {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Contact Us</h2>
        <p className="text-gray-500 mb-8">Want to volunteer or need our help? Reach out.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:0544444444" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Phone size={16} /> 054-444-4444
          </a>
          <a href="mailto:contact@yadbyadorg.il" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Mail size={16} /> contact@yadbyadorg.il
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} מאירים. All rights reserved.
      </footer>

    </div>
  )
}
