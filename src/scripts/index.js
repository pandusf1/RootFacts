import "../styles/styles.css";
import App from "./pages/app.js";

const initApp = async () => {
  const container = document.querySelector("#main-content");
  if (!container) return;

  try {
    const app = new App({ container });
    await app.renderPage();

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  } catch (error) {
    console.error("❌ App init error:", error);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

if ("serviceWorker" in navigator) {
  const registerSW = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service Worker terdaftar:", reg.scope);
      })
      .catch((err) => {
        console.warn("⚠️ Gagal meregistrasi Service Worker:", err);
      });
  };

  if (document.readyState === "complete") {
    registerSW();
  } else {
    window.addEventListener("load", registerSW);
  }
}
