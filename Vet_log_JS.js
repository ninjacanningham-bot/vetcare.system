let isStaff = true;

// Staff credentials will be loaded from localStorage
let staffCredentials = {};

// Load staff credentials from localStorage
function loadStaffCredentials() {
    const stored = localStorage.getItem('vetStaffList');
    if (stored) {
        const staffList = JSON.parse(stored);
        staffCredentials = {};
        staffList.forEach(staff => {
            if (staff.gmail && staff.password) {
                staffCredentials[staff.gmail.toLowerCase()] = {
                    password: staff.password,
                    name: staff.fullName
                };
            }
        });
    }
}

// Sample credentials for demo (in production, this would be server-side)
const credentials = {
  staff: {
    email: 'staff@gmail.com',
    password: 'staff123'
  },
  admin: {
    email: 'admin@gmail.com',
    password: 'admin123'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadStaffCredentials();
  setupEventListeners();
  loadRememberedEmail();
});

function setupEventListeners() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Real-time validation
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);
  emailInput.addEventListener('input', () => clearError('email'));
  passwordInput.addEventListener('input', () => clearError('password'));

  // Enter key to submit
  loginForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  });
}

function switchRole() {
  isStaff = !isStaff;
  const roleText = document.getElementById('roleText');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (isStaff) {
    roleText.textContent = 'STAFF';
    formTitle.textContent = 'Sign in (Staff)';
    formSubtitle.textContent = 'Enter your staff credentials to access the system';
    emailInput.placeholder = 'staff@gmail.com';
    passwordInput.placeholder = 'Enter your password';
  } else {
    roleText.textContent = 'ADMIN';
    formTitle.textContent = 'Sign in (Admin)';
    formSubtitle.textContent = 'Enter your admin credentials to access the system';
    emailInput.placeholder = 'admin@gmail.com';
    passwordInput.placeholder = 'Enter your password';
  }

  // Clear form
  emailInput.value = '';
  passwordInput.value = '';
  clearError('email');
  clearError('password');
  clearMessage();

  // Add animation
  const loginCard = document.querySelector('.login-card');
  loginCard.style.animation = 'none';
  setTimeout(() => {
    loginCard.style.animation = 'slideInRight 0.6s ease-out';
  }, 10);
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.querySelector('.toggle-password');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

function validateEmail() {
  const email = document.getElementById('email').value.trim();
  const emailError = document.getElementById('emailError');

  if (!email) {
    showError('email', 'Email address is required');
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('email', 'Please enter a valid email address');
    return false;
  }

  clearError('email');
  return true;
}

function validatePassword() {
  const password = document.getElementById('password').value;
  const passwordError = document.getElementById('passwordError');

  if (!password) {
    showError('password', 'Password is required');
    return false;
  }

  if (password.length < 6) {
    showError('password', 'Password must be at least 6 characters');
    return false;
  }

  clearError('password');
  return true;
}

function showError(field, message) {
  const errorElement = document.getElementById(field + 'Error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  const input = document.getElementById(field);
  if (input) {
    input.style.borderColor = '#e74c3c';
  }
}

function clearError(field) {
  const errorElement = document.getElementById(field + 'Error');
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }

  const input = document.getElementById(field);
  if (input) {
    input.style.borderColor = '';
  }
}

function showMessage(message, type) {
  const messageElement = document.getElementById('loginMessage');
  messageElement.textContent = message;
  messageElement.className = 'message ' + type;
  messageElement.style.display = 'block';

  if (type === 'success') {
    setTimeout(clearMessage, 3000);
  }
}

function clearMessage() {
  const messageElement = document.getElementById('loginMessage');
  messageElement.textContent = '';
  messageElement.className = 'message';
  messageElement.style.display = 'none';
}

function handleLogin(event) {
  event.preventDefault();

  clearMessage();

  // Validate all fields
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const loginBtn = document.querySelector('.login-btn');

  // Disable button and show loading state
  const originalText = loginBtn.innerHTML;
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  // Simulate login process
  setTimeout(() => {
    const correctCreds = isStaff ? credentials.staff : credentials.admin;
    const emailLower = email.toLowerCase();
    const correctCredsEmail = correctCreds.email.toLowerCase();
    
    // Check if credentials match current role (case-insensitive email)
    const isValidLogin = emailLower === correctCredsEmail && password === correctCreds.password;
    
    if (isValidLogin) {
      // Success
      showMessage('✓ Login successful! Redirecting...', 'success');

      if (rememberMe) {
        saveEmailToStorage(email);
      } else {
        clearEmailFromStorage();
      }

      // Save a temporary session state for staff access
      sessionStorage.setItem('vetAuthenticated', 'true');
      sessionStorage.setItem('vetRole', isStaff ? 'staff' : 'admin');
      sessionStorage.setItem('loginTime', new Date().toISOString());

      // Redirect after short delay
      setTimeout(() => {
        if (isStaff) {
          window.location.replace('Vet_Staff_HTML.html');
        } else {
          window.location.replace('Vet_Admin_HTML.html');
        }
      }, 1000);
    } else {
      // Failure
      showMessage('✗ Invalid email or password. Please try again.', 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = originalText;
    }
  }, 1500);
}

function saveEmailToStorage(email) {
  localStorage.setItem('rememberedEmail', email);
  localStorage.setItem('rememberMe', 'true');
}

function clearEmailFromStorage() {
  localStorage.removeItem('rememberedEmail');
  localStorage.removeItem('rememberMe');
}

function loadRememberedEmail() {
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  const rememberedEmail = localStorage.getItem('rememberedEmail');

  if (rememberMe && rememberedEmail) {
    document.getElementById('email').value = rememberedEmail;
    document.getElementById('rememberMe').checked = true;
  }
}