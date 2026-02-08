import { Hono } from 'hono'

const votes = new Hono()

// 수희님이 새로 만드신 통합 웹 앱 URL
const API_URL = 'https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec?type=votes'

// 1. 투표 목록 조회 (구글 시트에서 실시간으로 읽어오기)
votes.get('/', async (c) => {
  try {
    const res = await fetch(API_URL)
    const result = await res.json()
    // 구글 시트의 데이터를 그대로 반환
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ success: false, error: '데이터를 불러오지 못했습니다.' }, 500)
  }
})

// 2. 새 투표 정보 추가 (사이트의 '추가' 버튼 클릭 시 구글 시트로 저장)
votes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    // 구글 시트 Apps Script의 doPost로 데이터 전송
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'votes', // votes 탭으로 저장
        category: body.category,
        title: body.title,
        link: body.vote_url || body.link, // 필드명 확인 필요
        description: body.description
      })
    })

    const result = await res.json()
    return c.json(result)
  } catch (error) {
    return c.json({ success: false, error: '정보 저장에 실패했습니다.' }, 500)
  }
})

export default votes
