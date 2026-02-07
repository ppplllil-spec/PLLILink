// 전역 상태
let currentTab = 'schedule';
let radioFilter = 'all';
let isAutoFilling = false;

// 토스트 알림 시스템
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    const bgColor = type === 'success' ? 'from-green-500 to-green-600' : 
                    type === 'error' ? 'from-red-500 to-red-600' : 
                    'from-blue-500 to-blue-600';
    
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl bg-gradient-to-r ${bgColor} text-white font-bold transform transition-all duration-300 translate-x-full flex items-center gap-3 max-w-md`;
    toast.innerHTML = `
        <span class="text-2xl">${icon}</span>
        <span class="flex-1">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션: 슬라이드 인
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    
    // 3초 후 사라짐
    setTimeout(() => {
        toast.style.transform = 'translateX(150%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 링크 복사 함수
function copyLink(url, title = '') {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
            .then(() => {
                showToast('🔗 링크가 복사되었습니다!', 'success');
            })
            .catch(err => {
                showToast('복사에 실패했습니다', 'error');
                console.error('복사 실패:', err);
            });
    } else {
        // fallback: 텍스트 선택 방식
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('🔗 링크가 복사되었습니다!', 'success');
        } catch (err) {
            showToast('복사에 실패했습니다', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
    loadVotes();
    loadAds();
    loadRadio();
    loadTips();
});

// 탭 전환
function switchTab(tab) {
    currentTab = tab;
    
    // 탭 버튼 스타일 업데이트
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.remove('text-cyan-300');
        btn.classList.add('text-gray-300');
    });
    const activeTab = document.getElementById(`tab-${tab}`);
    activeTab.classList.add('tab-active');
    activeTab.classList.add('text-cyan-300');
    activeTab.classList.remove('text-gray-300');
    
    // 콘텐츠 표시/숨김
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`content-${tab}`).classList.remove('hidden');
}

// 라디오 필터
function filterRadio(filter) {
    radioFilter = filter;
    loadRadio();
}

// 오늘의 일정 로드
async function loadSchedule() {
    try {
        const response = await axios.get('/api/schedule/today');
        const schedule = response.data.data;
        
        // 날짜 표시
        const dateEl = document.getElementById('today-date');
        if (dateEl) {
            const date = new Date(schedule.date);
            dateEl.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 ${['일','월','화','수','목','금','토'][date.getDay()]}요일`;
        }
        
        // 오늘 마감 투표
        const deadlineVotesEl = document.getElementById('today-deadline-votes');
        if (deadlineVotesEl) {
            if (schedule.votes.deadline.length === 0) {
                deadlineVotesEl.innerHTML = '<div class="col-span-full text-center text-gray-400 py-4">오늘 마감인 투표가 없습니다</div>';
            } else {
                deadlineVotesEl.innerHTML = schedule.votes.deadline.map(vote => `
                    <div class="card rounded-xl shadow-lg p-5 border-2 border-red-500/50">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge bg-red-900/50 text-red-300 border-red-500">⏰ 마감 임박</span>
                            ${vote.platform ? `<span class="badge bg-cyan-900/50 text-cyan-300 border-cyan-500">${escapeHtml(vote.platform)}</span>` : ''}
                        </div>
                        <h4 class="text-lg font-bold text-cyan-300 mb-2">${escapeHtml(vote.title)}</h4>
                        ${vote.description ? `<p class="text-gray-300 text-sm mb-3">${escapeHtml(vote.description)}</p>` : ''}
                        <p class="text-sm text-red-400 mb-2">
                            <i class="far fa-clock mr-1"></i>
                            마감: ${new Date(vote.deadline).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                        <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block cyber-link text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all font-bold text-sm">
                            <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
                        </a>
                    </div>
                `).join('');
            }
        }
        
        // 매일 반복 투표
        const recurringVotesEl = document.getElementById('today-recurring-votes');
        if (recurringVotesEl) {
            if (schedule.votes.recurring.length === 0) {
                recurringVotesEl.innerHTML = '<div class="col-span-full text-center text-gray-400 py-4">오늘 반복 투표가 없습니다</div>';
            } else {
                recurringVotesEl.innerHTML = schedule.votes.recurring.map(vote => {
                    const isPast = vote.timeStatus === 'past';
                    const isUpcoming = vote.timeStatus === 'upcoming';
                    const isAllDay = vote.timeStatus === 'all-day';
                    const opacity = isPast ? 'opacity-50' : 'opacity-100';
                    
                    let timeDisplay = '';
                    if (isAllDay) {
                        timeDisplay = '<span class="badge bg-indigo-900/50 text-indigo-300 border-indigo-500"><i class="fas fa-infinity mr-1"></i>하루 종일</span>';
                    } else if (vote.recurrence_start_time && vote.recurrence_end_time) {
                        timeDisplay = `<p class="text-sm ${isPast ? 'text-gray-500' : isUpcoming ? 'text-yellow-400' : 'text-purple-400'} mb-2">
                            <i class="far fa-clock mr-1"></i>
                            ${vote.recurrence_start_time} ~ ${vote.recurrence_end_time}
                            ${isPast ? ' (종료됨)' : isUpcoming ? ' (예정)' : ' (진행중)'}
                        </p>`;
                    } else if (vote.recurrence_time) {
                        timeDisplay = `<p class="text-sm text-purple-400 mb-2"><i class="far fa-clock mr-1"></i>매일 ${vote.recurrence_time}</p>`;
                    }
                    
                    return `
                        <div class="card rounded-xl shadow-lg p-5 ${opacity} transition-opacity">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="badge bg-purple-900/50 text-purple-300 border-purple-500"><i class="fas fa-sync-alt mr-1"></i>반복</span>
                                ${vote.platform ? `<span class="badge bg-cyan-900/50 text-cyan-300 border-cyan-500">${escapeHtml(vote.platform)}</span>` : ''}
                                ${isPast ? '<span class="badge bg-gray-700/50 text-gray-400 border-gray-600"><i class="fas fa-check mr-1"></i>종료</span>' : ''}
                                ${isUpcoming ? '<span class="badge bg-yellow-900/50 text-yellow-300 border-yellow-500"><i class="fas fa-hourglass-start mr-1"></i>예정</span>' : ''}
                            </div>
                            <h4 class="text-lg font-bold ${isPast ? 'text-gray-400' : 'text-cyan-300'} mb-2">${escapeHtml(vote.title)}</h4>
                            ${vote.description ? `<p class="${isPast ? 'text-gray-500' : 'text-gray-300'} text-sm mb-3">${escapeHtml(vote.description)}</p>` : ''}
                            ${timeDisplay}
                            <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block cyber-link text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all font-bold text-sm ${isPast ? 'opacity-50 pointer-events-none' : ''}">
                                <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
                            </a>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // 오늘 라디오 요청
        const todayRadioEl = document.getElementById('today-radio');
        if (todayRadioEl) {
            const allRadio = [...schedule.radio.specific, ...schedule.radio.recurring];
            if (allRadio.length === 0) {
                todayRadioEl.innerHTML = '<div class="col-span-full text-center text-gray-400 py-4">오늘 라디오 요청이 없습니다</div>';
            } else {
                todayRadioEl.innerHTML = allRadio.map(radio => {
                    const isPast = radio.timeStatus === 'past';
                    const isUpcoming = radio.timeStatus === 'upcoming';
                    const isAllDay = radio.timeStatus === 'all-day';
                    const opacity = isPast ? 'opacity-50' : 'opacity-100';
                    
                    let timeDisplay = '';
                    if (isAllDay) {
                        timeDisplay = '<span class="badge bg-indigo-900/50 text-indigo-300 border-indigo-500"><i class="fas fa-infinity mr-1"></i>하루 종일</span>';
                    } else if (radio.recurrence_start_time && radio.recurrence_end_time) {
                        timeDisplay = `<p class="text-sm ${isPast ? 'text-gray-500' : isUpcoming ? 'text-yellow-400' : 'text-green-400'} mb-2">
                            <i class="far fa-clock mr-1"></i>
                            ${radio.recurrence_start_time} ~ ${radio.recurrence_end_time}
                            ${isPast ? ' (종료됨)' : isUpcoming ? ' (예정)' : ' (진행중)'}
                        </p>`;
                    } else if (radio.request_time) {
                        timeDisplay = `<p class="text-sm text-green-400 mb-2"><i class="far fa-clock mr-1"></i>${radio.request_time}</p>`;
                    }
                    
                    return `
                        <div class="card rounded-xl shadow-lg p-5 ${opacity} transition-opacity">
                            <div class="flex items-center gap-2 mb-2 flex-wrap">
                                ${radio.schedule_type === 'recurring' ? 
                                    '<span class="badge bg-purple-900/50 text-purple-300 border-purple-500"><i class="fas fa-sync-alt mr-1"></i>반복</span>' :
                                    '<span class="badge bg-green-900/50 text-green-300 border-green-500"><i class="fas fa-calendar-day mr-1"></i>특정일</span>'
                                }
                                <span class="badge ${radio.country === 'domestic' ? 'bg-blue-900/50 text-blue-300 border-blue-500' : 'bg-green-900/50 text-green-300 border-green-500'}">
                                    ${radio.country === 'domestic' ? '국내' : '해외'}
                                </span>
                                ${isPast ? '<span class="badge bg-gray-700/50 text-gray-400 border-gray-600"><i class="fas fa-check mr-1"></i>종료</span>' : ''}
                                ${isUpcoming ? '<span class="badge bg-yellow-900/50 text-yellow-300 border-yellow-500"><i class="fas fa-hourglass-start mr-1"></i>예정</span>' : ''}
                            </div>
                            <h4 class="text-lg font-bold ${isPast ? 'text-gray-400' : 'text-cyan-400'} mb-1">${escapeHtml(radio.station_name)}</h4>
                            ${radio.program_name ? `<p class="${isPast ? 'text-gray-500' : 'text-gray-300'} text-sm mb-2">${escapeHtml(radio.program_name)}</p>` : ''}
                            ${timeDisplay}
                            ${radio.description ? `<p class="text-gray-400 text-xs mb-3">${escapeHtml(radio.description)}</p>` : ''}
                            ${radio.request_url ? `<a href="${escapeHtml(radio.request_url)}" target="_blank" class="block cyber-link text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all font-bold text-sm ${isPast ? 'opacity-50 pointer-events-none' : ''}">
                                <i class="fas fa-external-link-alt mr-2"></i>신청하러 가기
                            </a>` : ''}
                        </div>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('일정 로드 실패:', error);
    }
}


// 투표 목록 로드
async function loadVotes() {
    try {
        const response = await axios.get('/api/votes');
        const votes = response.data.data;
        
        const votesList = document.getElementById('votes-list');
        votesList.innerHTML = votes.map(vote => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-cyan-300 flex-1">${escapeHtml(vote.title)}</h3>
                    <div class="flex gap-2">
                        <button onclick="copyLink('${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="text-green-400 hover:text-green-300 transition-colors" title="링크 복사">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="editItem('votes', ${vote.id})" class="text-cyan-400 hover:text-cyan-300 transition-colors" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteItem('votes', ${vote.id})" class="text-red-400 hover:text-red-300 transition-colors" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${vote.platform ? `<span class="badge bg-cyan-900/50 text-cyan-300 border-cyan-500 mb-2">${escapeHtml(vote.platform)}</span>` : ''}
                ${vote.description ? `<p class="text-gray-300 mb-3">${escapeHtml(vote.description)}</p>` : ''}
                <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block cyber-link text-white text-center py-3 px-4 rounded-lg hover:shadow-lg transition-all mb-2 font-bold">
                    <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
                </a>
                ${vote.deadline ? `<p class="text-sm text-gray-400"><i class="far fa-clock mr-1"></i>마감: ${new Date(vote.deadline).toLocaleString('ko-KR')}</p>` : ''}
                <button onclick="viewTips(${vote.id}, '${escapeHtml(vote.platform || 'General')}')" class="mt-3 text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                    <i class="fas fa-lightbulb mr-1"></i>이 투표의 팁 보기
                </button>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-400 py-8 font-bold">등록된 투표가 없습니다.</div>';
    } catch (error) {
        console.error('투표 로드 실패:', error);
    }
}

// 광고 시안 요청 로드
async function loadAds() {
    try {
        const response = await axios.get('/api/ad-requests');
        const ads = response.data.data;
        
        const adsList = document.getElementById('ads-list');
        adsList.innerHTML = ads.map(ad => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-cyan-300 flex-1">${escapeHtml(ad.title)}</h3>
                    <button onclick="deleteItem('ad-requests', ${ad.id})" class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <span class="badge ${ad.status === 'open' ? 'bg-green-900/50 text-green-300 border-green-500' : 'bg-yellow-900/50 text-yellow-300 border-yellow-500'} mb-2">
                    ${ad.status === 'open' ? '모집중' : '진행중'}
                </span>
                <p class="text-gray-300 mb-2"><i class="fas fa-map-marker-alt mr-2 text-cyan-400"></i>${escapeHtml(ad.location)}</p>
                ${ad.description ? `<p class="text-gray-300 mb-3">${escapeHtml(ad.description)}</p>` : ''}
                ${ad.contact_info ? `<p class="text-sm text-gray-400 mb-2"><i class="fas fa-envelope mr-1 text-purple-400"></i>${escapeHtml(ad.contact_info)}</p>` : ''}
                ${ad.deadline ? `<p class="text-sm text-gray-400"><i class="far fa-clock mr-1"></i>마감: ${new Date(ad.deadline).toLocaleString('ko-KR')}</p>` : ''}
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-400 py-8 font-bold">등록된 광고 시안 요청이 없습니다.</div>';
    } catch (error) {
        console.error('광고 로드 실패:', error);
    }
}

// 라디오 신청 정보 로드
async function loadRadio() {
    try {
        const url = radioFilter === 'all' ? '/api/radio-requests' : `/api/radio-requests?country=${radioFilter}`;
        const response = await axios.get(url);
        const radios = response.data.data;
        
        const radioList = document.getElementById('radio-list');
        radioList.innerHTML = radios.map(radio => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-cyan-300 flex-1">${escapeHtml(radio.title)}</h3>
                    <button onclick="deleteItem('radio-requests', ${radio.id})" class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <span class="badge ${radio.country === 'domestic' ? 'bg-blue-900/50 text-blue-300 border-blue-500' : 'bg-green-900/50 text-green-300 border-green-500'} mb-2">
                    ${radio.country === 'domestic' ? '국내' : '해외'}
                </span>
                <p class="text-lg font-semibold text-cyan-400 mb-1">${escapeHtml(radio.station_name)}</p>
                ${radio.program_name ? `<p class="text-gray-300 mb-2">${escapeHtml(radio.program_name)}</p>` : ''}
                ${radio.description ? `<p class="text-gray-300 mb-3">${escapeHtml(radio.description)}</p>` : ''}
                ${radio.request_method ? `<p class="text-sm text-gray-400 mb-2"><i class="fas fa-phone mr-1 text-purple-400"></i>신청방법: ${escapeHtml(radio.request_method)}</p>` : ''}
                <div class="flex gap-2">
                    ${radio.request_url ? `<a href="${escapeHtml(radio.request_url)}" target="_blank" class="flex-1 cyber-link text-white text-center py-3 px-4 rounded-lg hover:shadow-lg transition-all font-bold">
                        <i class="fas fa-external-link-alt mr-2"></i>신청하러 가기
                    </a>` : ''}
                    ${radio.country === 'international' ? `<button onclick="showRadioTemplate('${escapeHtml(radio.station_name)}')" class="px-4 py-3 rounded-lg font-bold border-2 border-purple-500 text-purple-300 hover:bg-purple-900/30 transition-all">
                        <i class="fas fa-comment-dots mr-1"></i>예시문
                    </button>` : ''}
                </div>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-400 py-8 font-bold">등록된 라디오 정보가 없습니다.</div>';
    } catch (error) {
        console.error('라디오 로드 실패:', error);
    }
}

// 팁 목록 로드
async function loadTips() {
    try {
        const response = await axios.get('/api/tips');
        const tips = response.data.data;
        
        const tipsList = document.getElementById('tips-list');
        tipsList.innerHTML = tips.map(tip => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge bg-indigo-900/50 text-indigo-300 border-indigo-500">${escapeHtml(tip.platform)}</span>
                            ${tip.is_verified ? '<i class="fas fa-check-circle text-green-400" title="검증됨" style="text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);"></i>' : ''}
                        </div>
                        <h3 class="text-xl font-bold text-cyan-300">${escapeHtml(tip.tip_title)}</h3>
                    </div>
                    <button onclick="deleteItem('tips', ${tip.id})" class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="text-gray-300 mb-3 whitespace-pre-wrap">${escapeHtml(tip.tip_content)}</p>
                <div class="flex items-center justify-between text-sm border-t border-cyan-900/30 pt-3">
                    <button onclick="markHelpful(${tip.id})" class="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                        <i class="fas fa-thumbs-up"></i>
                        <span>도움됨 ${tip.helpful_count}</span>
                    </button>
                    <span class="text-gray-400">by ${escapeHtml(tip.created_by || '익명')}</span>
                </div>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-400 py-8 font-bold">등록된 팁이 없습니다.</div>';
    } catch (error) {
        console.error('팁 로드 실패:', error);
    }
}

// 특정 투표의 팁 보기
function viewTips(voteId, platform) {
    switchTab('tips');
    // 필터링 로직은 서버에서 처리하도록 수정 가능
    axios.get(`/api/tips?vote_id=${voteId}`).then(response => {
        const tips = response.data.data;
        const tipsList = document.getElementById('tips-list');
        tipsList.innerHTML = tips.map(tip => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02]">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge bg-indigo-900/50 text-indigo-300 border-indigo-500">${escapeHtml(tip.platform)}</span>
                            ${tip.is_verified ? '<i class="fas fa-check-circle text-green-400" title="검증됨" style="text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);"></i>' : ''}
                        </div>
                        <h3 class="text-xl font-bold text-cyan-300">${escapeHtml(tip.tip_title)}</h3>
                    </div>
                    <button onclick="deleteItem('tips', ${tip.id})" class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="text-gray-300 mb-3 whitespace-pre-wrap">${escapeHtml(tip.tip_content)}</p>
                <div class="flex items-center justify-between text-sm border-t border-cyan-900/30 pt-3">
                    <button onclick="markHelpful(${tip.id})" class="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                        <i class="fas fa-thumbs-up"></i>
                        <span>도움됨 ${tip.helpful_count}</span>
                    </button>
                    <span class="text-gray-400">by ${escapeHtml(tip.created_by || '익명')}</span>
                </div>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-400 py-8 font-bold">이 투표에 대한 팁이 아직 없습니다.</div>';
    });
}

// 팁 도움됨 표시
async function markHelpful(tipId) {
    try {
        const userIdentifier = localStorage.getItem('userId') || generateUserId();
        await axios.post(`/api/tips/${tipId}/helpful`, { user_identifier: userIdentifier });
        showToast('도움이 되었다고 표시했습니다!', 'success');
        loadTips();
    } catch (error) {
        if (error.response?.data?.error === 'Already reacted') {
            showToast('이미 반응하셨습니다.', 'info');
        } else {
            showToast('오류가 발생했습니다.', 'error');
        }
    }
}

// 사용자 ID 생성
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('userId', userId);
    return userId;
}

// 모달 열기
function openAddModal() {
    const modal = document.getElementById('add-modal');
    const formContent = document.getElementById('form-content');
    
    let fields = '';
    
    if (currentTab === 'votes' || currentTab === 'schedule') {
        fields = `
            <div>
                <input type="text" name="title" placeholder="투표 제목" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="3"></textarea>
            </div>
            <div>
                <input type="url" name="vote_url" placeholder="투표 링크 (URL 입력 후 다른 곳 클릭하면 자동 인식)" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <p class="text-xs text-gray-500 mt-1"><i class="fas fa-magic mr-1 text-cyan-400"></i>링크를 입력하고 다른 곳을 클릭하면 자동으로 정보를 불러옵니다</p>
            </div>
            <div>
                <input type="text" name="platform" placeholder="플랫폼 (예: Twitter, Mnet)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <input type="datetime-local" name="deadline" placeholder="마감일시 (일회성 투표)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div class="border-t border-cyan-900/30 pt-4 mt-2">
                <label class="flex items-center gap-2 text-cyan-300 mb-3">
                    <input type="checkbox" id="is_recurring" name="is_recurring" value="1" class="w-4 h-4" onchange="toggleRecurringFields()">
                    <i class="fas fa-sync-alt"></i>
                    <span class="font-bold">매일 반복 투표 설정</span>
                </label>
                <div id="recurring-fields" class="hidden space-y-3">
                    <div>
                        <label class="text-sm text-gray-400 mb-1 block">투표 시간 (선택)</label>
                        <input type="time" name="recurrence_time" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-sm text-gray-400 mb-1 block">시작 시간 (선택)</label>
                            <input type="time" name="recurrence_start_time" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        </div>
                        <div>
                            <label class="text-sm text-gray-400 mb-1 block">종료 시간 (선택)</label>
                            <input type="time" name="recurrence_end_time" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        </div>
                    </div>
                    <p class="text-xs text-gray-500">* 시작/종료 시간을 입력하지 않으면 하루 종일 표시됩니다</p>
                    <div>
                        <label class="text-sm text-gray-400 mb-2 block">반복 요일 (선택)</label>
                        <div class="grid grid-cols-7 gap-2">
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="mon" class="w-4 h-4">
                                <span class="text-xs text-gray-400">월</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="tue" class="w-4 h-4">
                                <span class="text-xs text-gray-400">화</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="wed" class="w-4 h-4">
                                <span class="text-xs text-gray-400">수</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="thu" class="w-4 h-4">
                                <span class="text-xs text-gray-400">목</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="fri" class="w-4 h-4">
                                <span class="text-xs text-gray-400">금</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="sat" class="w-4 h-4">
                                <span class="text-xs text-gray-400">토</span>
                            </label>
                            <label class="flex flex-col items-center gap-1">
                                <input type="checkbox" name="recurrence_days[]" value="sun" class="w-4 h-4">
                                <span class="text-xs text-gray-400">일</span>
                            </label>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">* 선택 안하면 매일 반복됩니다</p>
                    </div>
                </div>
            </div>
            <div>
                <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
        `;
    } else if (currentTab === 'ads') {
        fields = `
            <input type="text" name="title" placeholder="광고 제목" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="3"></textarea>
            <input type="text" name="location" placeholder="위치" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <input type="text" name="contact_info" placeholder="연락처 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <input type="datetime-local" name="deadline" placeholder="마감일시" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <select name="status" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <option value="open">모집중</option>
                <option value="in_progress">진행중</option>
                <option value="closed">마감</option>
            </select>
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
        `;
    } else if (currentTab === 'radio') {
        fields = `
            <div>
                <input type="text" name="title" placeholder="제목" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <input type="text" name="station_name" placeholder="방송국 이름" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <input type="text" name="program_name" placeholder="프로그램 이름 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <input type="url" name="request_url" placeholder="신청 URL (URL 입력 후 다른 곳 클릭하면 자동 인식)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <p class="text-xs text-gray-500 mt-1"><i class="fas fa-magic mr-1 text-cyan-400"></i>링크를 입력하고 다른 곳을 클릭하면 자동으로 정보를 불러옵니다</p>
            </div>
            <div>
                <input type="text" name="request_method" placeholder="신청 방법 (예: 앱, 문자)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
            <div>
                <select name="country" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    <option value="domestic">국내</option>
                    <option value="international">해외</option>
                </select>
            </div>
            <div>
                <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="3"></textarea>
            </div>
            <div>
                <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            </div>
        `;
    } else if (currentTab === 'tips') {
        fields = `
            <input type="text" name="platform" placeholder="플랫폼 (예: Twitter, Mnet, General)" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <input type="text" name="tip_title" placeholder="팁 제목" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
            <textarea name="tip_content" placeholder="팁 내용" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="5"></textarea>
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
        `;
    }
    
    formContent.innerHTML = fields;
    modal.classList.remove('hidden');
    
    // URL 자동 인식 기능 활성화
    setTimeout(() => {
        attachUrlAutoFill();
    }, 100);
}

// 모달 닫기
function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
    document.getElementById('add-form').reset();
}

// 폼 제출
document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    
    // 일반 필드 처리
    for (const [key, value] of formData.entries()) {
        if (key === 'recurrence_days[]') continue; // 따로 처리
        data[key] = value;
    }
    
    // 반복 요일 처리
    const recurrenceDays = formData.getAll('recurrence_days[]');
    if (recurrenceDays.length > 0) {
        data.recurrence_days = JSON.stringify(recurrenceDays);
        data.recurrence_type = 'weekly';
    } else if (data.is_recurring) {
        data.recurrence_type = 'daily';
    }
    
    // is_recurring 체크박스 처리
    data.is_recurring = data.is_recurring ? 1 : 0;
    
    try {
        let endpoint = '';
        if (currentTab === 'votes' || currentTab === 'schedule') endpoint = '/api/votes';
        else if (currentTab === 'ads') endpoint = '/api/ad-requests';
        else if (currentTab === 'radio') endpoint = '/api/radio-requests';
        else if (currentTab === 'tips') endpoint = '/api/tips';
        
        await axios.post(endpoint, data);
        
        closeAddModal();
        
        // 해당 탭의 데이터 새로고침
        if (currentTab === 'votes') loadVotes();
        else if (currentTab === 'schedule') loadSchedule();
        else if (currentTab === 'ads') loadAds();
        else if (currentTab === 'radio') loadRadio();
        else if (currentTab === 'tips') loadTips();
        
        showToast('등록되었습니다!', 'success');
    } catch (error) {
        showToast('등록 실패: ' + (error.response?.data?.error || '알 수 없는 오류'), 'error');
    }
});

// 항목 삭제
// 항목 수정
async function editItem(type, id) {
    try {
        // 기존 데이터 가져오기
        const response = await axios.get(`/api/${type}/${id}`);
        const item = response.data.data;
        
        const newTitle = prompt('제목', item.title);
        if (!newTitle) return;
        
        const newDescription = prompt('설명', item.description || '');
        
        // 수정 요청
        const updateData = {
            title: newTitle,
            description: newDescription
        };
        
        // type별 추가 필드
        if (type === 'votes') {
            updateData.vote_url = item.vote_url;
            updateData.deadline = item.deadline;
            updateData.platform = item.platform;
        }
        
        await axios.put(`/api/${type}/${id}`, updateData);
        
        // 데이터 새로고침
        if (type === 'votes') loadVotes();
        else if (type === 'ad-requests') loadAds();
        else if (type === 'radio-requests') loadRadio();
        else if (type === 'tips') loadTips();
        
        showToast('수정되었습니다.', 'success');
    } catch (error) {
        console.error('Edit error:', error);
        showToast('수정 실패: ' + (error.response?.data?.error || '알 수 없는 오류'), 'error');
    }
}

// 항목 삭제
async function deleteItem(type, id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        await axios.delete(`/api/${type}/${id}`);
        
        // 데이터 새로고침
        if (type === 'votes') loadVotes();
        else if (type === 'ad-requests') loadAds();
        else if (type === 'radio-requests') loadRadio();
        else if (type === 'tips') loadTips();
        
        showToast('삭제되었습니다.', 'success');
    } catch (error) {
        showToast('삭제 실패: ' + (error.response?.data?.error || '알 수 없는 오류'), 'error');
    }
}

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 반복 필드 토글
function toggleRecurringFields() {
    const checkbox = document.getElementById('is_recurring');
    const fields = document.getElementById('recurring-fields');
    if (checkbox && fields) {
        if (checkbox.checked) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }
}


// URL 메타데이터 자동 추출
async function fetchUrlMetadata(url) {
    if (!url || isAutoFilling) return null;
    
    try {
        isAutoFilling = true;
        
        // 로딩 표시
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'url-loading';
        loadingIndicator.className = 'text-cyan-400 text-sm mt-2 flex items-center gap-2';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 링크 정보를 불러오는 중...';
        
        const urlInput = document.querySelector('input[name="vote_url"], input[name="request_url"]');
        if (urlInput && urlInput.parentElement) {
            const existing = document.getElementById('url-loading');
            if (existing) existing.remove();
            urlInput.parentElement.appendChild(loadingIndicator);
        }
        
        const response = await axios.post('/api/utils/fetch-metadata', { url });
        
        if (response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error('메타데이터 추출 실패:', error);
        return null;
    } finally {
        isAutoFilling = false;
        const loadingIndicator = document.getElementById('url-loading');
        if (loadingIndicator) loadingIndicator.remove();
    }
}

// URL 입력 필드에 자동 인식 기능 추가
function attachUrlAutoFill() {
    // 투표 URL 필드
    const voteUrlInput = document.querySelector('input[name="vote_url"]');
    if (voteUrlInput) {
        voteUrlInput.addEventListener('blur', async (e) => {
            const url = e.target.value.trim();
            if (!url) return;
            
            const metadata = await fetchUrlMetadata(url);
            if (metadata) {
                const titleInput = document.querySelector('input[name="title"]');
                const descInput = document.querySelector('textarea[name="description"]');
                const platformInput = document.querySelector('input[name="platform"]');
                
                // 제목이 비어있으면 자동 입력
                if (titleInput && !titleInput.value) {
                    titleInput.value = metadata.title || '';
                    titleInput.classList.add('border-cyan-500');
                    setTimeout(() => titleInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 설명이 비어있으면 자동 입력
                if (descInput && !descInput.value) {
                    descInput.value = metadata.description || '';
                    descInput.classList.add('border-cyan-500');
                    setTimeout(() => descInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 플랫폼이 비어있으면 사이트 이름으로 자동 입력
                if (platformInput && !platformInput.value && metadata.site_name) {
                    platformInput.value = metadata.site_name;
                    platformInput.classList.add('border-cyan-500');
                    setTimeout(() => platformInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 성공 메시지
                const successMsg = document.createElement('div');
                successMsg.className = 'text-green-400 text-sm mt-2 flex items-center gap-2';
                successMsg.innerHTML = '<i class="fas fa-check-circle"></i> 링크 정보가 자동으로 입력되었습니다!';
                e.target.parentElement.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            }
        });
    }
    
    // 라디오 URL 필드
    const radioUrlInput = document.querySelector('input[name="request_url"]');
    if (radioUrlInput) {
        radioUrlInput.addEventListener('blur', async (e) => {
            const url = e.target.value.trim();
            if (!url) return;
            
            const metadata = await fetchUrlMetadata(url);
            if (metadata) {
                const titleInput = document.querySelector('input[name="title"]');
                const stationInput = document.querySelector('input[name="station_name"]');
                const descInput = document.querySelector('textarea[name="description"]');
                
                // 제목이 비어있으면 자동 입력
                if (titleInput && !titleInput.value) {
                    titleInput.value = metadata.title || '';
                    titleInput.classList.add('border-cyan-500');
                    setTimeout(() => titleInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 방송국이 비어있으면 사이트 이름으로 자동 입력
                if (stationInput && !stationInput.value && metadata.site_name) {
                    stationInput.value = metadata.site_name;
                    stationInput.classList.add('border-cyan-500');
                    setTimeout(() => stationInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 설명이 비어있으면 자동 입력
                if (descInput && !descInput.value) {
                    descInput.value = metadata.description || '';
                    descInput.classList.add('border-cyan-500');
                    setTimeout(() => descInput.classList.remove('border-cyan-500'), 2000);
                }
                
                // 성공 메시지
                const successMsg = document.createElement('div');
                successMsg.className = 'text-green-400 text-sm mt-2 flex items-center gap-2';
                successMsg.innerHTML = '<i class="fas fa-check-circle"></i> 링크 정보가 자동으로 입력되었습니다!';
                e.target.parentElement.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            }
        });
    }
}

// 라디오 예시문 표시
async function showRadioTemplate(stationName) {
    try {
        const response = await axios.get(`/api/radio-templates/station/${encodeURIComponent(stationName)}`);
        const templates = response.data.templates;
        
        if (!templates || templates.length === 0) {
            showToast('이 방송국의 예시문이 아직 등록되지 않았습니다.', 'info');
            return;
        }
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'template-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
        modal.style.backdropFilter = 'blur(10px)';
        
        modal.innerHTML = `
            <div class="card rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-black neon-text">
                        <i class="fas fa-comment-dots mr-2"></i>${escapeHtml(stationName)} 신청 예시문
                    </h2>
                    <button onclick="closeTemplateModal()" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                        <i class="fas fa-times text-3xl"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    ${templates.map((template, index) => `
                        <div class="card rounded-xl p-5 border border-cyan-900/50">
                            <div class="mb-4">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="badge bg-purple-900/50 text-purple-300 border-purple-500">
                                        ${template.language === 'ko' ? '한국어' : 'English'}
                                    </span>
                                    <span class="badge bg-cyan-900/50 text-cyan-300 border-cyan-500">
                                        ${template.template_type === 'request' ? '신청' : '헌정'}
                                    </span>
                                </div>
                                
                                <!-- 입력 필드 -->
                                <div class="space-y-3 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold text-cyan-300 mb-1">
                                            아티스트명
                                        </label>
                                        <input 
                                            type="text" 
                                            id="artist-${index}" 
                                            placeholder="PLAVE" 
                                            value="PLAVE"
                                            class="w-full px-4 py-2 rounded-lg bg-gray-900/50 border border-cyan-800/50 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                        >
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-cyan-300 mb-1">
                                            곡명
                                        </label>
                                        <input 
                                            type="text" 
                                            id="song-${index}" 
                                            placeholder="Way 4 Luv" 
                                            value="Way 4 Luv"
                                            class="w-full px-4 py-2 rounded-lg bg-gray-900/50 border border-cyan-800/50 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                                        >
                                    </div>
                                </div>
                                
                                <!-- 생성된 텍스트 -->
                                <div class="relative">
                                    <label class="block text-sm font-bold text-cyan-300 mb-2">
                                        <i class="fas fa-magic mr-1"></i>생성된 신청문
                                    </label>
                                    <textarea 
                                        id="generated-${index}" 
                                        readonly
                                        class="w-full px-4 py-3 rounded-lg bg-gray-900/80 border-2 border-purple-500/50 text-white font-mono text-sm whitespace-pre-wrap"
                                        rows="4"
                                    >${escapeHtml(template.example_text || template.template_text)}</textarea>
                                    
                                    <div class="flex gap-2 mt-3">
                                        <button 
                                            onclick="updateTemplate(${index}, ${template.id}, '${escapeHtml(template.template_text)}')" 
                                            class="flex-1 px-4 py-2 rounded-lg font-bold border-2 border-purple-500 text-purple-300 hover:bg-purple-900/30 transition-all"
                                        >
                                            <i class="fas fa-sync-alt mr-2"></i>업데이트
                                        </button>
                                        <button 
                                            onclick="copyToClipboard('generated-${index}')" 
                                            class="flex-1 neon-button text-white px-4 py-2 rounded-lg font-bold"
                                        >
                                            <i class="fas fa-copy mr-2"></i>복사하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            ${template.example_text ? `
                                <div class="mt-4 pt-4 border-t border-cyan-900/30">
                                    <p class="text-xs text-gray-400">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        위 입력 필드를 수정하면 자동으로 텍스트가 업데이트됩니다
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-6 pt-4 border-t border-cyan-900/30">
                    <button onclick="closeTemplateModal()" class="w-full px-6 py-3 rounded-xl font-bold border-2 border-gray-600 text-gray-300 hover:bg-gray-800/50 transition-all">
                        닫기
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 각 템플릿의 입력 필드에 이벤트 리스너 추가
        templates.forEach((template, index) => {
            const artistInput = document.getElementById(`artist-${index}`);
            const songInput = document.getElementById(`song-${index}`);
            
            if (artistInput && songInput) {
                const updateText = () => {
                    let text = template.template_text;
                    text = text.replace(/\{\{artist_name\}\}/g, artistInput.value || 'PLAVE');
                    text = text.replace(/\{\{song_name\}\}/g, songInput.value || 'Way 4 Luv');
                    document.getElementById(`generated-${index}`).value = text;
                };
                
                artistInput.addEventListener('input', updateText);
                songInput.addEventListener('input', updateText);
            }
        });
        
    } catch (error) {
        console.error('템플릿 로드 실패:', error);
        showToast('예시문을 불러오는데 실패했습니다.', 'error');
    }
}

// 템플릿 업데이트
function updateTemplate(index, templateId, templateText) {
    const artistInput = document.getElementById(`artist-${index}`);
    const songInput = document.getElementById(`song-${index}`);
    
    let text = templateText;
    text = text.replace(/\{\{artist_name\}\}/g, artistInput.value || 'PLAVE');
    text = text.replace(/\{\{song_name\}\}/g, songInput.value || 'Way 4 Luv');
    
    document.getElementById(`generated-${index}`).value = text;
}

// 클립보드에 복사
async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        await navigator.clipboard.writeText(element.value);
        
        // 성공 메시지 표시
        const button = event.target.closest('button');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-2"></i>복사 완료!';
        button.classList.add('bg-green-600');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('bg-green-600');
        }, 2000);
    } catch (err) {
        console.error('복사 실패:', err);
        showToast('복사에 실패했습니다. 수동으로 복사해주세요.', 'error');
    }
}

// 템플릿 모달 닫기
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) modal.remove();
}

// 로그인 모달 열기
function openLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

// 로그인 모달 닫기
function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('login-form').reset();
}

// 로그인 처리
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const passwordHash = await hashPassword(password);
        
        const response = await axios.post('/api/auth/login', {
            username,
            password
        });
        
        if (response.data.success) {
            currentUser = response.data.user;
            sessionToken = response.data.session_token;
            localStorage.setItem('session_token', sessionToken);
            
            updateAuthUI();
            closeLoginModal();
            showToast(`환영합니다, ${currentUser.display_name}님!`, 'success');
        } else {
            showToast(response.data.error || '로그인에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('로그인에 실패했습니다: ' + (error.response?.data?.error || error.message), 'error');
    }
});

// 로그아웃
async function logout() {
    if (!confirm('로그아웃하시겠습니까?')) return;
    
    try {
        if (sessionToken) {
            await axios.post('/api/auth/logout', {
                session_token: sessionToken
            });
        }
        
        currentUser = null;
        sessionToken = null;
        localStorage.removeItem('session_token');
        
        updateAuthUI();
        showToast('로그아웃되었습니다.', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// 비밀번호 확인 모달
let passwordCallback = null;

function openPasswordModal(callback) {
    passwordCallback = callback;
    document.getElementById('password-modal').classList.remove('hidden');
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('password-form').reset();
    passwordCallback = null;
}

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('verify-password').value;
    
    if (passwordCallback) {
        await passwordCallback(password);
        closePasswordModal();
    }
});
