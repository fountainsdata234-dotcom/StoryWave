# StoryWave 🌊📘📘

**Explore, Read, and Discover a universe of public domain literature.**

StoryWave is a modern, responsive web application that provides a beautiful interface for accessing thousands of free books from Project Gutenberg. It's built with vanilla JavaScript and Firebase, demonstrating a full-featured application without a complex framework.

**[View Live Demo](https://fountainsdata234-dotcom.github.io/StoryWave/)** <!-- TODO: Replace with your live URL -->

---

![StoryWave Screenshot](wave.PNG)
<!-- This image will now display correctly once 'wave.PNG' is committed to your GitHub repository. -->

## About The Project

StoryWave was created to offer a clean, engaging, and personalized reading experience for public domain classics. By leveraging the powerful Gutendex API and Firebase for backend services, it provides a seamless journey for readers to discover new worlds, track their progress, and engage with a community of book lovers.

## ✨ Features

*   **User Authentication**: Secure sign-up and login with Email/Password or Google Sign-In.
*   **Dynamic Homepage**: Features a beautiful hero carousel, personalized "Last Read" section, and "My Favorites".
*   **Book Discovery**:
    *   Powerful search by title, author, or genre.
    *   Instant search suggestions.
    *   Filter books by popular genres.
*   **Community & Personalization**:
    *   **Star Ratings**: Users can rate books, and the average rating is displayed for everyone.
    *   **Favorites**: Save books to a personal "My Favorites" list.
    *   **My Library**: Save books to a library for easy access and download links (EPUB, MOBI, PDF).
    *   **Reading History**: Automatically tracks the books you've started reading.
*   **User Profile**: A dedicated page where users can update their username, change their avatar, and view their complete reading history, favorites, and saved books.
*   **Modern UI/UX**:
    *   Fully responsive design that works on all screen sizes.
    *   Dark and Light mode theme toggle.
    *   Sleek animations, loading spinners, and a decorative starfield background.
*   **Progressive Web App (PWA)**: "Installable" on mobile devices for a native app-like experience.

## 🛠️ Built With

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
*   **Backend**: [Firebase](https://firebase.google.com/) (Authentication & Firestore Database)
*   **APIs**:
    *   [Gutendex API](https://gutendex.com/) (for Project Gutenberg books)
    *   [Dicebear Avatars](https://www.dicebear.com/) (for user avatars)
*   **Libraries**: [epub.js](https://github.com/futurepress/epub.js/) (for in-browser EPUB reading)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need a [Firebase](https://firebase.google.com/) account to handle authentication and database storage.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-github-username/your-repo-name.git
    ```

2.  **Set up Firebase:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   In your project, go to **Project Settings** > **General**.
    *   Under "Your apps", click the web icon (`</>`) to register a new web app.
    *   Copy the `firebaseConfig` object.

3.  **Update Firebase Configuration:**
    *   You will need to replace the placeholder `firebaseConfig` object in the following files with the one you copied from your Firebase project:
        *   `app.js`
        *   `contact.js`
        *   `download.js`
        *   `profile.js`

4.  **Enable Firebase Services:**
    *   In the Firebase Console, go to the **Authentication** section and enable the "Email/Password" and "Google" sign-in methods.
    *   Go to the **Firestore Database** section and create a database. You can start in test mode for easy setup.

5.  **Run the application:**
    *   Since this project uses vanilla HTML and JavaScript, you can simply open the `index.html` file in your browser. For best results and to avoid CORS issues with local files, it's recommended to use a simple local server like the Live Server extension for VS Code.

## 部署 (Deployment)

This site is ready to be deployed on any static hosting service. To deploy on **GitHub Pages**:

1.  Push your code to your GitHub repository.
2.  In your repository settings, go to the "Pages" tab.
3.  Select the branch you want to deploy from (e.g., `main`) and click "Save".
4.  Your site will be live at `https://fountainsdata234-dotcom.github.io/StoryWave/`.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Solomon Gospel - Your GitHub Profile

Project Link: https://fountainsdata234-dotcom.github.io/StoryWave/
