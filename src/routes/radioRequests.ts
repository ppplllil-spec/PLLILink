import { Hono } from 'hono'
const radio = new Hono()

// 수희님의 통합 API 주소 (라디오 탭 지정)
const API_URL = 'https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec?type=radioRequests'

radio.get('/', async (c) => {
  const res = await fetch(API_URL)
  const data = await res.json()
  return c.json({ success: true, data: data })
})

radio.post('/', async (c) => {
  const body = await c.req.json()
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ ...body, type: 'radioRequests' })
  })
  return c.json(await res.json())
})

export default radio
