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

// [기능 1] 투표 로드 함수
async function loadVotes() {
    const container = document.getElementById('votes-list');
    if (!container) return;

    try {
        const res = await axios.get('/api/votes'); // 위에서 만든 서버 통로 호출
        const votesData = res.data.data;

        // 투표 완료 기록 불러오기 (로컬 저장소)
        const completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');

        container.innerHTML = votesData.map(v => {
            const isDone = completed.includes(v.id);
            return `
                <div class="card p-5 rounded-2xl border ${isDone ? 'border-gray-700 opacity-60' : 'border-cyan-500/20'} transition-all">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" onclick="toggleVote('${v.id}')" ${isDone ? 'checked' : ''} 
                                   class="w-5 h-5 rounded border-cyan-500 bg-gray-900 checked:bg-cyan-500 cursor-pointer">
                            <span class="badge text-cyan-400 border-cyan-500/30 text-[10px]">${v.platform}</span>
                        </div>
                        <span class="text-[10px] text-gray-500">마감: ${v.deadline || '상시'}</span>
                    </div>
                    
                    <h4 class="text-lg font-black text-white mb-4 ${isDone ? 'line-through text-gray-500' : ''}">${v.title}</h4>
                    
                    <div class="flex gap-2">
                        <a href="${v.link}" target="_blank" class="flex-1 text-center py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all">투표하기</a>
                        <button onclick="shareToX('${v.title}', '${v.link}')" class="px-3 py-2 bg-gray-800 rounded-lg text-blue-400 border border-gray-700 hover:border-blue-400 transition-all">
                            <i class="fab fa-twitter"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        container.innerHTML = '<p class="text-center text-gray-500 py-10">투표 정보를 불러오는 중 에러가 발생했습니다.</p>';
    }
}

// [기능 1] 투표 완료 체크 로직
function toggleVote(id) {
    let completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');
    if (completed.includes(id)) {
        completed = completed.filter(v => v !== id);
    } else {
        completed.push(id);
        showToast('💙 투표 완료! 진행률이 업데이트되었습니다.');
    }
    localStorage.setItem('completed_votes', JSON.stringify(completed));
    loadVotes(); // 화면 새로고침
}
