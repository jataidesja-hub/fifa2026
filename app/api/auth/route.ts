import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_USER = process.env.ADMIN_USERNAME || 'jasantos'
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '123456'
const SESSION_TOKEN = 'fifa2026_admin_session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_TOKEN, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_TOKEN)
  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_TOKEN)
  return NextResponse.json({ authenticated: session?.value === 'authenticated' })
}
