import { Hono } from 'hono'
import { cors } from 'hono/cors'
import votes from './routes/votes'
import schedule from './routes/schedule'
import radioRequests from './routes/radioRequests'
import adRequests from './routes/adRequests'

const app = new Hono()

// 모든 도메인에서 접속 가능하게 허용
app.use('/api/*', cors())

// [중요] 시트 데이터를 가져올 깔끔한 API 경로들
app.route('/api/votes', votes)
app.route('/api/schedule', schedule)
app.route('/api/radio-requests', radioRequests)
app.route('/api/ad-requests', adRequests)

export default app
