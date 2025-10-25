// profile.js - Manages the user profile page
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { initThemeToggle, updateHeader, setBtnLoading, escapeHtml } from './ui.js';

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

const GUTENDEX_API_URL = 'https://gutendex.com/books/';

const profileContainer = document.getElementById('profile-container');
const authPrompt = document.getElementById('auth-prompt');
const editProfileModal = document.getElementById('editProfileModal');

onAuthStateChanged(auth, async (user) => {
  updateHeader(user);
  if (user) {
    authPrompt.style.display = 'none';
    profileContainer.style.display = 'block';
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    displayProfileInfo(user, userData);
    setupTabs(userData);
    setupEditModal(user, userData);
  } else {
    profileContainer.style.display = 'none';
    authPrompt.style.display = 'block';
  }
});

function displayProfileInfo(user, userData) {
  const username = userData.username || user.displayName || 'Reader';
  const avatarSeed = userData.avatarSeed || username;
  document.getElementById('profileAvatar').src = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`;
  document.getElementById('profileUsername').textContent = username;
  document.getElementById('profileEmail').textContent = user.email;
}

function setupTabs(userData) {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Initial population
  displayBookList(userData.lastReads?.map(b => b.id) || [], 'history');
  displayBookList(userData.favorites || [], 'favorites');
  displayBookList(userData.downloads || [], 'saved');
}

async function displayBookList(bookIds, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!bookIds || bookIds.length === 0) {
    container.innerHTML = `<p class="muted" style="grid-column: 1 / -1; text-align: center;">No books in this list yet.</p>`;
    return;
  }

  container.innerHTML = `<div style="display:flex; justify-content:center; padding: 40px; grid-column: 1 / -1;"><span class="spinner"></span></div>`;
  
  const bookPromises = bookIds.map(id => fetch(`${GUTENDEX_API_URL}${id}`).then(res => res.json()));
  const booksData = await Promise.all(bookPromises);

  container.innerHTML = ''; // Clear spinner
  booksData.forEach(book => {
    if (book) container.appendChild(cardFromBook(book));
  });
}

function cardFromBook(book) {
  const art = document.createElement('article');
  art.className = 'card';
  const cover = book.formats?.['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(book.title)}`;
  const author = book.authors?.[0]?.name || 'Unknown Author';
  art.innerHTML = `
    <div class="thumb"><img src="${cover}" alt="${escapeHtml(book.title)}"/></div>
    <h4>${escapeHtml(book.title)}</h4>
    <p class="muted">${escapeHtml(author)}</p>
    <div class="actions">
      <a href="index.html" class="btn small">Details</a>
    </div>
  `;
  return art;
}

function setupEditModal(user, userData) {
    const editBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.getElementById('editProfileClose');
    const form = document.getElementById('editProfileForm');
    const usernameInput = document.getElementById('editUsername');
    const avatarSeedInput = document.getElementById('editAvatarSeed');
    const saveBtn = document.getElementById('saveProfileBtn');

    editBtn.addEventListener('click', () => {
        usernameInput.value = userData.username || user.displayName || '';
        avatarSeedInput.value = userData.avatarSeed || userData.username || user.displayName || '';
        editProfileModal.classList.add('visible');
    });

    closeBtn.addEventListener('click', () => editProfileModal.classList.remove('visible'));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setBtnLoading(saveBtn, true, 'Saving...');
        
        const newUsername = usernameInput.value.trim();
        const newAvatarSeed = avatarSeedInput.value.trim();

        try {
            // Update Firebase Auth profile
            await updateProfile(user, { displayName: newUsername });

            // Update Firestore document
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                username: newUsername,
                avatarSeed: newAvatarSeed 
            }, { merge: true });

            // Refresh UI
            displayProfileInfo(user, { ...userData, username: newUsername, avatarSeed: newAvatarSeed });
            editProfileModal.classList.remove('visible');

        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setBtnLoading(saveBtn, false);
        }
    });
}

// Basic theme toggle
initThemeToggle();