import { Hono } from 'hono'
import { cors } from 'hono/cors'
import votes from './routes/votes'
import schedule from './routes/schedule'

const app = new Hono()
app.use('/api/*', cors()) // 모든 접속 허용

// 주소 약속: 이 주소로 들어오면 각 파일로 연결해줍니다.
app.route('/api/votes', votes)
app.route('/api/schedule', schedule)

export default app
