import { Hono } from 'hono'

const schedule = new Hono()

// 수희님의 통합 웹 앱 URL
const API_URL = 'https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec?type=schedule'

// 1. 전체 일정 조회 및 필터링 (오늘/다가오는/반복 일정 모두 포함)
schedule.get('/', async (c) => {
  try {
    const res = await fetch(API_URL)
    const allData = await res.json()
    
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    // 기존 코드의 로직을 사이트에서 처리
    const data = {
      today: allData.filter((item: any) => item.날짜 === todayStr),
      upcoming: allData.filter((item: any) => item.날짜 > todayStr),
      recurring: allData.filter((item: any) => item.카테고리 === '반복')
    }

    return c.json({ success: true, data: data })
  } catch (error) {
    return c.json({ success: false, error: '일정 데이터를 불러오지 못했습니다.' }, 500)
  }
})

// 2. 새 일정 추가 (구글 시트로 저장)
schedule.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'schedule',
        category: body.category,
        title: body.title,
        link: body.link,
        description: body.description
      })
    })
    return c.json(await res.json())
  } catch (error) {
    return c.json({ success: false, error: '일정 저장에 실패했습니다.' }, 500)
  }
})

export default schedule
