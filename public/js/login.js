// ============================================
// QueueLess — Login Page Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    (async () => {
        const user = await getCurrentUser();
        if (user) {
            redirectByRole(user.role);
        }
    })();

    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        try {
            const data = await apiPost('/auth/login', { email, password });
            showToast('Login successful!', 'success');

            setTimeout(() => {
                redirectByRole(data.user.role);
            }, 500);

        } catch (error) {
            showToast(error.message || 'Login failed', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });
});
