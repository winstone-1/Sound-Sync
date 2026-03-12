// PROFILE — load from localStorage into sidebar
function loadProfile() {
  const raw = localStorage.getItem('soundsync_user');

  if (!raw) {
    // Not logged in — send to login page
    window.location.href = 'Join.html';
    return;
  }

  const user = JSON.parse(raw);

  // Set name
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = user.name || 'User';

  // Set avatar
  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (user.photo) {
      avatarEl.src = user.photo;
      //  if photo URL fails to load
      avatarEl.onerror = () => {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7c3aed&color=fff&size=36`;
      };
    } else {
      // No photo — generate initials avatar
      avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7c3aed&color=fff&size=36`;
    }
  }
}

// SIGN OUT — clear profile and go to login
function signOut() {
  if (!confirm('')) return;
  localStorage.removeItem('soundsync_user');
  window.location.href = 'Join.html';
}

// Run on page load
loadProfile();