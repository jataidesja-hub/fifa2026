'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/groups', label: 'Grupos' },
  { href: '/bracket', label: 'Mata-Mata' },
  { href: '/teams', label: 'Seleções' },
  { href: '/admin', label: 'Admin' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          FIFA<span>2026</span>
        </Link>
        <ul className="navbar-nav">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? 'active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
