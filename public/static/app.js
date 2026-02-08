/**
 * PLLI LINK - 통합 마스터 스크립트 v3.0
 */
let allVotes = [];
let currentTab = 'schedule';

document.addEventListener('DOMContentLoaded', () => initApp());

async function initApp() {
    console.log("🚀 플리링크 시스템 가동!");
    updateNotificationButtonStatus(); // [해결] 알림 버튼 에러 방지
    await refreshAllData();
    setInterval(updateCountdowns, 1000); // [기능 1] 초 단위 카운트다운
}

// [기능 1, 6] 데이터 새로고침 및 404 에러 방지 주소
async function refreshAllData() {
    try {
        const [vRes, sRes] = await Promise.all([
            axios.get('/api/votes?type=votes'),
            axios.get('/api/schedule?type=schedule')
        ]);
        allVotes = vRes.data.data;
        renderVotes(allVotes);
        renderTodaySchedule(sRes.data.data);
    } catch (e) { console.error("데이터 로딩 실패:", e); }
}

// [기능 1] 투표 렌더링 + 카운트다운 + 공유
function renderVotes(data) {
    const container = document.getElementById('votes-list');
    if (!container) return;
    const completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');

    container.innerHTML = data.map(v => {
        const isDone = completed.includes(v.id);
        return `
            <div class="card p-5 ${isDone ? 'opacity-50' : ''}" id="vote-${v.id}">
                <div class="flex justify-between mb-3">
                    <input type="checkbox" onclick="toggleVote('${v.id}')" ${isDone ? 'checked' : ''} class="w-5 h-5">
                    <span class="badge text-cyan-400 border-cyan-500/30 text-[10px]">${v.platform}</span>
                </div>
                <h4 class="text-white font-black mb-2">${v.title}</h4>
                <div class="timer text-pink-500 font-mono text-xs mb-4" id="timer-${v.id}">계산 중...</div>
                <div class="flex gap-2">
                    <a href="${v.link}" target="_blank" class="flex-1 bg-cyan-600 text-center py-2 rounded-xl text-xs font-bold">투표하기</a>
                    <button onclick="shareToX('${v.title}', '${v.link}')" class="px-3 bg-gray-800 rounded-lg text-blue-400"><i class="fab fa-twitter"></i></button>
                    <button onclick="copyToClipboard('${v.link}')" class="px-3 bg-gray-800 rounded-lg"><i class="fas fa-link"></i></button>
                </div>
            </div>`;
    }).join('');
}

// [기능 1] 실시간 카운트다운 및 알림 로직
function updateCountdowns() {
    allVotes.forEach(v => {
        const timerEl = document.getElementById(`timer-${v.id}`);
        if (!timerEl || !v.deadline) return;

        const diff = new Date(v.deadline) - new Date();
        if (diff <= 0) {
            timerEl.innerText = "마감됨";
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerEl.innerText = `${h}시간 ${m}분 ${s}초 남음`;

        // [기능 1] 브라우저 알림 (마감 1시간 전)
        if (h === 1 && m === 0 && s === 0) sendPushNotification(`⚠️ 마감 임박: ${v.title}`);
    });
}

// [기능 1, 3] 모달 제어 (텅 빈 모달 해결!)
function openAddModal() {
    const modal = document.getElementById('add-modal');
    const content = document.getElementById('form-content');
    if (!modal || !content) return;

    let fields = '';
    // 현재 탭에 따라 필드 구성 (기능 5: URL 입력 시 자동 파싱은 다음 단계에서 추가)
    if (currentTab === 'votes') {
        fields = `
            <input type="text" name="title" placeholder="투표 제목" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <input type="url" name="link" onchange="autoParseUrl(this.value)" placeholder="투표 URL" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <input type="datetime-local" name="deadline" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white">`;
    } else if (currentTab === 'radio') {
        fields = `
            <input type="text" name="station" placeholder="방송국/프로그램" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <textarea name="description" placeholder="신청 예시문 (5줄 내외)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white h-32"></textarea>`;
    }

    content.innerHTML = fields;
    modal.classList.remove('hidden');
}

// [기능 8] 알림 기능 살리기
async function toggleNotifications() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        new Notification("✅ 알림 설정 완료!", { body: "이제 투표 마감 알림을 보내드릴게요." });
    }
    updateNotificationButtonStatus();
}

function updateNotificationButtonStatus() {
    const btnText = document.getElementById('notification-status');
    if (!btnText) return;
    btnText.innerText = (Notification.permission === 'granted') ? '알림 활성 중' : '알림 켜기';
}
