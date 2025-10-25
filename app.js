// app.js - StoryWave (AI demo + Firebase-ready)
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

/* ------------------ FIREBASE CONFIG (user provided) ------------------ */
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
const googleProvider = new GoogleAuthProvider();

/* ------------------ DOM ------------------ */
const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();
const heroSlides = document.getElementById('heroSlides');
const cardsArea = document.getElementById('cardsArea');
const suggestionsBox = document.getElementById('suggestions');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const genreFilters = document.getElementById('genreFilters');

const detailsModal = document.getElementById('detailsModal');
const detailsBody = document.getElementById('detailsBody');
const detailsClose = document.getElementById('detailsClose');
const bookRatingSection = document.getElementById('bookRatingSection');
const averageRatingDisplay = document.getElementById('averageRatingDisplay');
const userRatingInput = document.getElementById('userRatingInput');
const ratingMessage = document.getElementById('ratingMessage');
const recentRatingsSection = document.getElementById('recentRatingsSection');
const recentRatingsList = document.getElementById('recentRatingsList');

const readerModal = document.getElementById('readerModal');
const readerClose = document.getElementById('readerClose');
const readerText = document.getElementById('readerText');
const readerTitle = document.getElementById('readerTitle');
const readerAuthor = document.getElementById('readerAuthor');
const readerFont = document.getElementById('readerFont');
const readerThemeBtn = document.getElementById('readerThemeBtn');
const epubViewer = document.getElementById('epub-viewer');
const prevChapterBtn = document.getElementById('prevChapter');
const nextChapterBtn = document.getElementById('nextChapter');
const chapterIndicator = document.getElementById('chapterIndicator');

const authModal = document.getElementById('authModal');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const googleSignInBtn = document.getElementById('googleSignIn');
const guestBtn = document.getElementById('guestBtn');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('authMessage');

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileUser = document.getElementById('mobileUser');
const mobileNavLinks = document.getElementById('mobileNavLinks');
const mobileActions = document.getElementById('mobileActions');
const desktopNav = document.querySelector('.desktop-nav');
const themeToggle = document.getElementById('themeToggle');
const backTop = document.getElementById('backTop');

const lastReadsSection = document.getElementById('lastReadsSection');
const lastReadsContainer = document.getElementById('lastReadsContainer');
const clearLastReadsBtn = document.getElementById('clearLastReads');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesContainer = document.getElementById('favoritesContainer');
const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');

let currentUser = null;
let ALL_BOOKS = []; // will hold fetched books
let visibleBooks = []; // current filtered list
let userFavorites = []; // Holds IDs of user's favorite books
let userDownloads = []; // Holds IDs of user's downloaded/saved books
let perLoad = 12; // initial cards shown
let maxShow = 40;  // search returns up to 40 cards first
let currentIndexLoaded = 0;
let userBookRatings = new Map(); // Stores {bookId: rating} for the current user
let bookAverageRatings = new Map(); // Stores {bookId: {avg: number, count: number}}
let nextPageUrl = null; // To store the URL for the next page of books
let isFetchingMore = false; // A flag to prevent multiple simultaneous fetches

// helper
const escapeHtml = s => String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

// Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

/* ------------------ Decorations: stars & shapes ------------------ */
(function decorations(){
  // starfield canvas
  const canvas = document.getElementById('starfield'); const ctx = canvas.getContext('2d');
  let w=0,h=0,stars=[];
  function resize(){ w=canvas.width=innerWidth; h=canvas.height=innerHeight; stars=[]; const count=Math.round((w*h)/20000); for(let i=0;i<count;i++){ stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+0.2,vx:(Math.random()-0.5)*0.03,vy:(Math.random()-0.5)*0.03,alpha:0.25+Math.random()*0.75}) } }
  function frame(){ ctx.clearRect(0,0,w,h); for(const s of stars){ s.x+=s.vx; s.y+=s.vy; if(s.x<0) s.x=w; if(s.x>w) s.x=0; if(s.y<0) s.y=h; if(s.y>h) s.y=0; ctx.beginPath(); ctx.globalAlpha=s.alpha; ctx.fillStyle='#fff'; ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); } requestAnimationFrame(frame); }
  window.addEventListener('resize', resize); resize(); frame();

  // floating shapes
  const box = document.getElementById('floating-shapes'); if(!box) return;
  const shapes = [];
  function makeShape(size,left,top,cls=''){ const d=document.createElement('div'); d.className='shape '+cls; d.style.width=size+'px'; d.style.height=size+'px'; d.style.left=left; d.style.top=top; box.appendChild(d); shapes.push(d); }
  makeShape(160,'6%','18%'); makeShape(120,'72%','10%','small'); makeShape(100,'46%','64%','small');
  let t=0; function move(){ t+=0.006; shapes.forEach((s,i)=>{ const dx = Math.sin(t*(0.6+i*0.4))*40; const dy = Math.cos(t*(0.8+i*0.3))*30; s.style.transform = `translate3d(${dx}px,${dy}px,0) rotate(${t*20}deg)` }); requestAnimationFrame(move); } move();
  window.__hideFloatingShapes = (hide=true)=> shapes.forEach(s=> hide ? s.classList.add('hidden') : s.classList.remove('hidden'));
})();

/* ------------------ Google Books API Fetcher ------------------ */
const GENRES = ['romance','fantasy','horror','comics','adventure','mystery']; // Matched to Gutenberg bookshelves
const GUTENDEX_API_URL = 'https://gutendex.com/books/';

async function fetchInitialBooks(topic = '') {
  cardsArea.innerHTML = `<div style="display:flex; justify-content:center; padding: 40px;"><span class="spinner" style="width: 48px; height: 48px;"></span></div>`;
  let initialUrl = `${GUTENDEX_API_URL}?topic=${encodeURIComponent(topic)}`;

  // For the initial "All" load, fetch a random page to make it different each time.
  if (topic === '') {
    const randomPage = Math.floor(Math.random() * 50) + 1; // Get a random page from 1 to 50
    initialUrl += `&page=${randomPage}`;
  }

  try {
    // If the topic is 'comics', also search for 'humor' to get more results.
    const topicsToFetch = topic === 'comics' ? [topic, 'humor'] : [topic];
    const fetchPromises = topicsToFetch.map(t => fetch(initialUrl.replace(`topic=${topic}`, `topic=${t}`)));
    const responses = await Promise.all(fetchPromises);
    const dataArray = await Promise.all(responses.map(res => res.json()));

    // Combine results and find the first valid 'next' URL
    const combinedResults = dataArray.flatMap(d => d.results);
    const data = { results: combinedResults, next: dataArray.find(d => d.next)?.next };

    const readableBooks = data.results.map(item => {
      // Prioritize .epub format for progress saving, fallback to HTML.
      const epubUrl = item.formats['application/epub+zip'];
      const htmlUrl = item.formats['text/html'];
      if (!epubUrl && !htmlUrl) return null;
      const author = item.authors[0] ? item.authors[0].name : 'Unknown Author';
      const cover = item.formats['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(item.title)}`;
      return { id: item.id, title: item.title, author, genre: mapGutenbergBookshelvesToGenre(item.bookshelves), cover, summary: `A classic book from Project Gutenberg.`, epubUrl: epubUrl || htmlUrl, isEpub: !!epubUrl };
    }).filter(Boolean);

    ALL_BOOKS = shuffleArray(readableBooks); // Shuffle the initial results for variety
    visibleBooks = readableBooks;
    nextPageUrl = data.next; // Save the URL for the next page
    
    if (ALL_BOOKS.length > 0) {
      renderCarousel(ALL_BOOKS);
      clearCards();
      renderCards(visibleBooks, 0, Math.min(perLoad, visibleBooks.length));
    } else {
      if (cardsArea) cardsArea.innerHTML = `<p class="muted" style="padding: 20px;">No books could be found. Please try again later.</p>`;
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    if (cardsArea) cardsArea.innerHTML = `<p class="muted" style="padding: 20px;">An error occurred while fetching books. Please try again later.</p>`;
  }
}

function mapGutenbergBookshelvesToGenre(bookshelves) {
  if (!bookshelves || bookshelves.length === 0) return 'Classic';
  const shelfText = bookshelves.join(' ').toLowerCase();  
  const genreMap = { 'science fiction': 'Sci-Fi', 'children': 'Kids' };
  for (const genre of GENRES) {
    if (shelfText.includes(genre.toLowerCase())) {
      const mappedGenre = genreMap[genre] || genre;
      return mappedGenre.charAt(0).toUpperCase() + mappedGenre.slice(1);
      }
  }
  return 'Classic'; // Default genre
}

/* ------------------ Render Carousel (auto + manual) ------------------ */
function renderCarousel(list){
  heroSlides.innerHTML = '';
  const items = list.slice(0,8);
  if(items.length===0){ heroSlides.innerHTML = `<div class="carousel-slide"><div style="padding:28px;color:var(--muted)">No featured books</div></div>`; return; }
  items.forEach(book=>{
    const slide = document.createElement('div'); slide.className='carousel-slide';
    // Set the book cover as the background image for the slide
    slide.style.backgroundImage = `url(${book.cover})`;
    slide.innerHTML = `
      <div class="slide-text">
        <h3>${escapeHtml(book.title)}</h3>
        <p class="muted">${escapeHtml(book.genre)} — ${escapeHtml(book.author)}</p>
        <div style="margin-top:12px">
          <button class="btn carousel-details" data-id="${book.id}">Details</button>
          <button class="btn read-from-slide" data-id="${book.id}">Read</button>
        </div>
      </div>
      <div class="slide-cover"><img class="lazy-load" data-src="${book.cover}" alt="${escapeHtml(book.title)}" /></div>
    `;
    heroSlides.appendChild(slide);
  });

  initAutoSlide(heroSlides);
}

// Event Delegation for Carousel
heroSlides.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  const book = ALL_BOOKS.find(b => b.id == button.dataset.id);
  if (!book) return;
  if (button.classList.contains('carousel-details')) showDetails(book);
  if (button.classList.contains('read-from-slide')) openReaderWithContent(book);
});

/* Auto-scroll track (works with manual scroll too) */
let carouselTimer=null;
function initAutoSlide(track){
  // Ensure track has children before trying to get width
  const slide = track.querySelector('.carousel-slide');
  if (!slide) return; // Don't start if there are no slides
  const step = slide.getBoundingClientRect().width;
  let pos = 0;
  if(carouselTimer) clearInterval(carouselTimer);
  const startInterval = () => setInterval(()=>{ const max = track.scrollWidth - track.clientWidth; pos += Math.round(step + 14); if(pos >= max) pos=0; track.scrollTo({left:pos,behavior:'smooth'}); }, 4200);
  carouselTimer = startInterval();

  // pause on hover
  track.addEventListener('mouseenter', () => clearInterval(carouselTimer));
  track.addEventListener('mouseleave', () => { clearInterval(carouselTimer); carouselTimer = startInterval(); });
}

/* ------------------ Cards & Explore ------------------ */
function cardFromBook(book){
  const art = document.createElement('article'); art.className='card'; art.dataset.id=book.id;
  art.innerHTML = `
    <div class="thumb"><img class="lazy-load" data-src="${book.cover}" alt="${escapeHtml(book.title)}"/></div>
    <h4>${escapeHtml(book.title)}</h4>
    <p class="muted">${escapeHtml(book.author)}</p>
    ${bookAverageRatings.has(book.id) ? 
      `<div class="muted small" style="margin-top:4px;">${bookAverageRatings.get(book.id).avg.toFixed(1)} ★ (${bookAverageRatings.get(book.id).count})</div>` : ''
    }
    <div class="actions">
      <button class="btn details" data-id="${book.id}">Details</button>
      <button class="btn open" data-id="${book.id}">Read</button>
      <button class="favorite-btn ${userFavorites.includes(book.id) ? 'active' : ''}" data-id="${book.id}" title="Add to favorites">♥</button>    </div>
  `;
  return art;
}
function clearCards(){ cardsArea.innerHTML = ''; currentIndexLoaded = 0; }
function renderCards(list, start=0, count=perLoad){
  const slice = list.slice(start, start+count);
  slice.forEach(b => cardsArea.appendChild(cardFromBook(b)));
  observeLazyImages(); // Tell the observer to look for new images
  updateAllCardStates(); // Ensure favorite/save states are correct after rendering
  observeRatingData(); // Fetch ratings for the new cards
  currentIndexLoaded += slice.length;
  // Hide load more button if there are no more visible books to show
  if (currentIndexLoaded >= visibleBooks.length && !nextPageUrl) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'block';
  }
}

/* ------------------ Lazy Image Loading ------------------ */
let imageObserver;
function observeLazyImages() {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-load');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: "0px 0px 200px 0px" }); // Start loading images 200px before they enter the screen
  }

  const lazyImages = document.querySelectorAll('img.lazy-load');
  lazyImages.forEach(img => imageObserver.observe(img));
}

let ratingObserver;
function observeRatingData() {
  if (!ratingObserver) {
    ratingObserver = new IntersectionObserver(async (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const card = entry.target;
          const bookId = card.dataset.id;
          observer.unobserve(card); // Observe only once

          if (!bookAverageRatings.has(bookId)) {
            const bookRef = doc(db, 'books', bookId);
            const ratingSnap = await getDoc(bookRef);
            if (ratingSnap.exists() && ratingSnap.data().averageRating !== undefined) {
              bookAverageRatings.set(bookId, { avg: ratingSnap.data().averageRating, count: ratingSnap.data().ratingCount });
              // Re-render just this card to show the rating
              const bookData = ALL_BOOKS.find(b => b.id == bookId);
              if (bookData) card.outerHTML = cardFromBook(bookData).outerHTML;
            }
          }
        }
      }
    }, { rootMargin: "0px 0px 200px 0px" });
  }
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => ratingObserver.observe(card));
}

// Event Delegation for all cards
cardsArea.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  const card = button.closest('.card');
  const book = ALL_BOOKS.find(b => b.id == card.dataset.id);
  if (!book) return;

  if (button.classList.contains('details')) {
    showDetails(book);
  } else if (button.classList.contains('open')) {
    openReaderWithContent(book);
  } else if (button.classList.contains('favorite-btn')) {
    toggleFavorite(book.id, button);
  }
});

// Event Delegation for Favorites section
favoritesContainer.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  const card = button.closest('.card');
  const book = ALL_BOOKS.find(b => b.id == card.dataset.id);
  if (!book) return;

  if (button.classList.contains('details')) showDetails(book);
  if (button.classList.contains('open')) openReaderWithContent(book);
  if (button.classList.contains('favorite-btn')) toggleFavorite(book.id, button);
});

/* ------------------ Show details modal ------------------ */
async function showDetails(book){
  const isFavorited = userFavorites.includes(book.id);
  const isSaved = userDownloads.includes(book.id);

  detailsBody.innerHTML = `
    <h2 style="margin-top:0">${escapeHtml(book.title)}</h2>
    <div class="muted">${escapeHtml(book.author)} · ${escapeHtml(book.genre)}</div>
    <div style="margin-top:12px;color:var(--muted);max-height:44vh;overflow:auto;line-height:1.6">
      ${escapeHtml(book.summary)}
    </div>
    <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn secondary save-to-library" data-id="${book.id}">${isSaved ? 'Saved' : 'Save to Library'}</button>
        <button class="btn open-from-details" data-id="${book.id}">Read now</button>
    </div>
  `;
  detailsModal.classList.add('visible');

  // --- RATING LOGIC (RESTORED) ---
  // Show rating section by default, hide if not logged in
  bookRatingSection.style.display = currentUser ? 'block' : 'none';
  recentRatingsSection.style.display = 'none'; // Hide until fetched

  // Fetch user's specific rating for this book when details modal opens
  if (currentUser) {
    const userRatingSnap = await getDoc(doc(db, 'books', book.id, 'ratings', currentUser.uid));
    if (userRatingSnap.exists()) userBookRatings.set(book.id, userRatingSnap.data().rating);
    else userBookRatings.delete(book.id); // No rating from this user
  }

  if (currentUser) {
    // Update rating UI
    let userRating = userBookRatings.get(book.id) || 0;
    let avgRatingData = bookAverageRatings.get(book.id);
    let avgRating = avgRatingData ? avgRatingData.avg : 0;
    let ratingCount = avgRatingData ? avgRatingData.count : 0;

    if (averageRatingDisplay) averageRatingDisplay.innerHTML = `Average: ${avgRating.toFixed(1)} ★ (${ratingCount} ratings)`;
    if (ratingMessage) ratingMessage.textContent = userRating > 0 ? `Your rating: ${userRating} ★` : 'Click to rate';

    const stars = userRatingInput.querySelectorAll('.star');
    stars.forEach(star => {
      const value = parseInt(star.dataset.value);
      star.classList.toggle('active', value <= userRating);

      // Re-bind events to ensure they work correctly
      const newStar = star.cloneNode(true);
      star.parentNode.replaceChild(newStar, star);
      
      newStar.addEventListener('click', () => handleStarClick(book.id, value));
      newStar.addEventListener('mouseover', () => {
        userRatingInput.querySelectorAll('.star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= value));
      });
      // No mouseout needed here, it's handled by the container listener
    });
    await fetchAndDisplayRecentRatings(book.id);
  }
}
if(detailsClose) detailsClose.addEventListener('click', ()=> detailsModal.classList.remove('visible'));

// Add mouseout event to the star container to reset hover effect
userRatingInput.addEventListener('mouseout', () => {
    const bookId = document.querySelector('#detailsBody .open-from-details')?.dataset.id; // Use a button that's always present
    if (bookId) updateStarDisplay(parseInt(bookId));
});

async function fetchAndDisplayRecentRatings(bookId) {
  if (!recentRatingsSection || !recentRatingsList) return;

  const ratingsRef = collection(db, 'books', bookId, 'ratings');
  const q = query(ratingsRef, orderBy('timestamp', 'desc'), limit(5));
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      recentRatingsSection.style.display = 'none';
      return;
    }
    recentRatingsList.innerHTML = '';
    querySnapshot.forEach(doc => {
      const ratingData = doc.data();
      const ratingItem = document.createElement('div');
      ratingItem.className = 'recent-rating-item';
      ratingItem.innerHTML = `
        <div><strong>${escapeHtml(ratingData.username || 'Anonymous')}</strong> rated it</div>
        <div class="rating-stars" style="font-size: 16px;"><span class="star active">${'★'.repeat(ratingData.rating)}</span><span style="color: var(--muted);">${'★'.repeat(5 - ratingData.rating)}</span></div>
      `;
      recentRatingsList.appendChild(ratingItem);
    });
    recentRatingsSection.style.display = 'block';
  } catch (error) {
    console.error("Error fetching recent ratings:", error);
    recentRatingsSection.style.display = 'none';
  }
}

// Event Delegation for Details Modal
detailsBody.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  const bookId = button.dataset.id;
  const book = ALL_BOOKS.find(b => b.id == bookId);
  if (!book) return;

  if (button.classList.contains('open-from-details')) {
    detailsModal.classList.remove('visible');
    openReaderWithContent(book);
  } else if (button.classList.contains('favorite-btn')) {
    toggleFavorite(book.id, button);
  } else if (button.classList.contains('save-to-library')) {
    toggleSaveToLibrary(book.id, button);
  }
});

async function handleStarClick(bookId, rating) {
  if (!currentUser) {
    authModal.classList.add('visible');
    return;
  }

  const bookRef = doc(db, 'books', bookId);
  const ratingRef = doc(db, 'books', bookId, 'ratings', currentUser.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const bookDoc = await transaction.get(bookRef);
      const ratingDoc = await transaction.get(ratingRef);

      let newTotalRating = rating;
      let newRatingCount = 1;
      let oldRating = 0;

      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        oldRating = ratingDoc.exists() ? ratingDoc.data().rating : 0;
        newTotalRating = (bookData.totalRating || 0) - oldRating + rating;
        newRatingCount = (bookData.ratingCount || 0) + (oldRating === 0 ? 1 : 0);
      }

      const newAverage = newRatingCount > 0 ? newTotalRating / newRatingCount : 0;

      // Update the book's aggregate rating
      transaction.set(bookRef, {
        averageRating: newAverage,
        ratingCount: newRatingCount,
        totalRating: newTotalRating
      }, { merge: true });

      // Set the user's individual rating
      transaction.set(ratingRef, {
        rating: rating,
        timestamp: serverTimestamp(),
        username: currentUser.displayName || 'Anonymous'
      });
    });
    await showDetails(ALL_BOOKS.find(b => b.id == bookId)); // Refresh the details modal to show new rating
  } catch (e) { console.error("Rating transaction failed: ", e); }
}

function updateStarDisplay(bookId) {
    if (!userRatingInput || !bookId) return;
    const userRating = userBookRatings.get(bookId) || 0; // bookId is already int here
    const stars = userRatingInput.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.toggle('active', parseInt(star.dataset.value) <= userRating);
    });
}

/* ------------------ Reader: open and chapter handling ------------------ */
let currentBook = null;
let rendition = null; // This will hold the epub.js rendition object

async function openReaderWithContent(book) {
  currentBook = book;
  readerTitle.textContent = book.title;
  readerAuthor.textContent = book.author || '';
  readerModal.classList.add('visible');
  document.body.style.overflow = 'hidden';
  window.__hideFloatingShapes(true);

  // If a user is logged in, save this book to their history.
  if (currentUser) {
    saveLastRead(book.id, book.title, book.genre);
  }
  
  // Find if there's a saved position for this book
  const lastReadData = (await getDoc(doc(db, 'users', currentUser.uid))).data()?.lastReads || [];
  const bookLastRead = lastReadData.find(b => b.id === book.id);
  const savedCfi = bookLastRead?.extra?.cfi;

  if (!book.epubUrl) {
    epubViewer.innerHTML = '<p class="muted" style="padding: 20px;">Sorry, this book is not available for reading.</p>';
    return;
  }

  // Reverting to iframe to avoid CORS issues when fetching content directly.
  if (book.isEpub) {
    readerText.style.display = 'none';
    epubViewer.style.display = 'flex'; // Use flex to center the loading message
    epubViewer.innerHTML = '<p class="muted" style="padding: 20px;">Loading book...</p>';
    document.getElementById('readerControls').style.display = 'flex';

    const epubBook = ePub(book.epubUrl);
    rendition = epubBook.renderTo("epub-viewer", { width: "100%", height: "100%" });
    
    // Display the book, jumping to the saved position if it exists
    rendition.display(savedCfi);

    // Update chapter indicator
    rendition.on("rendered", (section) => {
      const current = epubBook.navigation.get(section.href);
      if (current && chapterIndicator) {
        chapterIndicator.textContent = current.label || 'Chapter';
      }
    });

    // Save progress when location changes (debounced to avoid too many writes)
    let saveTimeout;
    rendition.on('locationChanged', (location) => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveLastReadPosition(currentUser.uid, { cfi: location.start.cfi });
      }, 2000); // Save every 2 seconds of inactivity
    });

  } else {
    // Fallback to iframe for non-epub books
    readerText.style.display = 'none';
    epubViewer.style.display = 'flex';
    epubViewer.innerHTML = ''; // Clear previous content
    const iframe = document.createElement('iframe');
    iframe.src = book.epubUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('title', `Reading: ${book.title}`);
    epubViewer.appendChild(iframe);
    document.getElementById('readerControls').style.display = 'none';
  }
}

// Reader UI Controls
if (readerThemeBtn) {
  readerThemeBtn.addEventListener('click', () => {
    readerPanel.classList.toggle('reader-dark-mode');
    // Also toggle theme for epub.js if active
    rendition?.themes.select(readerPanel.classList.contains('reader-dark-mode') ? 'dark' : 'default');
  });
}
if (readerFont) {
  readerFont.addEventListener('change', (e) => {
    readerText.style.fontSize = `${e.target.value}px`;
  });
}

prevChapterBtn.addEventListener('click', ()=> rendition?.prev());
nextChapterBtn.addEventListener('click', ()=> rendition?.next());
readerClose.addEventListener('click', ()=> { 
  readerModal.classList.remove('visible'); 
  document.body.style.overflow='auto'; 
  epubViewer.innerHTML='';
  epubViewer.style.display = 'none';
  rendition?.destroy();
  rendition = null;
  window.__hideFloatingShapes(false); 
});

/* ------------------ Search (by title, author, genre) & suggestions ------------------ */
let suggestionTimer = null;
searchInput.addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  suggestionsBox.style.display='none';
  if(!q) return;
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(()=>{
    const results = ALL_BOOKS.filter(b => (b.title+' '+b.author+' '+b.genre).toLowerCase().includes(q)).slice(0,6);
    suggestionsBox.innerHTML=''; if(!results.length) return;
    results.forEach(r=>{
      const div=document.createElement('div'); div.className='item';
      div.dataset.id = r.id; // Add book ID for event delegation
      div.innerHTML = `<img src="${r.cover}" alt=""><div><strong>${escapeHtml(r.title)}</strong><br><small class="muted">${escapeHtml(r.author)}</small></div>`;
      suggestionsBox.appendChild(div);
    });
    suggestionsBox.style.display='flex';
  },100); // Reduced delay for faster suggestions
});
searchInput.addEventListener('blur', ()=> setTimeout(()=> { suggestionsBox.style.display='none'; },160));

// Event Delegation for search suggestions
suggestionsBox.addEventListener('mousedown', (e) => {
  e.preventDefault(); // Prevents the input from losing focus and hiding the box
  const item = e.target.closest('.item');
  if (!item) return;
  const book = ALL_BOOKS.find(b => b.id == item.dataset.id);
  if (book) showDetails(book);
});

searchBtn.addEventListener('click', ()=> {
  setBtnLoading(searchBtn, true, 'Searching...');
  const q = searchInput.value.trim().toLowerCase();
  // Use a timeout to allow the UI to update and show the spinner
  setTimeout(() => {
    performSearch(q);
    setBtnLoading(searchBtn, false);
  }, 100); // Give a bit more time for spinner to show
});

function performSearch(q) {
  // if blank, reset
  if(!q){ 
    visibleBooks = ALL_BOOKS.slice(); 
    clearCards(); 
    renderCards(visibleBooks, 0, perLoad); 
    return; 
  }
  // genre-aware: if user types a word that is part of a genre, match genre strongly
  let results;
  
  // 1. Primary Search: Title, Author, and exact Genre match
  results = ALL_BOOKS.filter(b => 
    (b.title + ' ' + b.author).toLowerCase().includes(q) || 
    b.genre.toLowerCase() === q
  );

  // 2. Fallback Search: If no results, try a broader genre search
  if (results.length === 0) {
    const genreMatch = GENRES.find(g => g.toLowerCase().includes(q));
    if (genreMatch) {
      results = ALL_BOOKS.filter(b => b.genre.toLowerCase().includes(genreMatch.toLowerCase()));
    }
  }

  visibleBooks = results.slice(0, maxShow);
  clearCards();
  if (visibleBooks.length === 0) {
    cardsArea.innerHTML = `<p class="muted" style="padding: 20px; text-align: center;">No results found for "${escapeHtml(q)}".</p>`;
    loadMoreBtn.style.display = 'none';
  }
  renderCards(visibleBooks, 0, Math.min(perLoad, visibleBooks.length));
}

/* ------------------ Load more with animation */
async function fetchMoreBooks() {
  if (isFetchingMore || !nextPageUrl) return;

  isFetchingMore = true;
  setBtnLoading(loadMoreBtn, true, 'Loading...');

  try {
    const response = await fetch(nextPageUrl);
    const data = await response.json();

    const newBooks = data.results.map(item => {
      const htmlUrl = item.formats['text/html'];
      if (!htmlUrl) return null;
      const author = item.authors[0] ? item.authors[0].name : 'Unknown Author';
      const cover = item.formats['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(item.title)}`;
      return { id: item.id, title: item.title, author, genre: mapGutenbergBookshelvesToGenre(item.bookshelves), cover, summary: `A classic book from Project Gutenberg.`, epubUrl: htmlUrl };
    }).filter(Boolean);

    ALL_BOOKS.push(...newBooks);
    visibleBooks.push(...newBooks);
    nextPageUrl = data.next;

    // We don't need to clear cards, just append the new ones
    renderCards(newBooks, 0, newBooks.length);

  } catch (error) {
    console.error('Failed to fetch more books:', error);
  } finally {
    isFetchingMore = false;
    setBtnLoading(loadMoreBtn, false);
  }
}

loadMoreBtn.addEventListener('click', () => {
  if (!currentUser) {
    authModal.classList.add('visible');
    return;
  }

  // If there are already loaded books that are not yet visible, just render them.
  const remainingInCurrentView = visibleBooks.length - currentIndexLoaded;
  if (remainingInCurrentView > 0) {
    setBtnLoading(loadMoreBtn, true, 'Loading...');
    setTimeout(() => {
      renderCards(visibleBooks, currentIndexLoaded, Math.min(10, remainingInCurrentView));
      setBtnLoading(loadMoreBtn, false);
    }, 50);
  } else if (nextPageUrl) {
    // Otherwise, if there's a next page URL, fetch more from the API.
    fetchMoreBooks();
  }
});

/* ------------------ Genre Filters ------------------ */
if(genreFilters) genreFilters.addEventListener('click', (e)=>{
  if(!e.target.matches('.genre-btn')) return;
  const btn = e.target;
  const genre = btn.dataset.genre;

  // update active button
  genreFilters.querySelector('.active')?.classList.remove('active');
  btn.classList.add('active');

  // filter and render
  const topic = genre === 'all' ? '' : genre;
  fetchInitialBooks(topic);
});

/* ------------------ Last reads & Firestore integration ------------------ */
async function saveLastRead(bookId, title, genre, extra={}){
  if(!currentUser) return;
  try{
    const uid = currentUser.uid;
    const userRef = doc(db,'users', uid);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data().lastReads || []) : [];
    // Only update if the new book is not already the most recent one
    if (existing.length > 0 && existing[0].id === bookId) {
      return;
    }
    const filtered = existing.filter(x => x.id !== bookId);
    filtered.unshift({ id:bookId, title, genre, ts: Date.now(), extra });
    const sliced = filtered.slice(0,10);
    await setDoc(userRef, { lastReads: sliced }, { merge:true });
    renderLastReads(sliced);
    // update genre history
    await updateGenreHistory(genre);
  } catch(err){ console.error('saveLastRead failed', err); }
}
async function saveLastReadPosition(uid, pos){
  if(!uid) return;
  try{
    const userRef = doc(db,'users', uid);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data().lastReads || []) : [];
    if(existing.length){
      existing[0].extra = Object.assign(existing[0].extra || {}, pos);
      await setDoc(userRef, { lastReads: existing }, { merge:true });
    }
  } catch(e){ console.error(e); }
}
async function renderLastReads(list = []) {
  if(!lastReadsSection || !lastReadsContainer) return;
  if(!list || list.length===0){ lastReadsSection.style.display='none'; lastReadsContainer.innerHTML=''; return; }
  lastReadsSection.style.display='block'; lastReadsContainer.innerHTML='';

  for (const r of list.slice(0, 10)) {
    let bookDetails = ALL_BOOKS.find(x => x.id === r.id);

    // If book is not in the current list, fetch its details.
    if (!bookDetails) {
      try {
        const response = await fetch(`${GUTENDEX_API_URL}${r.id}`);
        const item = await response.json();
        const htmlUrl = item.formats['text/html'];
        if (htmlUrl) {
          const author = item.authors[0] ? item.authors[0].name : 'Unknown Author';
          const cover = item.formats['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(item.title)}`;
          bookDetails = { id: item.id, title: item.title, author, genre: mapGutenbergBookshelvesToGenre(item.bookshelves), cover, summary: `A classic book from Project Gutenberg.`, epubUrl: htmlUrl, isEpub: false };
          ALL_BOOKS.push(bookDetails); // Add to master list to avoid re-fetching
        }
      } catch (e) { console.error(`Could not fetch details for last read book ${r.id}`, e); }
    }

    const bk = bookDetails || {};
    const div=document.createElement('div'); div.className='last-card';
    const thumb = bk.cover || 'https://via.placeholder.com/72x96?text=...';
    div.innerHTML = `<img src="${thumb}" alt="${escapeHtml(r.title)}"><h4>${escapeHtml(r.title)}</h4><div class="muted">${escapeHtml(r.genre)}</div><div style="margin-top:8px"><button class="btn small last-continue" data-id="${r.id}">Continue</button></div>`;
    lastReadsContainer.appendChild(div);
  }
}
lastReadsContainer.addEventListener('click', (e) => {
  const button = e.target.closest('.last-continue');
  if (!button) return;
  const book = ALL_BOOKS.find(b => b.id == button.dataset.id);
  if (book) openReaderWithContent(book);
});
if(clearLastReadsBtn) clearLastReadsBtn.addEventListener('click', async ()=> {
  if(!currentUser) return;
  try{ await updateDoc(doc(db,'users', currentUser.uid), { lastReads: [] }); renderLastReads([]); } catch(e){ console.error(e); }
});

/* ------------------ Favorites & Firestore integration ------------------ */
async function toggleFavorite(bookId, btnElement) {
  if (!currentUser) {
    authModal.classList.add('visible');
    return;
  }
  const userRef = doc(db, 'users', currentUser.uid);
  const isFavorited = userFavorites.includes(bookId);
  
  if (isFavorited) {
    userFavorites = userFavorites.filter(id => id !== bookId);
  } else {
    userFavorites.push(bookId);
  }

  try {
    await setDoc(userRef, { favorites: userFavorites }, { merge: true });
    // Update all heart icons for this book on the page
    document.querySelectorAll(`.favorite-btn[data-id="${bookId}"]`).forEach(btn => btn.classList.toggle('active', !isFavorited));
    renderFavorites(userFavorites); // Re-render the favorites section to add/remove the card
  } catch (err) {
    console.error("Failed to update favorites:", err);
  }
}

async function toggleSaveToLibrary(bookId, btnElement) {
    if (!currentUser) {
        authModal.classList.add('visible');
        return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    const isSaved = userDownloads.includes(bookId);

    if (isSaved) {
        userDownloads = userDownloads.filter(id => id !== bookId);
    } else {
        userDownloads.push(bookId);
    }

    try {
        await setDoc(userRef, { downloads: userDownloads }, { merge: true });
        btnElement.textContent = isSaved ? 'Save to Library' : 'Saved';
        btnElement.classList.toggle('active', !isSaved);
    } catch (err) { console.error("Failed to update library:", err); }
}

async function renderFavorites(favIds = []) {
  if (!favoritesSection || !favoritesContainer) return;
  if (!favIds || favIds.length === 0) { favoritesSection.style.display = 'none'; return; }
  
  favoritesSection.style.display = 'block';
  favoritesContainer.innerHTML = `<div style="display:flex; justify-content:center; padding: 20px;"><span class="spinner"></span></div>`;

  const favoriteBookDetails = [];
  for (const bookId of favIds) {
    let book = ALL_BOOKS.find(b => b.id === bookId);
    if (!book) {
      try {
        const response = await fetch(`${GUTENDEX_API_URL}${bookId}`);
        const item = await response.json();
        const htmlUrl = item.formats['text/html'];
        if (htmlUrl) {
          const author = item.authors[0] ? item.authors[0].name : 'Unknown Author';
          const cover = item.formats['image/jpeg'] || `https://via.placeholder.com/128x180?text=${escapeHtml(item.title)}`;
          book = { id: item.id, title: item.title, author, genre: mapGutenbergBookshelvesToGenre(item.bookshelves), cover, summary: `A classic book from Project Gutenberg.`, epubUrl: htmlUrl, isEpub: false };
          ALL_BOOKS.push(book); // Add to master list to avoid re-fetching
        }
      } catch (e) { console.error(`Could not fetch details for favorite book ${bookId}`, e); }
    }
    if (book) {
      const card = cardFromBook(book);
      if (card.querySelector('.favorite-btn')) card.querySelector('.favorite-btn').classList.add('active');
      favoriteBookDetails.push(card);
      }
  }
  favoritesContainer.innerHTML = ''; // Clear spinner
  favoriteBookDetails.forEach(card => favoritesContainer.appendChild(card));
  observeLazyImages(); // Tell the observer to look for the new images
}
if(clearFavoritesBtn) clearFavoritesBtn.addEventListener('click', async () => { if(!currentUser) return; try { await setDoc(doc(db, 'users', currentUser.uid), { favorites: [] }, { merge: true }); userFavorites = []; renderFavorites([]); } catch(e) { console.error(e); } });

/* Genre history */
async function updateGenreHistory(genre){
  if(!currentUser) return;
  try{
    const userRef = doc(db,'users', currentUser.uid);
    const snap = await getDoc(userRef);
    const current = snap.exists() ? (snap.data().genreHistory || {}) : {};
    current[genre] = (current[genre] || 0) + 1;
    await setDoc(userRef, { genreHistory: current }, { merge:true });
  } catch(err){ console.error(err); }
}

/* ------------------ Auth flows (email + google + guest) ------------------ */
if(signupBtn) signupBtn.addEventListener('click', async ()=>{
  const email = emailInput.value.trim(); const password = passwordInput.value.trim(); const username = usernameInput.value.trim();
  if(!email||!password||!username){ if(authMessage) authMessage.textContent='Fill all fields'; return; }
  setBtnLoading(signupBtn,true,'Creating...');
  authMessage.textContent = ''; // Clear previous messages
  try{
    const cred = await createUserWithEmailAndPassword(auth,email,password);
    await updateProfile(cred.user,{ displayName: username });
    await setDoc(doc(db,'users',cred.user.uid), { username, email, joinedAt: Date.now(), lastReads: [], genreHistory: {} });
    authMessage.textContent='Account created';
    localStorage.setItem('storywave_seen_auth','1');
    authModal.classList.remove('visible');
  } catch(err){ console.error(err); authMessage.textContent = err.message; } finally { setBtnLoading(signupBtn,false); }
});
if(loginBtn) loginBtn.addEventListener('click', async ()=> {
  const email = emailInput.value.trim(); const password = passwordInput.value.trim();
  if(!email||!password){ if(authMessage) authMessage.textContent='Enter email and password'; return; }
  authMessage.textContent = ''; // Clear previous messages
  setBtnLoading(loginBtn,true,'Signing in...');
  try{ await signInWithEmailAndPassword(auth,email,password); authMessage.textContent='Welcome back'; localStorage.setItem('storywave_seen_auth','1'); authModal.classList.remove('visible'); }
  catch(err){ console.error(err); authMessage.textContent = err.message; } finally { setBtnLoading(loginBtn,false); }
});
if(googleSignInBtn) googleSignInBtn.addEventListener('click', async ()=> {
  setBtnLoading(googleSignInBtn,true,'Google...');
  authMessage.textContent = ''; // Clear previous messages
  try{ const result = await signInWithPopup(auth, googleProvider); const uid = result.user.uid; const userRef = doc(db,'users',uid); const snap = await getDoc(userRef); if(!snap.exists()) await setDoc(userRef,{ username: result.user.displayName || 'Reader', email: result.user.email || '', joinedAt: Date.now(), lastReads: [], genreHistory:{} }); localStorage.setItem('storywave_seen_auth','1'); authModal.classList.remove('visible'); }
  catch(err){ console.error(err); authMessage.textContent = err.message; } finally { setBtnLoading(googleSignInBtn,false); }
});
if(guestBtn) guestBtn.addEventListener('click', ()=> { localStorage.setItem('storywave_seen_auth','1'); authModal.classList.remove('visible'); showGuestUI(); });

function setBtnLoading(btn, loading=true, text=null){ if(!btn) return; if(loading){ btn.dataset.orig = btn.innerHTML; btn.disabled=true; btn.innerHTML = `<span class="spinner"></span> ${text || btn.textContent}` } else { if(btn.dataset.orig) btn.innerHTML = btn.dataset.orig; btn.disabled=false; delete btn.dataset.orig; }}

/* Logout */
async function logout() {
  try {
    await signOut(auth);
    // onAuthStateChanged will handle all UI updates automatically.
  } catch (e) { console.error('Logout failed:', e); }
}

/* UI: guest and user view */
function showGuestUI(){
  // Mobile view
  if(mobileUser && mobileActions) {
    mobileUser.innerHTML = `<img src="https://api.dicebear.com/8.x/thumbs/svg?seed=Guest" alt="Guest"><div><strong>Guest</strong><div class="muted small">Sign in to save reads</div></div>`;
    mobileActions.innerHTML = `<button class="btn" id="openAuthMobile">Login / Sign Up</button>`;
    document.getElementById('openAuthMobile')?.addEventListener('click', ()=> authModal.classList.add('visible'));
  }
  // Desktop view
  const userProfile = document.getElementById('userProfile');
  if (userProfile) {
    userProfile.innerHTML = `<button class="btn" id="openAuthDesktop">Login / Sign Up</button>`;
    document.getElementById('openAuthDesktop')?.addEventListener('click', () => authModal.classList.add('visible'));
  }
  if(lastReadsSection) lastReadsSection.style.display='none';
}
async function showUserUI(user){
  if(!user) { showGuestUI(); return; }
  const snap = await getDoc(doc(db,'users', user.uid));
  const data = snap.exists() ? snap.data() : {};
  const username = data.username || user.displayName || user.email || 'Reader';
  const dp = user.photoURL || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(username)}`;

  // Mobile View
  if(mobileUser && mobileActions) {
    mobileUser.innerHTML = `<img src="${dp}" alt="dp"><div><strong>${escapeHtml(username)}</strong><div class="muted small">${escapeHtml(user.email||'')}</div></div>`;
    mobileActions.innerHTML = `<button class="btn secondary" id="mobileLogout">Logout</button>`;
    document.getElementById('mobileLogout')?.addEventListener('click', logout);
  }
  
  // Desktop View
  const userProfile = document.getElementById('userProfile');
  if(userProfile) {
    userProfile.innerHTML = `
      <a href="profile.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
        <img src="${dp}" alt="dp">
        <div><strong>${escapeHtml(username)}</strong></div>
      </a>
      <button class="btn secondary" id="logoutBtn">Logout</button>
    `;
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
  }

  const lastReads = (snap.exists() ? snap.data().lastReads : []) || [];
  renderLastReads(lastReads);
  userFavorites = (snap.exists() ? snap.data().favorites : []) || [];
  userDownloads = (snap.exists() ? snap.data().downloads : []) || [];
  renderFavorites(userFavorites);
  updateAllCardStates(); // Update favorite/save buttons on existing cards after user data is loaded
  populateExploreByGenresFromUser(data);
}

/* get top genres & adapt explore if needed */
function populateExploreByGenresFromUser(data){
  const gh = data?.genreHistory ? Object.keys(data.genreHistory).sort((a,b)=> (data.genreHistory[b]||0)-(data.genreHistory[a]||0)) : [];
  if(gh.length){
    const prioritized = gh.concat(GENRES.filter(g=>!gh.includes(g)));
    // This function should prepare the personalized list but NOT overwrite the main visibleBooks list before the initial render.
    // We will set the main visibleBooks list based on the user's status in the onAuthStateChanged handler.
    visibleBooks = shuffleArray(ALL_BOOKS.filter(b => prioritized.includes(b.genre.toLowerCase())));
  } 
}

/* Auth observer */
onAuthStateChanged(auth, async (user)=>{
  currentUser = user;
  // Always wait for the initial book fetch to complete before updating the UI.
  await initialBookFetch;

  if(user){ 
    authModal.classList.remove('visible'); 
    await showUserUI(user); 
    localStorage.setItem('storywave_seen_auth','1');
    populateExploreByGenresFromUser(user.uid); // Personalize after login
  } else { 
    const seenAuth = localStorage.getItem('storywave_seen_auth'); 
    if(!seenAuth) authModal.classList.add('visible'); 
    showGuestUI(); 
  }
});

/* ------------------ UI Controls & Theme ------------------ */
if(hamburger) hamburger.addEventListener('click', ()=> {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  if (mobileMenu.classList.contains('open')) {
    mobileNavLinks.innerHTML = desktopNav.innerHTML;
  }
});
if(themeToggle) themeToggle.addEventListener('click', ()=> {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.getElementById('meta-theme-color')?.setAttribute('content', next === 'dark' ? '#0b1220' : '#f6f9fb');
});
window.addEventListener('scroll', ()=> { document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY>24); backTop.style.display = window.scrollY>500 ? 'block' : 'none'; });
document.getElementById('backTop')?.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}) );

/* ------------------ init app ------------------ */
let initialBookFetch;
(async function init(){
  // Check for cached book data to prevent re-fetching on back navigation
  const cachedBooks = sessionStorage.getItem('storywave_books_cache');
  if (cachedBooks) {
    // If cache exists, load from it
    ALL_BOOKS = JSON.parse(cachedBooks);
    visibleBooks = ALL_BOOKS;
    nextPageUrl = sessionStorage.getItem('storywave_next_url');
    
    // Render content immediately from cache
    renderCarousel(ALL_BOOKS);
    clearCards();
    renderCards(visibleBooks, 0, Math.min(perLoad, visibleBooks.length));
    
    // Set initialBookFetch to an already resolved promise since data is loaded
    initialBookFetch = Promise.resolve();
  } else {
    // If no cache, fetch fresh data from the API
    initialBookFetch = fetchInitialBooks('');
  }

  // Auth observer now runs inside init, after book fetching/caching is decided
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    await initialBookFetch; // Wait for books to be ready
    if (user) {
      await showUserUI(user);
    } else {
      showGuestUI();
      if (!localStorage.getItem('storywave_seen_auth')) authModal.classList.add('visible');
    }
  });
})().catch(err => { console.error("Initialization failed:", err); if(document.getElementById('loading-status')) document.getElementById('loading-status').textContent = 'Error loading books.'; });
