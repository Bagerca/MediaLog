// --- auth.js ---

// 1. ИМПОРТЫ (Firebase v12.6.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// 2. КОНФИГУРАЦИЯ (Твоя)
const firebaseConfig = {
    apiKey: "AIzaSyBUt7-YdXbbkJy6KGksI-2xXBRcZeQsqjk",
    authDomain: "medialog-981d1.firebaseapp.com",
    projectId: "medialog-981d1",
    storageBucket: "medialog-981d1.firebasestorage.app",
    messagingSenderId: "928778294488",
    appId: "1:928778294488:web:9a0cdfa99190957dde73ad"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 3. ЛОГИКА ИНТЕРФЕЙСА
document.addEventListener('DOMContentLoaded', () => {
    
    // Элементы
    const loginBtn = document.getElementById('navLoginBtn');
    const authModal = document.getElementById('authModal');
    const closeModal = document.getElementById('closeAuthModal');
    const authForm = document.getElementById('authForm');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPass');
    const nickInput = document.getElementById('authNick'); // Поле для Ника
    const submitBtn = document.getElementById('authSubmit');
    const toggleModeBtn = document.getElementById('authToggle');
    const modalTitle = document.getElementById('authTitle');
    const nickContainer = document.getElementById('nickContainer'); // Контейнер для поля Ника

    let isRegistering = false; // Режим: Вход или Регистрация

    // Открытие/Закрытие
    if(loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Если уже вошли -> Выход
            if (auth.currentUser) {
                const confirmLogout = confirm("TERMINATE SESSION?");
                if(confirmLogout) signOut(auth);
            } else {
                authModal.classList.add('active');
            }
        });
    }

    if(closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    // Переключение Вход <-> Регистрация
    if(toggleModeBtn) {
        toggleModeBtn.addEventListener('click', () => {
            isRegistering = !isRegistering;
            if (isRegistering) {
                modalTitle.textContent = "NEW ID REGISTRATION";
                submitBtn.textContent = "INITIATE";
                toggleModeBtn.textContent = ">> ALREADY HAVE ID? LOGIN";
                nickContainer.style.display = "block"; // Показываем поле ника
            } else {
                modalTitle.textContent = "SYSTEM ACCESS";
                submitBtn.textContent = "CONNECT";
                toggleModeBtn.textContent = ">> CREATE NEW ID";
                nickContainer.style.display = "none"; // Скрываем поле ника
            }
        });
    }

    // ОТПРАВКА ФОРМЫ
    if(submitBtn) {
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const pass = passInput.value;
            const nickname = nickInput.value;

            try {
                if (isRegistering) {
                    // --- РЕГИСТРАЦИЯ ---
                    if(!nickname) { alert("CODENAME REQUIRED"); return; }
                    
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                    const user = userCredential.user;

                    // Сохраняем никнейм в профиль Auth
                    await updateProfile(user, { displayName: nickname });

                    // Сохраняем данные в Базу (Firestore)
                    await setDoc(doc(db, "users", user.uid), {
                        username: nickname,
                        email: email,
                        rank: "ROOKIE", // Начальный ранг
                        createdAt: new Date()
                    });

                    alert("ID CREATED. WELCOME, " + nickname);
                    authModal.classList.remove('active');

                } else {
                    // --- ВХОД ---
                    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
                    // alert("ACCESS GRANTED");
                    authModal.classList.remove('active');
                }
            } catch (error) {
                console.error(error);
                alert("ERROR: " + error.code); // Покажем код ошибки
            }
        });
    }

    // 4. СЛЕЖЕНИЕ ЗА СТАТУСОМ (Вход/Выход)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Пользователь вошел
            loginBtn.innerHTML = `<span style="color:var(--gold)">● ${user.displayName || "OPERATIVE"}</span>`;
            loginBtn.style.borderColor = "var(--gold)";
            console.log("User logged in:", user.uid);
        } else {
            // Пользователь вышел
            loginBtn.innerHTML = `LOGIN // ID`;
            loginBtn.style.borderColor = "var(--border-color)";
            console.log("User logged out");
        }
    });
});
