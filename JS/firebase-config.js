import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged
}
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";



//  config 
const firebaseConfig = {
  apiKey: "AIzaSyBLVFjtNh1wAlJNUOICfzUMVjAuberxfa8",
  authDomain: "soundsync-7c347.firebaseapp.com",
  projectId: "soundsync-7c347",
  storageBucket: "soundsync-7c347.firebasestorage.app",
  messagingSenderId: "821810986656",
  appId: "1:821810986656:web:00a907f8a52b757e8b13c5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Modules don't see functions
function showError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  const el = document.getElementById('auth-error');
  if (el) el.classList.add('hidden');
}


// signOut() removes 'soundsync_user' before redirecting here
onAuthStateChanged(auth, (user) => {
  const justSignedOut = !localStorage.getItem('soundsync_user');

  if (user && !justSignedOut) {
    saveProfile(user);
    window.location.href = 'index.html';
  }
});

//  Save profile to localStorage 
function saveProfile(user, overrideName) {
  const profile = {
    name: overrideName || user.displayName || 'User',
    email: user.email,
    photo: user.photoURL || null,
    uid: user.uid
  };
  localStorage.setItem('soundsync_user', JSON.stringify(profile));
}

//  Google sign-in 
window.signInWithGoogle = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    saveProfile(result.user);
    window.location.href = 'index.html';
  } catch (err) {
    showError(friendlyError(err.code));
  }
};

//  Email sign-in 
window.signIn = async function () {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) return showError('Email and password are required');

  // Show loading state
  const btn = document.getElementById('btn-auth');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    saveProfile(result.user);
    window.location.href = 'index.html';
  } catch (err) {
    showError(friendlyError(err.code));
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
};

//  Email sign-up 
window.signUp = async function () {
  const name = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name) return showError('Display name is required');
  if (!email) return showError('Email is required');
  if (password.length < 6) return showError('Password must be at least 6 characters');

  const btn = document.getElementById('btn-auth');
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    saveProfile(result.user, name);
    window.location.href = 'index.html';
  } catch (err) {
    showError(friendlyError(err.code));
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
};

//  Human-readable Firebase errors 
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered. Try signing in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}