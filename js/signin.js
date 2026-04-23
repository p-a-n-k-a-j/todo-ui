
    const LOGIN_URL = 'http://localhost:8080/api/user/auth/login';
const DASHBOARD_URL = '/dashboard.html';

// Elements
const form = document.getElementById('signinForm');
const emailInput = document.getElementById('email');
const pwdInput = document.getElementById('password');
const rememberChk = document.getElementById('rememberMe');
const toggleBtn = document.getElementById('togglePwd');
const eyeIcon = document.getElementById('eyeIcon');
const alertBox = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');
const btnSpinner = document.getElementById('btnSpinner');
const btnText = document.getElementById('btnText');

// 🔹 Toggle password visibility
toggleBtn.addEventListener('click', () => {
  const show = pwdInput.type === 'password';
  pwdInput.type = show ? 'text' : 'password';
  eyeIcon.className = show ? 'fa fa-eye-slash' : 'fa fa-eye';
  toggleBtn.title = show ? 'Hide password' : 'Show password';
});

// 🔹 Handle login submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.classList.add('d-none');

  const email = emailInput.value.trim();
  const password = pwdInput.value;
  const rememberMe = rememberChk.checked;

  if (!email || !password) {
    showAlert('Please enter both email and password.', 'danger');
    return;
  }

  submitBtn.disabled = true;
  btnSpinner.classList.remove('d-none');
  btnText.textContent = 'Signing In...';

  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // ✅ Safely parse JSON (even if empty)
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      console.warn('No JSON response or invalid format');
    }

    submitBtn.disabled = false;
    btnSpinner.classList.add('d-none');
    btnText.textContent = 'Sign In';

    if (res.ok) {
        const { accessToken, refreshToken } = data;
        if (accessToken) {
            if (rememberMe) {
                localStorage.setItem('accessToken', accessToken);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            } else {
                sessionStorage.setItem('accessToken', accessToken);
                // ensure no refresh token is persisted across sessions
                localStorage.removeItem('refreshToken');
            }

            console.log('✅ Login successful');
            window.location.href = DASHBOARD_URL;
        } else {
            showAlert('Login successful, but token missing.', 'warning');
        }
    } else {
      showAlert(data.message || 'Invalid email or password.', 'danger');
    }
  } catch (error) {
    console.error('⚠️ Error during login:', error);
    showAlert('Network or server error. Please try again later.', 'danger');
  }
});

// 🔹 Show alert message
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove('d-none');
}


