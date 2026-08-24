// ============================================
// QueueLess — User Dashboard Logic
// ============================================

let currentUser = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Auth check
    currentUser = await requireAuth(['user']);
    if (!currentUser) return;

    // Render navbar
    document.getElementById('navbar').innerHTML = renderNavbar(currentUser, 'dashboard');
    document.getElementById('userName').textContent = currentUser.name;

    // Check for active token
    await checkActiveToken();
});

/**
 * Check if user has an active token
 */
async function checkActiveToken() {
    try {
        const data = await apiGet('/queue/my-token');

        if (data.token) {
            showActiveToken(data.token);
        } else {
            showServiceSelection();
        }
    } catch (error) {
        showToast('Failed to check token status', 'error');
        showServiceSelection();
    }
}

/**
 * Show service selection grid
 */
async function showServiceSelection() {
    document.getElementById('activeTokenSection').classList.add('hidden');
    document.getElementById('serviceSection').classList.remove('hidden');

    // Stop polling if running
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    try {
        const data = await apiGet('/services');
        const grid = document.getElementById('servicesGrid');

        if (data.services.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏷️</div>
                    <h3>No Services Available</h3>
                    <p>Please check back later or contact the administrator.</p>
                </div>`;
            return;
        }

        grid.innerHTML = data.services.map(service => `
            <div class="service-card animate-fade-in" onclick="joinQueue(${service.id})" id="service-${service.id}">
                <div class="service-prefix">${escapeHtml(service.prefix)}</div>
                <div class="service-name">${escapeHtml(service.name)}</div>
                <div class="service-desc">${escapeHtml(service.description || 'No description')}</div>
            </div>
        `).join('');

    } catch (error) {
        document.getElementById('servicesGrid').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Failed to Load Services</h3>
                <p>Please refresh the page and try again.</p>
            </div>`;
    }
}

/**
 * Join a queue for a specific service
 */
async function joinQueue(serviceId) {
    const card = document.getElementById(`service-${serviceId}`);
    if (card) {
        card.style.opacity = '0.6';
        card.style.pointerEvents = 'none';
    }

    try {
        const data = await apiPost('/queue/join', { serviceId });
        showToast(`Token ${data.token.token_number} generated!`, 'success');
        await checkActiveToken();
    } catch (error) {
        showToast(error.message || 'Failed to join queue', 'error');
        if (card) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    }
}

/**
 * Show active token display with live polling
 */
function showActiveToken(token) {
    document.getElementById('serviceSection').classList.add('hidden');
    document.getElementById('activeTokenSection').classList.remove('hidden');

    renderToken(token);

    // Start polling for updates
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = startPolling(async () => {
        try {
            const data = await apiGet('/queue/my-token');
            if (data.token) {
                renderToken(data.token);

                // Check if status changed to called
                if (data.token.status === 'called') {
                    document.title = '🔔 YOUR TURN! — QueueLess';
                }
            } else {
                // Token was served or skipped
                showToast('Your token has been completed!', 'info');
                document.title = 'Dashboard — QueueLess';
                showServiceSelection();
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 5000);
}

/**
 * Render token display
 */
function renderToken(token) {
    const statusLabels = {
        waiting: '⏳ Waiting',
        called: '🔔 Your Turn!',
        serving: '✨ Being Served'
    };

    const display = document.getElementById('tokenDisplay');
    display.innerHTML = `
        <div class="token-number">${escapeHtml(token.token_number)}</div>
        <div class="token-service">${escapeHtml(token.service_name)}</div>
        <div class="token-status ${token.status}">
            ${statusLabels[token.status] || token.status}
        </div>
        <div class="token-meta">
            <div class="token-meta-item">
                <div class="meta-value">${token.position || '—'}</div>
                <div class="meta-label">Your Position</div>
            </div>
            <div class="token-meta-item">
                <div class="meta-value">${token.total_waiting || 0}</div>
                <div class="meta-label">People Waiting</div>
            </div>
            <div class="token-meta-item">
                <div class="meta-value">${token.currently_serving || 'None'}</div>
                <div class="meta-label">Now Serving</div>
            </div>
            <div class="token-meta-item">
                <div class="meta-value">${formatTime(token.created_at)}</div>
                <div class="meta-label">Joined At</div>
            </div>
        </div>
    `;
}
