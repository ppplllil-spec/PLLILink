// 전역 상태
let currentTab = 'votes';
let radioFilter = 'all';
let isAutoFilling = false;

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
                    <button onclick="deleteItem('votes', ${vote.id})" class="text-red-400 hover:text-red-300 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
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
                ${radio.request_url ? `<a href="${escapeHtml(radio.request_url)}" target="_blank" class="block cyber-link text-white text-center py-3 px-4 rounded-lg hover:shadow-lg transition-all font-bold">
                    <i class="fas fa-external-link-alt mr-2"></i>신청하러 가기
                </a>` : ''}
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
                <input type="datetime-local" name="deadline" placeholder="마감일시" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
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
