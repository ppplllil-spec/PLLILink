// 전역 상태
let currentTab = 'schedule';
let radioFilter = 'all';
let isAutoFilling = false;
let allVotes = []; // 전체 투표 데이터 저장
let currentVoteFilter = 'all';
let currentSearchQuery = '';

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

// 알림 토글 함수
async function toggleNotifications() {
    if (notificationsEnabled) {
        disableNotifications();
        document.getElementById('notification-status').textContent = '알림 켜기';
    } else {
        const granted = await requestNotificationPermission();
        if (granted) {
            document.getElementById('notification-status').textContent = '알림 끄기';
            checkDeadlineNotifications(); // 즉시 알림 체크
        }
    }
}

// 초기화 시 알림 버튼 상태 업데이트
function updateNotificationButtonStatus() {
    const statusElement = document.getElementById('notification-status');
    if (statusElement && notificationsEnabled) {
        statusElement.textContent = '알림 끄기';
    }
}

// 브라우저 알림 설정
let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';

// 브라우저 알림 권한 요청
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('이 브라우저는 알림을 지원하지 않습니다', 'error');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationsEnabled = true;
        localStorage.setItem('notificationsEnabled', 'true');
        showToast('알림이 활성화되었습니다 🔔', 'success');
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            showToast('알림이 활성화되었습니다 🔔', 'success');
            return true;
        }
    }
    
    showToast('알림 권한이 거부되었습니다', 'error');
    return false;
}

// 알림 끄기
function disableNotifications() {
    notificationsEnabled = false;
    localStorage.setItem('notificationsEnabled', 'false');
    showToast('알림이 비활성화되었습니다 🔕', 'info');
}

// 마감 임박 알림 체크
function checkDeadlineNotifications() {
    if (!notificationsEnabled || !allVotes.length) return;
    
    const now = new Date().getTime();
    const oneHourFromNow = now + (60 * 60 * 1000);
    const threeHoursFromNow = now + (3 * 60 * 60 * 1000);
    
    allVotes.forEach(vote => {
        if (!vote.deadline) return;
        
        const deadlineTime = new Date(vote.deadline).getTime();
        const timeRemaining = deadlineTime - now;
        
        // 1시간 이내 마감 알림
        if (timeRemaining > 0 && timeRemaining <= oneHourFromNow) {
            const notifiedKey = `notified_1h_${vote.id}`;
            if (!localStorage.getItem(notifiedKey)) {
                new Notification('⏰ 투표 마감 1시간 전!', {
                    body: `"${vote.title}" 투표가 1시간 이내에 마감됩니다!`,
                    icon: '/static/icon.svg',
                    badge: '/static/icon.svg',
                    tag: `vote-${vote.id}`,
                    requireInteraction: true
                });
                localStorage.setItem(notifiedKey, 'true');
            }
        }
        
        // 3시간 이내 마감 알림
        if (timeRemaining > oneHourFromNow && timeRemaining <= threeHoursFromNow) {
            const notifiedKey = `notified_3h_${vote.id}`;
            if (!localStorage.getItem(notifiedKey)) {
                new Notification('🔔 투표 마감 3시간 전', {
                    body: `"${vote.title}" 투표가 곧 마감됩니다`,
                    icon: '/static/icon.svg',
                    badge: '/static/icon.svg',
                    tag: `vote-${vote.id}`
                });
                localStorage.setItem(notifiedKey, 'true');
            }
        }
    });
}

// SNS 공유 함수
function shareToSNS(platform, url, title = '') {
    const shareText = encodeURIComponent(`${title} - PLAVE 투표에 참여하세요!`);
    const shareUrl = encodeURIComponent(url);
    let shareLink = '';
    
    switch(platform) {
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
            break;
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
            break;
        case 'kakao':
            // 카카오톡 공유는 SDK 필요, 링크 복사로 대체
            copyLink(url, title);
            showToast('카카오톡으로 공유: 링크를 복사했습니다', 'info');
            return;
        case 'line':
            shareLink = `https://social-plugins.line.me/lineit/share?url=${shareUrl}`;
            break;
        default:
            copyLink(url, title);
            return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
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

// 투표 필터 함수
function filterVotes(filterType) {
    currentVoteFilter = filterType;
    
    // 필터 버튼 스타일 업데이트
    document.querySelectorAll('.vote-filter-btn').forEach(btn => {
        btn.classList.remove('bg-cyan-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    const activeBtn = document.getElementById(`filter-${filterType}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-700', 'text-gray-300');
        activeBtn.classList.add('bg-cyan-600', 'text-white');
    }
    
    renderFilteredVotes();
}

// 필터링된 투표 렌더링
function renderFilteredVotes() {
    const completedVotes = getCompletedVotes().votes;
    const now = new Date().getTime();
    const oneDayFromNow = now + (24 * 60 * 60 * 1000);
    
    let filteredVotes = allVotes.filter(vote => {
        // 검색 필터
        if (currentSearchQuery) {
            const titleMatch = vote.title.toLowerCase().includes(currentSearchQuery);
            const platformMatch = vote.platform && vote.platform.toLowerCase().includes(currentSearchQuery);
            if (!titleMatch && !platformMatch) return false;
        }
        
        // 타입 필터
        if (currentVoteFilter === 'deadline') {
            if (!vote.deadline) return false;
            const deadlineTime = new Date(vote.deadline).getTime();
            return deadlineTime <= oneDayFromNow;
        } else if (currentVoteFilter === 'recurring') {
            return vote.is_recurring === 1;
        } else if (currentVoteFilter === 'completed') {
            return completedVotes.includes(vote.id);
        } else if (currentVoteFilter === 'incomplete') {
            return !completedVotes.includes(vote.id);
        }
        
        return true; // 'all'
    });
    
    const votesList = document.getElementById('votes-list');
    if (filteredVotes.length === 0) {
        votesList.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8 font-bold">조건에 맞는 투표가 없습니다.</div>';
        return;
    }
    
    votesList.innerHTML = filteredVotes.map(vote => {
        const isCompleted = isVoteCompleted(vote.id);
        const cardOpacity = isCompleted ? 'opacity-60 grayscale' : '';
        
        return `
        <div class="card rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] ${cardOpacity}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-start gap-3 flex-1">
                    <label class="flex items-center cursor-pointer group">
                        <input type="checkbox" 
                               data-vote-checkbox="${vote.id}"
                               ${isCompleted ? 'checked' : ''}
                               onchange="toggleVoteComplete(${vote.id})"
                               class="w-6 h-6 rounded border-2 border-cyan-500 bg-gray-800 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer transition-all">
                    </label>
                    <h3 class="text-xl font-bold text-cyan-300 flex-1 ${isCompleted ? 'line-through' : ''}">${escapeHtml(vote.title)}</h3>
                </div>
                <div class="flex gap-2">
                    <div class="relative group">
                        <button class="text-purple-400 hover:text-purple-300 transition-colors" title="SNS 공유">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <div class="hidden group-hover:block absolute right-0 top-8 bg-gray-800 rounded-lg shadow-xl p-2 z-10 min-w-[140px]">
                            <button onclick="shareToSNS('twitter', '${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-300">
                                <i class="fab fa-twitter text-blue-400"></i> Twitter
                            </button>
                            <button onclick="shareToSNS('facebook', '${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-300">
                                <i class="fab fa-facebook text-blue-600"></i> Facebook
                            </button>
                            <button onclick="shareToSNS('kakao', '${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-300">
                                <i class="fas fa-comment text-yellow-400"></i> KakaoTalk
                            </button>
                            <button onclick="shareToSNS('line', '${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-300">
                                <i class="fab fa-line text-green-500"></i> LINE
                            </button>
                        </div>
                    </div>
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
            ${vote.deadline ? `<div class="mb-3" data-deadline="${vote.deadline}">${getCountdownHTML(vote.deadline)}</div>` : ''}
            <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block cyber-link text-white text-center py-3 px-4 rounded-lg hover:shadow-lg transition-all mb-2 font-bold">
                <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
            </a>
            <button onclick="viewTips(${vote.id}, '${escapeHtml(vote.platform || 'General')}')" class="mt-3 text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                <i class="fas fa-lightbulb mr-1"></i>이 투표의 팁 보기
            </button>
        </div>
        `;
    }).join('');
    
    updateCompletionStats();
}

// 카운트다운 타이머 함수
function getCountdownHTML(deadline) {
    if (!deadline) return '';
    
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const distance = deadlineTime - now;
    
    if (distance < 0) {
        return '<span class="text-red-500 font-bold">⏰ 마감됨</span>';
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // 24시간 이내: 빨간색 + 초 단위 표시
    if (distance < 24 * 60 * 60 * 1000) {
        const isUrgent = distance < 3 * 60 * 60 * 1000; // 3시간 이내
        const textColor = isUrgent ? 'text-red-400 animate-pulse' : 'text-orange-400';
        const icon = isUrgent ? '🔥' : '⏰';
        
        if (days > 0) {
            return `<span class="${textColor} font-bold">${icon} ${days}일 ${hours}시간 ${minutes}분 남음</span>`;
        } else if (hours > 0) {
            return `<span class="${textColor} font-bold">${icon} ${hours}시간 ${minutes}분 ${seconds}초 남음</span>`;
        } else if (minutes > 0) {
            return `<span class="${textColor} font-bold">${icon} ${minutes}분 ${seconds}초 남음</span>`;
        } else {
            return `<span class="${textColor} font-bold">${icon} ${seconds}초 남음!</span>`;
        }
    }
    
    // 24시간 이상: 일반 표시
    if (days > 0) {
        return `<span class="text-cyan-400 font-semibold">⏰ ${days}일 ${hours}시간 남음</span>`;
    } else {
        return `<span class="text-cyan-400 font-semibold">⏰ ${hours}시간 ${minutes}분 남음</span>`;
    }
}

// 카운트다운 업데이트 함수
function startCountdownUpdates() {
    // 1초마다 모든 카운트다운 업데이트
    setInterval(() => {
        document.querySelectorAll('[data-deadline]').forEach(element => {
            const deadline = element.getAttribute('data-deadline');
            element.innerHTML = getCountdownHTML(deadline);
        });
    }, 1000);
}

// 투표 완료 체크박스 관련 함수
function getCompletedVotes() {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('completed_votes');
    
    if (!stored) return { date: today, votes: [] };
    
    try {
        const data = JSON.parse(stored);
        // 날짜가 다르면 리셋
        if (data.date !== today) {
            return { date: today, votes: [] };
        }
        return data;
    } catch (e) {
        return { date: today, votes: [] };
    }
}

function saveCompletedVotes(votes) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('completed_votes', JSON.stringify({
        date: today,
        votes: votes
    }));
}

function isVoteCompleted(voteId) {
    const data = getCompletedVotes();
    return data.votes.includes(voteId);
}

// 투표 완료 인증서 생성
function generateCertificate() {
    const completedVotesData = getCompletedVotes();
    const completedIds = completedVotesData.votes;
    const completedVotes = allVotes.filter(v => completedIds.includes(v.id));
    
    if (completedVotes.length === 0) {
        showToast('완료한 투표가 없습니다', 'info');
        return;
    }
    
    // 닉네임 입력 프롬프트
    const nickname = prompt('닉네임을 입력하세요:', 'PLLI');
    if (!nickname) return;
    
    // Canvas 생성
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 테두리
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // 내부 테두리
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 5;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // 제목
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 투표 완료 인증서', canvas.width / 2, 150);
    
    // PLAVE PLLI 로고
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('PLAVE PLLI Community', canvas.width / 2, 220);
    
    // 닉네임
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(nickname, canvas.width / 2, 320);
    
    // 설명 텍스트
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText(`${new Date().toLocaleDateString('ko-KR')}`, canvas.width / 2, 380);
    
    // 완료 개수
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`총 ${completedVotes.length}개의 투표 완료!`, canvas.width / 2, 480);
    
    // 투표 목록
    ctx.textAlign = 'left';
    ctx.font = '28px sans-serif';
    let y = 580;
    
    completedVotes.slice(0, 15).forEach((vote, index) => {
        ctx.fillStyle = '#cbd5e1';
        const text = `${index + 1}. ${vote.title}`;
        const maxWidth = canvas.width - 160;
        
        // 텍스트가 너무 길면 줄임
        let displayText = text;
        if (ctx.measureText(text).width > maxWidth) {
            let truncated = text;
            while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
            }
            displayText = truncated + '...';
        }
        
        ctx.fillText(displayText, 80, y);
        y += 50;
    });
    
    if (completedVotes.length > 15) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`그 외 ${completedVotes.length - 15}개 투표`, canvas.width / 2, y + 20);
    }
    
    // 워터마크
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('PLAVE PLLI', 0, 0);
    ctx.restore();
    
    // 하단 텍스트
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('플리들의 든든한 투표 활동을 응원합니다!', canvas.width / 2, canvas.height - 100);
    
    // 다운로드
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PLAVE_투표인증_${nickname}_${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('🎉 인증서가 다운로드되었습니다!', 'success');
    }, 'image/png');
}

function toggleVoteComplete(voteId) {
    const data = getCompletedVotes();
    const index = data.votes.indexOf(voteId);
    
    if (index > -1) {
        // 이미 완료된 경우 제거
        data.votes.splice(index, 1);
    } else {
        // 완료 추가
        data.votes.push(voteId);
    }
    
    saveCompletedVotes(data.votes);
    
    // UI 업데이트
    renderFilteredVotes();
    
    // 토스트 알림
    if (index === -1) {
        showToast('✅ 투표 완료 처리되었습니다!', 'success');
    } else {
        showToast('투표 완료가 취소되었습니다.', 'info');
    }
}

function updateVoteCheckbox(voteId, isCompleted) {
    const checkbox = document.querySelector(`[data-vote-checkbox="${voteId}"]`);
    if (checkbox) {
        checkbox.checked = isCompleted;
        
        // 카드 스타일 업데이트
        const card = checkbox.closest('.card');
        if (card) {
            if (isCompleted) {
                card.classList.add('opacity-60', 'grayscale');
            } else {
                card.classList.remove('opacity-60', 'grayscale');
            }
        }
    }
}

function updateCompletionStats() {
    const statsEl = document.getElementById('completion-stats');
    if (!statsEl) return;
    
    const data = getCompletedVotes();
    const totalVotes = document.querySelectorAll('[data-vote-checkbox]').length;
    const completed = data.votes.length;
    
    if (totalVotes === 0) {
        statsEl.innerHTML = '';
        return;
    }
    
    const percentage = Math.round((completed / totalVotes) * 100);
    
    statsEl.innerHTML = `
        <div class="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-lg p-4 border border-cyan-500/30">
            <div class="flex items-center justify-between mb-2 flex-wrap gap-3">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-cyan-300 font-bold">오늘의 투표 진행률</span>
                        <span class="text-2xl font-bold text-cyan-300">${completed}/${totalVotes}</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div class="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                    <p class="text-sm text-gray-400 mt-2">🎯 ${percentage}% 완료!</p>
                </div>
                ${completed > 0 ? `
                <button onclick="generateCertificate()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg whitespace-nowrap">
                    <i class="fas fa-certificate mr-2"></i>인증서 생성
                </button>
                ` : ''}
            </div>
        </div>
    `;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
    loadVotes();
    loadAds();
    loadRadio();
    loadTips();
    
    // 알림 버튼 상태 업데이트
    updateNotificationButtonStatus();
    
    // 알림 체크 (10분마다)
    setInterval(checkDeadlineNotifications, 10 * 60 * 1000);
    
    // 카운트다운 타이머 시작
    startCountdownUpdates();
    
    // 검색 이벤트 리스너
    const searchInput = document.getElementById('vote-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderFilteredVotes();
        });
    }
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
                deadlineVotesEl.innerHTML = schedule.votes.deadline.map(vote => {
                    const isCompleted = isVoteCompleted(vote.id);
                    const cardOpacity = isCompleted ? 'opacity-60 grayscale' : '';
                    
                    return `
                    <div class="card rounded-xl shadow-lg p-5 border-2 border-red-500/50 ${cardOpacity}">
                        <div class="flex items-start gap-3 mb-2">
                            <label class="flex items-center cursor-pointer mt-1">
                                <input type="checkbox" 
                                       data-vote-checkbox="${vote.id}"
                                       ${isCompleted ? 'checked' : ''}
                                       onchange="toggleVoteComplete(${vote.id})"
                                       class="w-5 h-5 rounded border-2 border-red-500 bg-gray-800 checked:bg-red-500 checked:border-red-500 cursor-pointer transition-all">
                            </label>
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="badge bg-red-900/50 text-red-300 border-red-500">⏰ 마감 임박</span>
                                    ${vote.platform ? `<span class="badge bg-cyan-900/50 text-cyan-300 border-cyan-500">${escapeHtml(vote.platform)}</span>` : ''}
                                </div>
                                <h4 class="text-lg font-bold text-cyan-300 mb-2 ${isCompleted ? 'line-through' : ''}">${escapeHtml(vote.title)}</h4>
                                ${vote.description ? `<p class="text-gray-300 text-sm mb-3">${escapeHtml(vote.description)}</p>` : ''}
                                <div class="mb-3" data-deadline="${vote.deadline}">
                                    ${getCountdownHTML(vote.deadline)}
                                </div>
                                <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="block cyber-link text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all font-bold text-sm">
                                    <i class="fas fa-external-link-alt mr-2"></i>투표하러 가기
                                </a>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('');
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
        allVotes = response.data.data; // 전역 변수에 저장
        
        // 필터링된 투표 렌더링
        renderFilteredVotes();
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
                    <div class="flex gap-2">
                        <button onclick="editRadio(${radio.id})" class="text-cyan-400 hover:text-cyan-300 transition-colors" title="수정">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteItem('radio-requests', ${radio.id})" class="text-red-400 hover:text-red-300 transition-colors" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <span class="badge ${radio.country === 'domestic' ? 'bg-blue-900/50 text-blue-300 border-blue-500' : 'bg-green-900/50 text-green-300 border-green-500'} mb-2">
                    ${radio.country === 'domestic' ? '국내' : '해외'}
                </span>
                <p class="text-lg font-semibold text-cyan-400 mb-1">${escapeHtml(radio.station_name)}</p>
                ${radio.program_name ? `<p class="text-gray-300 mb-2">${escapeHtml(radio.program_name)}</p>` : ''}
                ${radio.description ? `<p class="text-gray-300 mb-3">${escapeHtml(radio.description)}</p>` : ''}
                ${radio.request_method ? `<p class="text-sm text-gray-400 mb-2"><i class="fas fa-phone mr-1 text-purple-400"></i>신청방법: ${escapeHtml(radio.request_method)}</p>` : ''}
                <div class="flex gap-2 flex-wrap">
                    ${radio.request_url ? `<a href="${escapeHtml(radio.request_url)}" target="_blank" class="flex-1 cyber-link text-white text-center py-3 px-4 rounded-lg hover:shadow-lg transition-all font-bold">
                        <i class="fas fa-external-link-alt mr-2"></i>신청하러 가기
                    </a>` : ''}
                    ${radio.example_text ? `<button onclick="showExampleText(${radio.id}, '${escapeHtml(radio.station_name)}', \`${escapeHtml(radio.example_text).replace(/`/g, '\\`')}\`)" class="px-4 py-3 rounded-lg font-bold border-2 border-green-500 text-green-300 hover:bg-green-900/30 transition-all whitespace-nowrap">
                        <i class="fas fa-file-alt mr-1"></i>예시문 보기
                    </button>` : ''}
                    ${radio.country === 'international' && !radio.example_text ? `<button onclick="showRadioTemplate('${escapeHtml(radio.station_name)}')" class="px-4 py-3 rounded-lg font-bold border-2 border-purple-500 text-purple-300 hover:bg-purple-900/30 transition-all whitespace-nowrap">
                        <i class="fas fa-comment-dots mr-1"></i>템플릿 예시문
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
                <label class="block text-cyan-300 font-semibold mb-2">
                    <i class="fas fa-file-alt mr-2"></i>예시문 (선택)
                </label>
                <textarea name="example_text" placeholder="라디오 신청 예시문을 입력하세요..." class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="5"></textarea>
                <p class="text-xs text-gray-500 mt-1">
                    <i class="fas fa-info-circle mr-1 text-cyan-400"></i>라디오 신청 시 사용할 예시문을 작성하세요
                </p>
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
// 예시문 보기 함수
function showExampleText(radioId, stationName, exampleText) {
    const modal = document.createElement('div');
    modal.id = 'example-text-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
    modal.style.backdropFilter = 'blur(10px)';
    
    modal.innerHTML = `
        <div class="card rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-3xl font-black neon-text">
                    <i class="fas fa-file-alt mr-2"></i>${escapeHtml(stationName)} 신청 예시문
                </h2>
                <button onclick="closeExampleTextModal()" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                    <i class="fas fa-times text-3xl"></i>
                </button>
            </div>
            
            <div class="card rounded-xl p-5 border border-cyan-900/50 mb-4">
                <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
                    <pre class="text-gray-300 whitespace-pre-wrap font-mono text-sm">${escapeHtml(exampleText)}</pre>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="copyExampleText(\`${escapeHtml(exampleText).replace(/`/g, '\\`')}\`)" class="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 px-6 rounded-lg hover:from-green-500 hover:to-green-600 transition-all shadow-lg">
                        <i class="fas fa-copy mr-2"></i>예시문 복사
                    </button>
                    <button onclick="closeExampleTextModal()" class="px-8 py-3 rounded-lg font-bold border-2 border-gray-600 text-gray-300 hover:bg-gray-800/50 transition-all">
                        닫기
                    </button>
                </div>
            </div>
            
            <div class="text-center text-sm text-gray-400 mt-4">
                <i class="fas fa-info-circle mr-1"></i>
                위 예시문을 복사하여 라디오 신청 시 활용하세요
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 예시문 복사 함수
function copyExampleText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('📝 예시문이 복사되었습니다!', 'success');
            })
            .catch(err => {
                showToast('복사에 실패했습니다', 'error');
                console.error('복사 실패:', err);
            });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('📝 예시문이 복사되었습니다!', 'success');
        } catch (err) {
            showToast('복사에 실패했습니다', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// 예시문 모달 닫기
function closeExampleTextModal() {
    const modal = document.getElementById('example-text-modal');
    if (modal) {
        modal.remove();
    }
}

// 라디오 수정 함수
async function editRadio(radioId) {
    try {
        // 라디오 정보 가져오기
        const response = await axios.get(`/api/radio-requests/${radioId}`);
        const radio = response.data.data;
        
        // 모달 생성
        const modal = document.createElement('div');
        modal.id = 'edit-radio-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50';
        modal.style.backdropFilter = 'blur(10px)';
        
        modal.innerHTML = `
            <div class="card rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-black neon-text">라디오 정보 수정</h2>
                    <button onclick="closeEditRadioModal()" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                        <i class="fas fa-times text-3xl"></i>
                    </button>
                </div>
                <form id="edit-radio-form" class="space-y-4">
                    <div>
                        <input type="text" name="title" value="${escapeHtml(radio.title)}" placeholder="제목" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div>
                        <input type="text" name="station_name" value="${escapeHtml(radio.station_name)}" placeholder="방송국 이름" required class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div>
                        <input type="text" name="program_name" value="${escapeHtml(radio.program_name || '')}" placeholder="프로그램 이름 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div>
                        <input type="url" name="request_url" value="${escapeHtml(radio.request_url || '')}" placeholder="신청 URL" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div>
                        <input type="text" name="request_method" value="${escapeHtml(radio.request_method || '')}" placeholder="신청 방법 (예: 앱, 문자)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    </div>
                    <div>
                        <select name="country" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                            <option value="domestic" ${radio.country === 'domestic' ? 'selected' : ''}>국내</option>
                            <option value="international" ${radio.country === 'international' ? 'selected' : ''}>해외</option>
                        </select>
                    </div>
                    <div>
                        <textarea name="description" placeholder="설명 (선택)" class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="3">${escapeHtml(radio.description || '')}</textarea>
                    </div>
                    <div>
                        <label class="block text-cyan-300 font-semibold mb-2">
                            <i class="fas fa-file-alt mr-2"></i>예시문 (선택)
                        </label>
                        <textarea name="example_text" placeholder="라디오 신청 예시문을 입력하세요..." class="w-full p-3 border border-cyan-800/50 rounded-lg bg-gray-900/50 text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" rows="5">${escapeHtml(radio.example_text || '')}</textarea>
                        <p class="text-xs text-gray-500 mt-1">
                            <i class="fas fa-info-circle mr-1 text-cyan-400"></i>라디오 신청 시 사용할 예시문을 작성하세요
                        </p>
                    </div>
                    <div class="flex gap-3 pt-6 border-t border-cyan-900/30">
                        <button type="submit" class="flex-1 neon-button text-white px-6 py-3 rounded-xl font-black">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                        <button type="button" onclick="closeEditRadioModal()" class="px-8 py-3 rounded-xl font-bold border-2 border-gray-600 text-gray-300 hover:bg-gray-800/50 transition-all">
                            취소
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 폼 제출 이벤트
        document.getElementById('edit-radio-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            try {
                await axios.put(`/api/radio-requests/${radioId}`, data);
                showToast('✅ 라디오 정보가 수정되었습니다!', 'success');
                closeEditRadioModal();
                loadRadio();
            } catch (error) {
                showToast(`수정 실패: ${error.response?.data?.error || error.message}`, 'error');
            }
        });
        
    } catch (error) {
        showToast('라디오 정보를 불러오는데 실패했습니다', 'error');
        console.error('라디오 정보 로드 실패:', error);
    }
}

// 라디오 수정 모달 닫기
function closeEditRadioModal() {
    const modal = document.getElementById('edit-radio-modal');
    if (modal) {
        modal.remove();
    }
}

// 라디오 템플릿 예시문 보기
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


