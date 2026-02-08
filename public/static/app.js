/** * PLAVE PLLI Community - 수희님 시트 맞춤형 통합 스크립트 
 */
let currentTab = 'schedule';
let allRadioData = [];

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log("🚀 플리링크 시스템 가동!");
    updateNotificationButtonStatus(); // 알림 버튼 상태 초기화
    await loadSchedule();
    await loadVotes();
    await loadAds();
}

// [기능 1] 알림 버튼 (수희님이 원하신 기능!)
async function toggleNotifications() {
    if (!('Notification' in window)) {
        showToast('❌ 알림을 지원하지 않는 브라우저입니다.');
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showToast('✅ 알림이 설정되었습니다! (마감 전 푸시 예정)');
    }
    updateNotificationButtonStatus();
}

function updateNotificationButtonStatus() {
    const btn = document.getElementById('notification-status');
    if (!btn) return;
    btn.innerText = (Notification.permission === 'granted') ? '알림 활성 중' : '알림 켜기';
}

// [기능 2] 오늘 일정 로드 (수희님 시트 헤더 기준)
async function loadSchedule() {
    const box = document.getElementById('today-deadline-votes');
    if (!box) return;
    try {
        const res = await axios.get('/api/schedule?type=schedule');
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const todayData = res.data.data.filter(item => item.date === today);
        
        box.innerHTML = todayData.map(item => `
            <div class="flex items-center gap-3 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 mb-2">
                <span class="text-cyan-400 font-bold text-xs">${item.time || '00:00'}</span>
                <span class="text-white text-xs font-medium line-clamp-1">${item.title}</span>
            </div>`).join('') || '<p class="text-gray-500 text-xs text-center py-10">오늘 일정이 없습니다.</p>';
    } catch (e) { console.error('일정 로드 실패'); }
}

// [기능 3] 모달 입력창 복구 (텅 빈 화면 해결!)
function openAddModal() {
    const modal = document.getElementById('add-modal');
    const content = document.getElementById('form-content');
    if (!modal || !content) return;

    // 현재 열린 탭 섹션 감지
    let activeTab = currentTab;
    if (document.getElementById('content-votes') && !document.getElementById('content-votes').classList.contains('hidden')) activeTab = 'votes';
    if (document.getElementById('content-radio') && !document.getElementById('content-radio').classList.contains('hidden')) activeTab = 'radio';

    let fields = '';
    if (activeTab === 'votes') {
        fields = `
            <input type="text" name="category" placeholder="플랫폼 (예: 뮤빗)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <input type="text" name="title" placeholder="투표 제목" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <input type="url" name="link" placeholder="링크 주소" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white">`;
    } else if (activeTab === 'radio') {
        fields = `
            <input type="text" name="category" placeholder="방송사 (예: MBC)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <input type="text" name="title" placeholder="프로그램/곡 제목" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3">
            <textarea name="description" placeholder="사연 내용" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white h-24"></textarea>`;
    } else {
        fields = `<p class="text-gray-400 text-center py-4">이 탭에서는 정보를 추가할 수 없습니다.</p>`;
    }

    content.innerHTML = fields;
    modal.classList.remove('hidden');
}

// [기타 필수 유틸리티]
function closeAddModal() { document.getElementById('add-modal').classList.add('hidden'); }
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-cyan-600 text-white font-bold rounded-full shadow-2xl animate-bounce';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    
    document.querySelectorAll('[id^="tab-"]').forEach(btn => btn.classList.remove('tab-active', 'text-cyan-300'));
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('tab-active', 'text-cyan-300');
}
