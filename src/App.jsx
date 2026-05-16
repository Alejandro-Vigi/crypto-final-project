import { useState, useEffect } from "react";
import Home from "./pages/Home";
import AlumnoView from "./pages/AlumnoView";
import AdminView from "./pages/AdminView";
import AuthModal from "./components/AuthModal";

const SESSION_KEY = "feriass_session";
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hora

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function saveSession(user) {
  const data = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export default function App() {
  const [user, setUser] = useState(() => loadSession());
  const [page, setPage] = useState(() => {
    const saved = loadSession();
    if (!saved) return "home";
    return saved.tipo === "alumno" ? "alumno" : "admin";
  });
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState("login");

  // Verificar expiración de sesión cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loadSession()) {
        setUser(null);
        setPage("home");
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (userData) => {
    saveSession(userData);
    setUser(userData);
    setShowAuth(false);
    setPage(userData.tipo === "alumno" ? "alumno" : "admin");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setPage("home");
  };

  const handleGoHome = () => setPage("home");

  const handleAcceder = () => {
    if (user) {
      setPage(user.tipo === "alumno" ? "alumno" : "admin");
    } else {
      setAuthInitialMode("login");
      setShowAuth(true);
    }
  };

  const handleVerServicios = () => {
    if (user) {
      setPage(user.tipo === "alumno" ? "alumno" : "admin");
    } else {
      setAuthInitialMode("login");
      setShowAuth(true);
    }
  };

  return (
    <>
      {page === "home" && (
        <Home
          onAcceder={handleAcceder}
          onVerServicios={handleVerServicios}
          user={user}
        />
      )}
      {page === "alumno" && user && (
        <AlumnoView user={user} onLogout={handleLogout} onGoHome={handleGoHome} />
      )}
      {page === "admin" && user && (
        <AdminView user={user} onLogout={handleLogout} onGoHome={handleGoHome} />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          initialMode={authInitialMode}
        />
      )}
    </>
  );
}