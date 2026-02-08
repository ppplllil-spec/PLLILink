/**
 * PLLI LINK MASTER SCRIPT  통합 로직
 */
let allVotes = [];
let currentTab = 'schedule';

document.addEventListener('DOMContentLoaded', () => initApp());

async function initApp() {
    updateNotificationButtonStatus();
    await refreshData();
    setInterval(updateCountdowns, 1000); // [기능 1] 실시간 카운트다운
}

// [기능 1 & 6] 데이터 로드 및 일정 관리
async function refreshData() {
    try {
        const [vRes, sRes, rRes] = await Promise.all([
            axios.get('/api/votes?type=votes'),
            axios.get('/api/schedule?type=schedule'),
            axios.get('/api/radio-requests?type=radioRequests')
        ]);
        allVotes = vRes.data.data;
        renderVotes(allVotes);
        renderSchedule(sRes.data.data);
    } catch (e) { console.error("데이터 로드 실패"); }
}

// [기능 1] 투표 렌더링 + 체크박스 + 카운트다운
function renderVotes(data) {
    const container = document.getElementById('votes-list');
    const completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');
    
    container.innerHTML = data.map(v => {
        const isDone = completed.includes(v.id);
        return `
            <div class="card p-5 ${isDone ? 'opacity-50' : ''}" data-deadline="${v.deadline}">
                <div class="flex justify-between items-start">
                    <input type="checkbox" onclick="toggleVote('${v.id}')" ${isDone ? 'checked' : ''}>
                    <span class="badge text-cyan-400">${v.platform}</span>
                </div>
                <h4 class="text-white font-bold my-2">${v.title}</h4>
                <div class="countdown text-pink-500 font-mono text-xs mb-3" id="timer-${v.id}">남은 시간 계산 중...</div>
                <div class="flex gap-2">
                    <a href="${v.link}" target="_blank" class="flex-1 bg-cyan-600 text-center py-2 rounded-lg text-xs">투표하기</a>
                    <button onclick="copyToClipboard('${v.link}')" class="px-3 bg-gray-800 rounded-lg"><i class="fas fa-copy"></i></button>
                    <button onclick="shareToX('${v.title}', '${v.link}')" class="px-3 bg-gray-800 rounded-lg text-blue-400"><i class="fab fa-twitter"></i></button>
                </div>
            </div>`;
    }).join('');
    updateProgress(data.length, completed.length);
}

// [기능 5] 링크 자동 인식 (Meta 데이터 추출)
async function fetchMetaData(url) {
    if(!url.includes('http')) return;
    showToast("🔗 링크 정보 분석 중...");
    try {
        const res = await axios.get(`/api/utils/metadata?url=${encodeURIComponent(url)}`);
        if(res.data.success) {
            document.querySelector('input[name="title"]').value = res.data.title;
            showToast("✅ 제목 자동 입력 완료!");
        }
    } catch(e) { console.log("메타데이터 추출 실패"); }
}

// [기능 1] 실시간 카운트다운 로직
function updateCountdowns() {
    allVotes.forEach(v => {
        const timerEl = document.getElementById(`timer-${v.id}`);
        if(!timerEl || !v.deadline) return;
        const diff = new Date(v.deadline) - new Date();
        if(diff <= 0) {
            timerEl.innerText = "마감됨";
            return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerEl.innerText = `${h}시간 ${m}분 ${s}초 남음`;
        
        // [기능 1] 브라우저 알림 (1시간 전)
        if(h === 1 && m === 0 && s === 0) sendNotification(`[마감임박] ${v.title} 투표가 1시간 남았습니다!`);
    });
}

// [기능 7] 해외 라디오 예시문 자동 치환
function getRadioTemplate(station, artist, song) {
    const templates = {
        'wpvr': `Hi BBC! Please play ${song} by ${artist}. It's my favorite!`,
        'MBC': `안녕하세요! 플레이브의 ${song} 신청합니다. 꼭 들려주세요!`
    };
    return templates[station] || "";
}

// 유틸리티 함수들
function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast('📋 복사 완료!')); }
function showToast(msg) { /* 토스트 UI 로직 */ }
function updateNotificationButtonStatus() { /* 알림 버튼 UI 로직 */ }
