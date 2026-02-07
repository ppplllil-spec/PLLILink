import { Hono } from 'hono'
import type { Bindings } from '../types'

const radioRequests = new Hono<{ Bindings: Bindings }>()

// 라디오 신청 정보 목록 조회
radioRequests.get('/', async (c) => {
  try {
    const country = c.req.query('country')
    let query = 'SELECT * FROM radio_requests'
    const params: string[] = []
    
    if (country) {
      query += ' WHERE country = ?'
      params.push(country)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const stmt = c.env.DB.prepare(query)
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch radio requests' }, 500)
  }
})

// 라디오 신청 정보 상세 조회
radioRequests.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM radio_requests WHERE id = ?
    `).bind(id).all()
    
    if (results.length === 0) {
      return c.json({ success: false, error: 'Radio request not found' }, 404)
    }
    
    return c.json({ success: true, data: results[0] })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch radio request' }, 500)
  }
})

// 라디오 신청 정보 등록
radioRequests.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { title, station_name, program_name, request_url, request_method, country, description, created_by } = body
    
    if (!title || !station_name) {
      return c.json({ success: false, error: 'Title and station_name are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO radio_requests (title, station_name, program_name, request_url, request_method, country, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      station_name,
      program_name || null,
      request_url || null,
      request_method || null,
      country || 'domestic',
      description || null,
      created_by || null
    ).run()
    
    return c.json({ 
      success: true, 
      data: { 
        id: result.meta.last_row_id, 
        title,
        station_name,
        program_name,
        request_url,
        request_method,
        country: country || 'domestic',
        description,
        created_by
      }
    }, 201)
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create radio request' }, 500)
  }
})

// 라디오 신청 정보 수정
radioRequests.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, station_name, program_name, request_url, request_method, country, description } = body
    
    if (!title || !station_name) {
      return c.json({ success: false, error: 'Title and station_name are required' }, 400)
    }
    
    await c.env.DB.prepare(`
      UPDATE radio_requests 
      SET title = ?, station_name = ?, program_name = ?, request_url = ?, request_method = ?, country = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      station_name,
      program_name || null,
      request_url || null,
      request_method || null,
      country || 'domestic',
      description || null,
      id
    ).run()
    
    return c.json({ 
      success: true, 
      data: { id, title, station_name, program_name, request_url, request_method, country, description }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update radio request' }, 500)
  }
})

// 라디오 신청 정보 삭제
radioRequests.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM radio_requests WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'Radio request deleted successfully' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete radio request' }, 500)
  }
})

export default radioRequests
