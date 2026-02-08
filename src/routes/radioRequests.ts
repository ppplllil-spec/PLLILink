import { Hono } from 'hono'
const radio = new Hono()

// 새로 만드신 radioRequests 탭을 연결합니다.
const API_URL = 'https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec?type=radioRequests'

radio.get('/', async (c) => {
  const res = await fetch(API_URL)
  const data = await res.json()
  return c.json({ success: true, data: data })
})

// 시트로 정보를 보낼 때도 바뀐 항목명으로 보냅니다.
radio.post('/', async (c) => {
  const body = await c.req.json()
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ 
      type: 'radioRequests',
      category: body.category, // 자동입력, 복사신청 등
      title: body.title,
      link: body.link,
      description: body.description // 예시문
    })
  })
  return c.json(await res.json())
})

export default radio
