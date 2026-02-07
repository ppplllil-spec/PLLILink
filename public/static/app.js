// 전역 상태
let currentTab = 'votes';
let radioFilter = 'all';

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
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
        btn.classList.add('hover:bg-gray-100');
    });
    document.getElementById(`tab-${tab}`).classList.add('tab-active');
    document.getElementById(`tab-${tab}`).classList.remove('hover:bg-gray-100');
    
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

// 투표 목록 로드
async function loadVotes() {
    try {
        const response = await axios.get('/api/votes');
        const votes = response.data.data;
        
        const votesList = document.getElementById('votes-list');
        votesList.innerHTML = votes.map(vote => `
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-gray-800 flex-1">${escapeHtml(vote.title)}</h3>
                    <button onclick="deleteItem('votes', ${vote.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ${vote.platform ? `<span class="badge bg-purple-100 text-purple-700 mb-2">${escapeHtml(vote.platform)}</span>` : ''}
                ${vote.description ? `<p class="text-gray-600 mb-3">${escapeHtml(vote.description)}</p>` : ''}
                <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all mb-2">
                    <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
                </a>
                ${vote.deadline ? `<p class="text-sm text-gray-500"><i class="far fa-clock mr-1"></i>마감: ${new Date(vote.deadline).toLocaleString('ko-KR')}</p>` : ''}
                <button onclick="viewTips(${vote.id}, '${escapeHtml(vote.platform || 'General')}')" class="mt-2 text-sm text-purple-600 hover:text-purple-800">
                    <i class="fas fa-lightbulb mr-1"></i>이 투표의 팁 보기
                </button>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-500 py-8">등록된 투표가 없습니다.</div>';
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
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-gray-800 flex-1">${escapeHtml(ad.title)}</h3>
                    <button onclick="deleteItem('ad-requests', ${ad.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <span class="badge ${ad.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} mb-2">
                    ${ad.status === 'open' ? '모집중' : '진행중'}
                </span>
                <p class="text-gray-600 mb-2"><i class="fas fa-map-marker-alt mr-2"></i>${escapeHtml(ad.location)}</p>
                ${ad.description ? `<p class="text-gray-600 mb-3">${escapeHtml(ad.description)}</p>` : ''}
                ${ad.contact_info ? `<p class="text-sm text-gray-500 mb-2"><i class="fas fa-envelope mr-1"></i>${escapeHtml(ad.contact_info)}</p>` : ''}
                ${ad.deadline ? `<p class="text-sm text-gray-500"><i class="far fa-clock mr-1"></i>마감: ${new Date(ad.deadline).toLocaleString('ko-KR')}</p>` : ''}
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-500 py-8">등록된 광고 시안 요청이 없습니다.</div>';
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
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-gray-800 flex-1">${escapeHtml(radio.title)}</h3>
                    <button onclick="deleteItem('radio-requests', ${radio.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <span class="badge ${radio.country === 'domestic' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} mb-2">
                    ${radio.country === 'domestic' ? '국내' : '해외'}
                </span>
                <p class="text-lg font-semibold text-gray-700 mb-1">${escapeHtml(radio.station_name)}</p>
                ${radio.program_name ? `<p class="text-gray-600 mb-2">${escapeHtml(radio.program_name)}</p>` : ''}
                ${radio.description ? `<p class="text-gray-600 mb-3">${escapeHtml(radio.description)}</p>` : ''}
                ${radio.request_method ? `<p class="text-sm text-gray-500 mb-2"><i class="fas fa-phone mr-1"></i>신청방법: ${escapeHtml(radio.request_method)}</p>` : ''}
                ${radio.request_url ? `<a href="${escapeHtml(radio.request_url)}" target="_blank" class="block bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all">
                    <i class="fas fa-external-link-alt mr-2"></i>신청하러 가기
                </a>` : ''}
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-500 py-8">등록된 라디오 정보가 없습니다.</div>';
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
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge bg-indigo-100 text-indigo-700">${escapeHtml(tip.platform)}</span>
                            ${tip.is_verified ? '<i class="fas fa-check-circle text-green-500" title="검증됨"></i>' : ''}
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">${escapeHtml(tip.tip_title)}</h3>
                    </div>
                    <button onclick="deleteItem('tips', ${tip.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="text-gray-700 mb-3 whitespace-pre-wrap">${escapeHtml(tip.tip_content)}</p>
                <div class="flex items-center justify-between text-sm">
                    <button onclick="markHelpful(${tip.id})" class="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                        <i class="fas fa-thumbs-up"></i>
                        <span>도움됨 ${tip.helpful_count}</span>
                    </button>
                    <span class="text-gray-500">by ${escapeHtml(tip.created_by || '익명')}</span>
                </div>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-500 py-8">등록된 팁이 없습니다.</div>';
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
            <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="badge bg-indigo-100 text-indigo-700">${escapeHtml(tip.platform)}</span>
                            ${tip.is_verified ? '<i class="fas fa-check-circle text-green-500" title="검증됨"></i>' : ''}
                        </div>
                        <h3 class="text-xl font-bold text-gray-800">${escapeHtml(tip.tip_title)}</h3>
                    </div>
                    <button onclick="deleteItem('tips', ${tip.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <p class="text-gray-700 mb-3 whitespace-pre-wrap">${escapeHtml(tip.tip_content)}</p>
                <div class="flex items-center justify-between text-sm">
                    <button onclick="markHelpful(${tip.id})" class="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                        <i class="fas fa-thumbs-up"></i>
                        <span>도움됨 ${tip.helpful_count}</span>
                    </button>
                    <span class="text-gray-500">by ${escapeHtml(tip.created_by || '익명')}</span>
                </div>
            </div>
        `).join('') || '<div class="col-span-full text-center text-gray-500 py-8">이 투표에 대한 팁이 아직 없습니다.</div>';
    });
}

// 팁 도움됨 표시
async function markHelpful(tipId) {
    try {
        const userIdentifier = localStorage.getItem('userId') || generateUserId();
        await axios.post(`/api/tips/${tipId}/helpful`, { user_identifier: userIdentifier });
        alert('도움이 되었다고 표시했습니다!');
        loadTips();
    } catch (error) {
        if (error.response?.data?.error === 'Already reacted') {
            alert('이미 반응하셨습니다.');
        } else {
            alert('오류가 발생했습니다.');
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
    
    if (currentTab === 'votes') {
        fields = `
            <input type="text" name="title" placeholder="투표 제목" required class="w-full p-3 border rounded-lg">
            <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border rounded-lg" rows="3"></textarea>
            <input type="url" name="vote_url" placeholder="투표 링크" required class="w-full p-3 border rounded-lg">
            <input type="text" name="platform" placeholder="플랫폼 (예: Twitter, Mnet)" class="w-full p-3 border rounded-lg">
            <input type="datetime-local" name="deadline" placeholder="마감일시" class="w-full p-3 border rounded-lg">
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border rounded-lg">
        `;
    } else if (currentTab === 'ads') {
        fields = `
            <input type="text" name="title" placeholder="광고 제목" required class="w-full p-3 border rounded-lg">
            <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border rounded-lg" rows="3"></textarea>
            <input type="text" name="location" placeholder="위치" required class="w-full p-3 border rounded-lg">
            <input type="text" name="contact_info" placeholder="연락처 (선택)" class="w-full p-3 border rounded-lg">
            <input type="datetime-local" name="deadline" placeholder="마감일시" class="w-full p-3 border rounded-lg">
            <select name="status" class="w-full p-3 border rounded-lg">
                <option value="open">모집중</option>
                <option value="in_progress">진행중</option>
                <option value="closed">마감</option>
            </select>
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border rounded-lg">
        `;
    } else if (currentTab === 'radio') {
        fields = `
            <input type="text" name="title" placeholder="제목" required class="w-full p-3 border rounded-lg">
            <input type="text" name="station_name" placeholder="방송국 이름" required class="w-full p-3 border rounded-lg">
            <input type="text" name="program_name" placeholder="프로그램 이름 (선택)" class="w-full p-3 border rounded-lg">
            <input type="url" name="request_url" placeholder="신청 URL (선택)" class="w-full p-3 border rounded-lg">
            <input type="text" name="request_method" placeholder="신청 방법 (예: 앱, 문자)" class="w-full p-3 border rounded-lg">
            <select name="country" class="w-full p-3 border rounded-lg">
                <option value="domestic">국내</option>
                <option value="international">해외</option>
            </select>
            <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border rounded-lg" rows="3"></textarea>
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border rounded-lg">
        `;
    } else if (currentTab === 'tips') {
        fields = `
            <input type="text" name="platform" placeholder="플랫폼 (예: Twitter, Mnet, General)" required class="w-full p-3 border rounded-lg">
            <input type="text" name="tip_title" placeholder="팁 제목" required class="w-full p-3 border rounded-lg">
            <textarea name="tip_content" placeholder="팁 내용" required class="w-full p-3 border rounded-lg" rows="5"></textarea>
            <input type="text" name="created_by" placeholder="작성자 (선택)" class="w-full p-3 border rounded-lg">
        `;
    }
    
    formContent.innerHTML = fields;
    modal.classList.remove('hidden');
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
    const data = Object.fromEntries(formData.entries());
    
    try {
        let endpoint = '';
        if (currentTab === 'votes') endpoint = '/api/votes';
        else if (currentTab === 'ads') endpoint = '/api/ad-requests';
        else if (currentTab === 'radio') endpoint = '/api/radio-requests';
        else if (currentTab === 'tips') endpoint = '/api/tips';
        
        await axios.post(endpoint, data);
        
        closeAddModal();
        
        // 해당 탭의 데이터 새로고침
        if (currentTab === 'votes') loadVotes();
        else if (currentTab === 'ads') loadAds();
        else if (currentTab === 'radio') loadRadio();
        else if (currentTab === 'tips') loadTips();
        
        alert('등록되었습니다!');
    } catch (error) {
        alert('등록 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
});

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
        
        alert('삭제되었습니다.');
    } catch (error) {
        alert('삭제 실패: ' + (error.response?.data?.error || '알 수 없는 오류'));
    }
}

// XSS 방지를 위한 HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
