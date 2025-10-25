// download.js - Manages the user's saved library page
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

const libraryGrid = document.getElementById('libraryGrid');
const userProfileHeader = document.getElementById('userProfile');
const GUTENDEX_API_URL = 'https://gutendex.com/books/';

const escapeHtml = s => String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

onAuthStateChanged(auth, async (user) => {
  updateHeader(user);
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      displaySavedBooks(userData.downloads || []);
    }
  } else {
    // If no user, show a message and a link to log in.
    if (libraryGrid) {
        libraryGrid.innerHTML = `<p class="muted" style="grid-column: 1 / -1; text-align: center; padding: 40px;">Please <a href="index.html" style="text-decoration: underline;">log in</a> to see your saved library.</p>`;
    }
  }
});

async function displaySavedBooks(savedIds) {
  if (!libraryGrid) return;
  if (savedIds.length === 0) {
    libraryGrid.innerHTML = `<p class="muted" style="grid-column: 1 / -1; text-align: center; padding: 40px;">You haven't saved any books yet. Explore the homepage to find your next read!</p>`;
    return;
  }

  libraryGrid.innerHTML = `<div style="display:flex; justify-content:center; padding: 40px; grid-column: 1 / -1;"><span class="spinner" style="width: 48px; height: 48px;"></span></div>`;

  const bookPromises = savedIds.map(id => fetch(`${GUTENDEX_API_URL}${id}`).then(res => res.json()));
  const savedBooksData = await Promise.all(bookPromises);

  libraryGrid.innerHTML = ''; // Clear spinner
  savedBooksData.forEach(bookData => {
    if (bookData) {
      libraryGrid.appendChild(cardFromBook(bookData));
    }
  });
}

function cardFromBook(book) {
  const art = document.createElement('article');
  art.className = 'card';
  art.dataset.id = book.id;
  const cover = book.formats['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(book.title)}`;
  const author = book.authors[0]?.name || 'Unknown Author';

  // Create download links
  const formats = book.formats;
  let downloadLinks = '';
  if (formats['application/epub+zip']) downloadLinks += `<a href="${formats['application/epub+zip']}" target="_blank" rel="noopener noreferrer">EPUB</a>`;
  if (formats['application/x-mobipocket-ebook']) downloadLinks += `<a href="${formats['application/x-mobipocket-ebook']}" target="_blank" rel="noopener noreferrer">MOBI</a>`;
  if (formats['application/pdf']) downloadLinks += `<a href="${formats['application/pdf']}" target="_blank" rel="noopener noreferrer">PDF</a>`;

  art.innerHTML = `
    <div class="thumb"><img src="${cover}" alt="${escapeHtml(book.title)}"/></div>
    <h4>${escapeHtml(book.title)}</h4>
    <p class="muted">${escapeHtml(author)}</p>
    <div class="actions">
      <a href="index.html#read-${book.id}" class="btn">Read</a>
    </div>
    <div class="download-links">
      ${downloadLinks || '<p class="muted small">No download formats available.</p>'}
    </div>
  `;
  return art;
}

function updateHeader(user) {
    if (!userProfileHeader) return;
    if (user) {
        const dp = user.photoURL || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(user.displayName || 'user')}`;
        userProfileHeader.innerHTML = `
            <a href="profile.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
                <img src="${dp}" alt="Profile">
            </a>
            <button class="btn secondary" id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn')?.addEventListener('click', () => auth.signOut());
    } else {
        userProfileHeader.innerHTML = `<button class="btn" id="openAuthDesktop">Login / Sign Up</button>`;
        // The auth modal is on the index page, so we link there.
        document.getElementById('openAuthDesktop')?.addEventListener('click', () => window.location.href = 'index.html');
    }
}

// Basic theme toggle
document.getElementById('themeToggle')?.addEventListener('click', ()=> {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
});