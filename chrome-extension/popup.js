document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const loggedView = document.getElementById('logged-view');
  
  const serverUrlInput = document.getElementById('server-url');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btn-login');
  const errorMsg = document.getElementById('error-msg');

  const avatarLetter = document.getElementById('avatar-letter');
  const userNameText = document.getElementById('user-name');
  const userEmailText = document.getElementById('user-email');
  const userRoleText = document.getElementById('user-role');
  const btnLogout = document.getElementById('btn-logout');

  // Check current session
  chrome.storage.local.get(['crm_token', 'crm_user', 'crm_server_url'], (res) => {
    if (res.crm_server_url) {
      serverUrlInput.value = res.crm_server_url;
    }
    if (res.crm_token && res.crm_user) {
      showLoggedView(res.crm_user);
    } else {
      showLoginView();
    }
  });

  btnLogin.addEventListener('click', async () => {
    errorMsg.style.display = 'none';
    const serverUrl = serverUrlInput.value.trim().replace(/\/$/, ''); // Remove trailing slash
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!serverUrl || !email || !password) {
      showError('Todos os campos são obrigatórios.');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.innerText = 'Autenticando...';

    try {
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        chrome.storage.local.set({
          crm_token: data.token,
          crm_user: data.user,
          crm_server_url: serverUrl
        }, () => {
          showLoggedView(data.user);
        });
      } else {
        showError(data.error || 'Erro ao realizar login.');
      }
    } catch (err) {
      console.error(err);
      showError('Não foi possível conectar ao servidor.');
    } finally {
      btnLogin.disabled = false;
      btnLogin.innerText = 'Entrar';
    }
  });

  btnLogout.addEventListener('click', () => {
    chrome.storage.local.remove(['crm_token', 'crm_user'], () => {
      showLoginView();
    });
  });

  function showLoggedView(user) {
    loginView.style.display = 'none';
    loggedView.style.display = 'block';

    avatarLetter.innerText = (user.name || 'U').charAt(0).toUpperCase();
    userNameText.innerText = user.name;
    userEmailText.innerText = user.email;
    userRoleText.innerText = user.role === 'gestor' ? 'Gestor' : 'Vendedor';
  }

  function showLoginView() {
    loginView.style.display = 'block';
    loggedView.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
  }

  function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = 'block';
  }
});
