import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// 간단한 SHA-256 해시 함수 (클라이언트에서 해시 후 전송)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 로그인
app.post('/login', async (c) => {
  const { DB } = c.env
  const { username, password } = await c.req.json()

  try {
    const passwordHash = await hashPassword(password)
    
    const user = await DB.prepare(`
      SELECT id, username, role, display_name, created_at
      FROM users 
      WHERE username = ? AND password_hash = ?
    `).bind(username, passwordHash).first()

    if (!user) {
      return c.json({
        success: false,
        error: '아이디 또는 비밀번호가 올바르지 않습니다.'
      }, 401)
    }

    // 마지막 로그인 시간 업데이트
    await DB.prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(user.id).run()

    // 세션 토큰 생성 (UUID 형식)
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일

    await DB.prepare(`
      INSERT INTO sessions (session_token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).bind(sessionToken, user.id, expiresAt.toISOString()).run()

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        display_name: user.display_name
      },
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 세션 확인
app.post('/verify', async (c) => {
  const { DB } = c.env
  const { session_token } = await c.req.json()

  try {
    const session = await DB.prepare(`
      SELECT s.*, u.username, u.role, u.display_name
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).bind(session_token).first()

    if (!session) {
      return c.json({
        success: false,
        error: '유효하지 않은 세션입니다.'
      }, 401)
    }

    return c.json({
      success: true,
      user: {
        id: session.user_id,
        username: session.username,
        role: session.role,
        display_name: session.display_name
      }
    })
  } catch (error: any) {
    console.error('Verify error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 로그아웃
app.post('/logout', async (c) => {
  const { DB } = c.env
  const { session_token } = await c.req.json()

  try {
    await DB.prepare(`
      DELETE FROM sessions WHERE session_token = ?
    `).bind(session_token).run()

    return c.json({
      success: true,
      message: '로그아웃되었습니다.'
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 비회원 게시물 수정/삭제 권한 확인
app.post('/verify-password', async (c) => {
  const { DB } = c.env
  const { type, id, password } = await c.req.json()

  try {
    const passwordHash = await hashPassword(password)
    
    let table = ''
    if (type === 'votes') table = 'votes'
    else if (type === 'ad-requests') table = 'ad_requests'
    else if (type === 'radio-requests') table = 'radio_requests'
    else if (type === 'tips') table = 'vote_tips'
    else {
      return c.json({ success: false, error: '잘못된 타입입니다.' }, 400)
    }

    const result = await DB.prepare(`
      SELECT id FROM ${table} WHERE id = ? AND password_hash = ?
    `).bind(id, passwordHash).first()

    if (!result) {
      return c.json({
        success: false,
        error: '비밀번호가 올바르지 않습니다.'
      }, 401)
    }

    return c.json({
      success: true,
      message: '권한이 확인되었습니다.'
    })
  } catch (error: any) {
    console.error('Verify password error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
