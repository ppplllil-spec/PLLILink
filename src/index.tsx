import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { D1Database } from '@cloudflare/workers-types'

import votes from './routes/votes'
import adRequests from './routes/adRequests'
import radioRequests from './routes/radioRequests'
import tips from './routes/tips'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))

// API 라우트
app.route('/api/votes', votes)
app.route('/api/ad-requests', adRequests)
app.route('/api/radio-requests', radioRequests)
app.route('/api/tips', tips)

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>팬덤 커뮤니티 - 투표·광고·라디오 정보 공유</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .card {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
          }
          .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .tab-active {
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        </style>
    </head>
    <body class="p-4 md:p-8">
        <!-- 헤더 -->
        <div class="max-w-7xl mx-auto mb-8">
            <div class="card rounded-2xl shadow-2xl p-6 mb-6">
                <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                    <i class="fas fa-heart mr-3"></i>팬덤 커뮤니티
                </h1>
                <p class="text-gray-600">투표·광고·라디오 정보를 실시간으로 공유하세요</p>
            </div>
            
            <!-- 탭 메뉴 -->
            <div class="card rounded-2xl shadow-2xl p-2 mb-6">
                <div class="flex flex-wrap gap-2">
                    <button onclick="switchTab('votes')" id="tab-votes" class="tab-active flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition-all">
                        <i class="fas fa-vote-yea mr-2"></i>투표
                    </button>
                    <button onclick="switchTab('ads')" id="tab-ads" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition-all hover:bg-gray-100">
                        <i class="fas fa-ad mr-2"></i>광고 시안
                    </button>
                    <button onclick="switchTab('radio')" id="tab-radio" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition-all hover:bg-gray-100">
                        <i class="fas fa-radio mr-2"></i>라디오
                    </button>
                    <button onclick="switchTab('tips')" id="tab-tips" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition-all hover:bg-gray-100">
                        <i class="fas fa-lightbulb mr-2"></i>투표 팁
                    </button>
                </div>
            </div>
            
            <!-- 추가 버튼 -->
            <div class="flex justify-end mb-4">
                <button onclick="openAddModal()" class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                    <i class="fas fa-plus mr-2"></i>새 정보 추가
                </button>
            </div>
        </div>

        <!-- 콘텐츠 영역 -->
        <div class="max-w-7xl mx-auto">
            <!-- 투표 섹션 -->
            <div id="content-votes" class="content-section">
                <div id="votes-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 광고 섹션 -->
            <div id="content-ads" class="content-section hidden">
                <div id="ads-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 라디오 섹션 -->
            <div id="content-radio" class="content-section hidden">
                <div class="mb-4 flex gap-2">
                    <button onclick="filterRadio('all')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">전체</button>
                    <button onclick="filterRadio('domestic')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">국내</button>
                    <button onclick="filterRadio('international')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">해외</button>
                </div>
                <div id="radio-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 팁 섹션 -->
            <div id="content-tips" class="content-section hidden">
                <div id="tips-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>
        </div>

        <!-- 추가 모달 -->
        <div id="add-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="card rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">새 정보 추가</h2>
                    <button onclick="closeAddModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                <form id="add-form" class="space-y-4">
                    <div id="form-content">
                        <!-- 동적으로 생성됨 -->
                    </div>
                    <div class="flex gap-2 pt-4">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                        <button type="button" onclick="closeAddModal()" class="px-6 py-3 rounded-xl font-semibold bg-gray-200">
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
