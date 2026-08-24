// ============================================
// QueueLess — Staff Dashboard Logic
// ============================================

let currentUser = null;
let selectedServiceId = null;
let currentActiveToken = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth(['staff', 'admin']);
    if (!currentUser) return;

    document.getElementById('navbar').innerHTML = renderNavbar(currentUser, 'dashboard');

    await loadServices();

    document.getElementById('serviceSelect').addEventListener('change', (e) => {
        selectedServiceId = e.target.value;
        if (selectedServiceId) {
            document.getElementById('queuePanel').classList.remove('hidden');
            refreshQueueData();
            startQueuePolling();
        } else {
            document.getElementById('queuePanel').classList.add('hidden');
            stopPolling();
        }
    });
});

async function loadServices() {
    try {
        const data = await apiGet('/services');
        const select = document.getElementById('serviceSelect');
        data.services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.prefix} — ${service.name}`;
            select.appendChild(option);
        });
    } catch (error) {
        showToast('Failed to load services', 'error');
    }
}

function startQueuePolling() {
    stopPolling();
    pollingInterval = startPolling(refreshQueueData, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

async function refreshQueueData() {
    if (!selectedServiceId) return;

    try {
        // Get current active token
        const currentData = await apiGet(`/queue/current/${selectedServiceId}`);
        currentActiveToken = currentData.token;
        renderCurrentToken(currentActiveToken);

        // Get queue status
        const statusData = await apiGet(`/queue/status/${selectedServiceId}`);
        renderQueueStats(statusData.queue);

        // Get waiting tokens
        const waitingData = await apiGet(`/queue/waiting/${selectedServiceId}`);
        renderWaitingTable(waitingData.tokens);

    } catch (error) {
        console.error('Refresh error:', error);
    }
}

function renderCurrentToken(token) {
    const numberEl = document.getElementById('currentTokenNumber');
    const userEl = document.getElementById('currentTokenUser');
    const callBtn = document.getElementById('callNextBtn');
    const serveBtn = document.getElementById('serveBtn');
    const skipBtn = document.getElementById('skipBtn');

    if (token) {
        numberEl.textContent = token.token_number;
        userEl.textContent = `Customer: ${escapeHtml(token.user_name)}`;
        callBtn.classList.add('hidden');
        serveBtn.classList.remove('hidden');
        skipBtn.classList.remove('hidden');
    } else {
        numberEl.textContent = '—';
        userEl.textContent = 'No active token';
        callBtn.classList.remove('hidden');
        serveBtn.classList.add('hidden');
        skipBtn.classList.add('hidden');
    }
}

function renderQueueStats(queue) {
    document.getElementById('queueStats').innerHTML = `
        <div class="stat-card purple">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${queue.total}</div>
            <div class="stat-label">Total Today</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-icon">⏳</div>
            <div class="stat-value">${queue.waiting}</div>
            <div class="stat-label">Waiting</div>
        </div>
        <div class="stat-card green">
            <div class="stat-icon">✓</div>
            <div class="stat-value">${queue.served}</div>
            <div class="stat-label">Served</div>
        </div>
        <div class="stat-card cyan">
            <div class="stat-icon">🎫</div>
            <div class="stat-value">${queue.current_token}</div>
            <div class="stat-label">Now Serving</div>
        </div>
    `;
}

function renderWaitingTable(tokens) {
    const tbody = document.getElementById('waitingTableBody');

    if (tokens.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted" style="padding: 2rem;">
                    🎉 No one is waiting — queue is empty!
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = tokens.map(token => `
        <tr>
            <td><strong>${escapeHtml(token.token_number)}</strong></td>
            <td>${escapeHtml(token.user_name)}</td>
            <td>${formatTime(token.created_at)}</td>
            <td>${timeAgo(token.created_at)}</td>
            <td>${getStatusBadge(token.status)}</td>
        </tr>
    `).join('');
}

async function callNext() {
    const btn = document.getElementById('callNextBtn');
    btn.disabled = true;
    btn.textContent = 'Calling...';

    try {
        const data = await apiPut(`/queue/call-next/${selectedServiceId}`);
        if (data.token) {
            showToast(`Called token ${data.token.token_number}`, 'success');
        } else {
            showToast(data.message || 'No tokens waiting', 'info');
        }
        await refreshQueueData();
    } catch (error) {
        showToast(error.message || 'Failed to call next', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📢 Call Next';
    }
}

async function serveCurrent() {
    if (!currentActiveToken) return;

    const btn = document.getElementById('serveBtn');
    btn.disabled = true;

    try {
        await apiPut(`/queue/serve/${currentActiveToken.id}`);
        showToast(`Token ${currentActiveToken.token_number} marked as served`, 'success');
        await refreshQueueData();
    } catch (error) {
        showToast(error.message || 'Failed to serve', 'error');
    } finally {
        btn.disabled = false;
    }
}

async function skipCurrent() {
    if (!currentActiveToken) return;

    const btn = document.getElementById('skipBtn');
    btn.disabled = true;

    try {
        await apiPut(`/queue/skip/${currentActiveToken.id}`);
        showToast(`Token ${currentActiveToken.token_number} skipped`, 'warning');
        await refreshQueueData();
    } catch (error) {
        showToast(error.message || 'Failed to skip', 'error');
    } finally {
        btn.disabled = false;
    }
}
