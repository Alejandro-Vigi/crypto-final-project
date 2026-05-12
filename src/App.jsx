import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import HomePage from "./pages/HomePage";
import "./App.css";

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Navbar onOpenAuth={() => setModalOpen(true)} />
      <HomePage onOpenAuth={() => setModalOpen(true)} />
      <Footer />
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
