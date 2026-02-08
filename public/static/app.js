/** PLAVE PLLI Community - 수희님 시트 맞춤형 통합 스크립트 **/
let currentTab = 'schedule';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    updateNotificationButtonStatus();
    await loadSchedule();
    await loadVotes();
    await loadAds();
}

// [기능 1] 알림 버튼 살리기
async function toggleNotifications() {
    if (!('Notification' in window)) return alert('알림 미지원 브라우저입니다.');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') alert('✅ 알림이 설정되었습니다!');
    updateNotificationButtonStatus();
}

function updateNotificationButtonStatus() {
    const btn = document.getElementById('notification-status');
    if (!btn) return;
    btn.innerText = (Notification.permission === 'granted') ? '알림 활성 중' : '알림 켜기';
}

// [기능 2] 시트 데이터 불러오기 (수희님 영문 헤더 기준)
async function loadSchedule() {
    const box = document.getElementById('today-deadline-votes');
    try {
        const res = await axios.get('/api/schedule?type=schedule');
        const today = new Date().toISOString().split('T')[0];
        const todayData = res.data.data.filter(item => item.date === today);
        box.innerHTML = todayData.map(item => `
            <div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-2">
                <span class="text-cyan-400 text-[10px] font-bold">${item.time}</span>
                <p class="text-white text-xs">${item.title}</p>
            </div>`).join('') || '<p class="text-gray-500 text-xs text-center py-4">오늘 일정이 없습니다.</p>';
    } catch (e) { console.error('일정 로드 실패'); }
}

// [기능 3] 모달 입력창 복구 (텅 빈 화면 해결!)
function openAddModal() {
    const modal = document.getElementById('add-modal');
    const content = document.getElementById('form-content');
    
    // 현재 탭 감지
    let activeTab = 'votes';
    if (!document.getElementById('content-votes').classList.contains('hidden')) activeTab = 'votes';
    if (!document.getElementById('content-radio').classList.contains('hidden')) activeTab = 'radio';

    let fields = (activeTab === 'votes') ? `
        <input type="text" name="category" placeholder="플랫폼" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
        <input type="text" name="title" placeholder="투표 제목" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
        <input type="url" name="link" placeholder="링크" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white">` 
    : `
        <input type="text" name="category" placeholder="방송사" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
        <textarea name="description" placeholder="사연 내용" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white h-24"></textarea>`;

    content.innerHTML = fields;
    modal.classList.remove('hidden');
}

function closeAddModal() { document.getElementById('add-modal').classList.add('hidden'); }

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    if (tab === 'radio') renderRadioSection(); // 라디오 함수 필요 시 추가
}
