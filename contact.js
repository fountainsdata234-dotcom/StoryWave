// contact.js - Manages the contact page
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDWWNQ3og4UXp8NvbY-1QJsT8Q2QH27H8",
  authDomain: "storywave-c6fbe.firebaseapp.com",
  projectId: "storywave-c6fbe",
  storageBucket: "storywave-c6fbe.appspot.com",
  messagingSenderId: "623345857055",
  appId: "1:623345857055:web:e0275651c0433b700d1b2a",
  measurementId: "G-R1C7MR9K4P" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  updateHeader(user);
});

const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitBtn.disabled) return;

  setBtnLoading(submitBtn, true, 'Sending...');
  formStatus.textContent = '';

  const name = contactForm.name.value;
  const email = contactForm.email.value;
  const subject = contactForm.subject.value;
  const message = contactForm.message.value;

  try {
    await addDoc(collection(db, 'messages'), {
      name, email, subject, message,
      sentAt: serverTimestamp(),
      status: 'new'
    });

    submitBtn.innerHTML = 'Sent ✔';
    submitBtn.classList.add('sent');
    formStatus.textContent = 'Thank you! Your message has been received.';
    contactForm.reset();

  } catch (error) {
    console.error("Error sending message:", error);
    formStatus.textContent = 'An error occurred. Please try again later.';
    setBtnLoading(submitBtn, false); // Re-enable button on error
  }
});

function updateHeader(user) {
    const userProfileHeader = document.getElementById('userProfile');
    if (!userProfileHeader) return;
    if (user) {
        const dp = user.photoURL || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(user.displayName || 'user')}`;
        userProfileHeader.innerHTML = `<a href="profile.html"><img src="${dp}" alt="Profile"></a>`;
    } else {
        userProfileHeader.innerHTML = `<button class="btn" id="openAuthDesktop">Login</button>`;
        document.getElementById('openAuthDesktop')?.addEventListener('click', () => window.location.href = 'index.html');
    }
}

function setBtnLoading(btn, loading = true, text = null) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="spinner"></span> ${text}` : btn.dataset.orig || 'Send Message';
}

document.getElementById('themeToggle')?.addEventListener('click', ()=> {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
});