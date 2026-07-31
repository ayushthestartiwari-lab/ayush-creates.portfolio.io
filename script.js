// ============================
// Firebase Setup
// ============================
const firebaseConfig = {
    apiKey: "AIzaSyARMelveHsQCCcHCTO9pgjGUwDg4n0feno",
    authDomain: "be-ahead-6c79d.firebaseapp.com",
    projectId: "be-ahead-6c79d",
    storageBucket: "be-ahead-6c79d.firebasestorage.app",
    messagingSenderId: "401935831253",
    appId: "1:401935831253:web:1587ee33706c1220b6125c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ============================
// UI toggle (sign up / sign in panel)
// ============================
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// ============================
// Validation helpers
// ============================

// Email validation (basic real-world format check)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
function isValidPassword(password) {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

// Turns Firebase's error codes into readable messages
function friendlyAuthError(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Try signing in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

// ============================
// Sign Up
// ============================
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorDiv = document.getElementById('signupError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorDiv.textContent = '';

    if (name.length < 2) {
        errorDiv.textContent = 'Name must be at least 2 characters long';
        return;
    }

    if (!isValidEmail(email)) {
        errorDiv.textContent = 'Please enter a valid email address';
        return;
    }

    if (!isValidPassword(password)) {
        errorDiv.textContent = 'Password must have 8+ chars, uppercase, lowercase, number, and special char (@$!%*?&)';
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            window.location.href = 'home.html';
        })
        .catch((error) => {
            errorDiv.textContent = friendlyAuthError(error);
        })
        .finally(() => {
            if (submitBtn) submitBtn.disabled = false;
        });
});

// ============================
// Sign In
// ============================
document.getElementById('signinForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorDiv = document.getElementById('signinError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorDiv.textContent = '';

    if (!isValidEmail(email)) {
        errorDiv.textContent = 'Please enter a valid email address';
        return;
    }

    if (password.length === 0) {
        errorDiv.textContent = 'Password cannot be empty';
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    const persistenceType = rememberMe
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;

    auth.setPersistence(persistenceType)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then(() => {
            window.location.href = 'home.html';
        })
        .catch((error) => {
            errorDiv.textContent = friendlyAuthError(error);
        })
        .finally(() => {
            if (submitBtn) submitBtn.disabled = false;
        });
});
