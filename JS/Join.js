
  // ── Tab switcher 
  function switchTab(tab) {
    const isSignup = tab === 'signup';

    // Update tab button styles
    document.getElementById('tab-signin').className =
      `${!isSignup ? 'tab-active' : 'text-slate-400'} flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200`;
    document.getElementById('tab-signup').className =
      `${isSignup ? 'tab-active' : 'text-slate-400'} flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200`;

    // Slide name field in/out
    const nameField = document.getElementById('field-name');
    if (isSignup) {
      nameField.style.maxHeight = '80px';
      nameField.style.opacity  = '1';
      nameField.style.marginBottom = '0';
    } else {
      nameField.style.maxHeight = '0';
      nameField.style.opacity  = '0';
      nameField.style.marginBottom = '0';
    }

    // Update header text
    document.getElementById('header-title').textContent =
      isSignup ? 'Create Account' : 'Welcome Back';
    document.getElementById('header-subtitle').textContent =
      isSignup ? 'Join the SoundSync community' : 'Ready to sync your sound?';

    // Update button text and action
    const btn = document.getElementById('btn-auth');
    btn.textContent = isSignup ? 'Create Account' : 'Sign In';
    btn.onclick     = isSignup ? signUp : signIn;

    // Hide forgot password on signup
    document.getElementById('forgot-link').style.visibility =
      isSignup ? 'hidden' : 'visible';

    // Clear error on tab switch
    hideError();
  }

  // Show/hide password 
  function togglePassword() {
    const input = document.getElementById('password');
    const icon  = document.getElementById('pwd-eye');
    if (input.type === 'password') {
      input.type  = 'text';
      icon.className = 'fas fa-eye-slash text-xs';
    } else {
      input.type  = 'password';
      icon.className = 'fas fa-eye text-xs';
    }
  }

  //  Error helpers 
  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hideError() {
    document.getElementById('auth-error').classList.add('hidden');
  }

  
