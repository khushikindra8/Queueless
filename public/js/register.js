// ============================================
// QueueLess — Register Page Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    (async () => {
        const user = await getCurrentUser();
        if (user) {
            redirectByRole(user.role);
        }
    })();

    const form = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';

        try {
            const data = await apiPost('/auth/register', { name, email, password, confirmPassword });
            showToast('Account created successfully!', 'success');

            setTimeout(() => {
                redirectByRole(data.user.role);
            }, 500);

        } catch (error) {
            showToast(error.message || 'Registration failed', 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Create Account';
        }
    });
});
