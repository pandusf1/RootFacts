import {
  showElement,
  hideElement,
} from "../../utils/index.js";

const LABEL_TRANSLATIONS = {
  Beetroot: "Bit (Beetroot)",
  Paprika: "Paprika",
  Cabbage: "Kubis / Kol",
  Carrot: "Wortel",
  Cauliflower: "Kembang Kol",
  Chilli: "Cabai",
  Corn: "Jagung",
  Cucumber: "Mentimun",
  eggplant: "Terung",
  Garlic: "Bawang Putih",
  Ginger: "Jahe",
  Lettuce: "Selada",
  Onion: "Bawang Merah",
  Peas: "Kacang Polong",
  Potato: "Kentang",
  Turnip: "Lobak",
  Soybean: "Kedelai",
  Spinach: "Bayam",
};

class HomePresenter {
  constructor({ view, cameraService, detectionService, rootFactsService }) {
    this.view = view;
    this.cameraService = cameraService;
    this.detectionService = detectionService;
    this.rootFactsService = rootFactsService;

    this.isDetecting = false;
    this.detectionAnimationId = null;
    this.lastFrameTime = 0;
    this.currentDetectedVeg = "";
    this.targetFps = 30;

    // DOM Elements
    this.videoElement = null;
    this.canvasElement = null;
    this.cameraSelect = null;
    this.fpsSlider = null;
    this.fpsLabel = null;
    this.toneSelect = null;
    this.btnToggle = null;
    this.btnCopy = null;

    this.statusDot = null;
    this.statusText = null;

    this.stateIdle = null;
    this.stateLoading = null;
    this.stateResult = null;

    this.detectedName = null;
    this.detectedConfidence = null;
    this.confidenceFill = null;

    this.funFactText = null;
    this.funFactLoading = null;

    // Modal elements
    this.cameraModal = null;
    this.btnAllowCamera = null;
    this.btnDenyCamera = null;
  }

  async init() {
    this._bindElements();
    this._setupEventListeners();

    // 1. Safe camera setup (does not block model loading)
    try {
      await this._setupCameras();
    } catch (camErr) {
      console.warn("⚠️ Camera setup warning:", camErr);
    }

    // 2. Load detection & fact models
    try {
      await this._initializeModels();
    } catch (modelErr) {
      console.error("❌ Model initialization warning:", modelErr);
      this._updateStatus("Gagal Memuat Model", "error");
    }

    // 3. Show camera permission dialog
    this._showCameraPermissionModal();
  }

  _showCameraPermissionModal() {
    // Check if user has already decided (using localStorage)
    const alreadyDecided = localStorage.getItem("camera_permission_decided");
    if (alreadyDecided === "allowed" && !this.cameraService.isActive()) {
      // Auto-start silently if previously allowed
      this.startCamera().catch((err) => {
        console.warn("Auto-start camera failed:", err);
      });
      return;
    }
    if (alreadyDecided === "denied") {
      // User previously denied — don't show modal again, just let them toggle manually
      return;
    }

    // First visit: show the permission modal
    if (this.cameraModal) {
      this.cameraModal.classList.add("visible");
      document.body.style.overflow = "hidden";

      // Refresh lucide icons inside modal
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }
    }
  }

  _closeModal() {
    if (this.cameraModal) {
      this.cameraModal.classList.remove("visible");
      document.body.style.overflow = "";
    }
  }

  _bindElements() {
    this.videoElement = document.getElementById("media-video");
    this.canvasElement = document.getElementById("media-canvas");
    this.cameraSelect = document.getElementById("camera-select");
    this.fpsSlider = document.getElementById("fps-slider");
    this.fpsLabel = document.getElementById("fps-label");
    this.toneSelect = document.getElementById("tone-select");
    this.btnToggle = document.getElementById("btn-toggle");
    this.btnCopy = document.getElementById("btn-copy");

    this.statusDot = document.getElementById("status-dot");
    this.statusText = document.getElementById("status-text");

    this.stateIdle = document.getElementById("state-idle");
    this.stateLoading = document.getElementById("state-loading");
    this.stateResult = document.getElementById("state-result");

    this.detectedName = document.getElementById("detected-name");
    this.detectedConfidence = document.getElementById("detected-confidence");
    this.confidenceFill = document.getElementById("confidence-fill");

    this.funFactText = document.getElementById("fun-fact-text");
    this.funFactLoading = document.getElementById("fun-fact-loading");

    // Modal elements
    this.cameraModal = document.getElementById("camera-permission-modal");
    this.btnAllowCamera = document.getElementById("btn-allow-camera");
    this.btnDenyCamera = document.getElementById("btn-deny-camera");

    if (this.fpsSlider) {
      this.targetFps = Number(this.fpsSlider.value) || 30;
    }
  }

  _setupEventListeners() {
    // Camera permission modal buttons
    if (this.btnAllowCamera) {
      this.btnAllowCamera.addEventListener("click", async () => {
        localStorage.setItem("camera_permission_decided", "allowed");
        this._closeModal();
        await this.startCamera();
      });
    }

    if (this.btnDenyCamera) {
      this.btnDenyCamera.addEventListener("click", () => {
        localStorage.setItem("camera_permission_decided", "denied");
        this._closeModal();
      });
    }

    // Close modal by clicking backdrop
    if (this.cameraModal) {
      this.cameraModal.addEventListener("click", (e) => {
        if (e.target === this.cameraModal) {
          localStorage.setItem("camera_permission_decided", "denied");
          this._closeModal();
        }
      });
    }

    if (this.btnToggle) {
      this.btnToggle.addEventListener("click", () => this.toggleCamera());
    }

    if (this.cameraSelect) {
      this.cameraSelect.addEventListener("change", async () => {
        if (this.cameraService.isActive()) {
          await this.startCamera();
        }
      });
    }

    if (this.fpsSlider) {
      this.fpsSlider.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.targetFps = val;
        if (this.fpsLabel) {
          this.fpsLabel.textContent = `${val} FPS`;
        }
        this.cameraService.setFPS(val);
      });
    }

    if (this.toneSelect) {
      this.toneSelect.addEventListener("change", (e) => {
        const selectedTone = e.target.value;
        this.rootFactsService.setTone(selectedTone);

        if (this.currentDetectedVeg) {
          this._fetchFunFact(this.currentDetectedVeg, selectedTone);
        }
      });
    }

    if (this.btnCopy) {
      this.btnCopy.addEventListener("click", () => this._handleCopyFact());
    }
  }

  async _initializeModels() {
    this._updateStatus("Memuat Deteksi... 0%", "loading");

    try {
      const visionResult = await this.detectionService.loadModel((percentage) => {
        this._updateStatus(`Memuat Deteksi: ${percentage}%`, "loading");
      });

      const backendName = visionResult.backend?.toUpperCase() || "WEBGL";

      // Load Generative AI text model with live progress feedback
      this.rootFactsService.loadModel((statusText) => {
        this._updateStatus(statusText, "loading");
      }).then(() => {
        this._updateStatus(`Model Siap (${backendName})`, "ready");
      }).catch((tfErr) => {
        console.warn("Transformers.js load warning:", tfErr);
        this._updateStatus(`Model Siap (${backendName})`, "ready");
      });
    } catch (error) {
      console.error("Gagal inisialisasi model:", error);
      this._updateStatus("Error Memuat Model", "error");
    }
  }

  async _setupCameras() {
    if (this.cameraSelect) {
      await this.cameraService.loadCameras(this.cameraSelect);
    }
  }

  _updateStatus(message, state = "ready") {
    if (this.statusText) {
      this.statusText.textContent = message;
    }
    if (this.statusDot) {
      this.statusDot.className = "status-dot";
      if (state === "ready") {
        this.statusDot.classList.add("ready");
      } else if (state === "loading") {
        this.statusDot.classList.add("loading");
      } else if (state === "error") {
        this.statusDot.classList.add("error");
      }
    }
  }

  async toggleCamera() {
    if (this.cameraService.isActive()) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      const selectedCam = this.cameraSelect ? this.cameraSelect.value : "default";
      await this.cameraService.startCamera("media-video", "media-canvas", selectedCam);

      await this._setupCameras();

      const placeholder = document.getElementById("camera-placeholder");
      if (placeholder) hideElement(placeholder);

      const overlay = document.getElementById("camera-overlay");
      if (overlay) showElement(overlay);

      if (this.btnToggle) {
        this.btnToggle.classList.add("active");
      }

      this._startDetectionLoop();
    } catch (error) {
      console.error("Tidak dapat memulai kamera:", error);
      alert("Gagal mengakses kamera. Mohon pastikan izin kamera telah diberikan.");
    }
  }

  stopCamera() {
    this._stopDetectionLoop();
    this.cameraService.stopCamera();

    const placeholder = document.getElementById("camera-placeholder");
    if (placeholder) showElement(placeholder);

    const overlay = document.getElementById("camera-overlay");
    if (overlay) hideElement(overlay);

    if (this.btnToggle) {
      this.btnToggle.classList.remove("active");
    }

    this.currentDetectedVeg = "";
    this._showIdleState();
  }

  _startDetectionLoop() {
    this.isDetecting = true;
    this.lastFrameTime = performance.now();

    const loop = async (now) => {
      if (!this.isDetecting) return;

      const elapsed = now - this.lastFrameTime;
      const frameInterval = 1000 / this.targetFps;

      if (elapsed >= frameInterval) {
        this.lastFrameTime = now - (elapsed % frameInterval);
        await this._processPredictionFrame();
      }

      this.detectionAnimationId = requestAnimationFrame(loop);
    };

    this.detectionAnimationId = requestAnimationFrame(loop);
  }

  _stopDetectionLoop() {
    this.isDetecting = false;
    if (this.detectionAnimationId) {
      cancelAnimationFrame(this.detectionAnimationId);
      this.detectionAnimationId = null;
    }
  }

  async _processPredictionFrame() {
    if (!this.videoElement || !this.detectionService.model || !this.isDetecting) return;

    try {
      const result = await this.detectionService.predict(this.videoElement);

      if (result && result.isValid) {
        const detectedVeg = result.label;
        const currentTone = this.toneSelect ? this.toneSelect.value : "normal";

        // Stop camera stream & detection loop immediately upon detection (per reviewer mandate)
        this.stopCamera();

        // Show detection results UI
        this._showResultState(result);

        // Fetch and display fun fact
        this.currentDetectedVeg = detectedVeg;
        await this._fetchFunFact(detectedVeg, currentTone);
      }
    } catch (err) {
      console.warn("Prediction loop error:", err);
    }
  }

  _showIdleState() {
    hideElement(this.stateLoading);
    hideElement(this.stateResult);
    showElement(this.stateIdle);
  }

  _showResultState(result) {
    hideElement(this.stateIdle);
    hideElement(this.stateLoading);
    showElement(this.stateResult);

    if (this.detectedName) {
      const translatedName = LABEL_TRANSLATIONS[result.label] || result.label;
      this.detectedName.textContent = translatedName;
    }

    if (this.detectedConfidence) {
      this.detectedConfidence.textContent = `${result.confidence}%`;
    }

    if (this.confidenceFill) {
      this.confidenceFill.style.width = `${result.confidence}%`;
    }
  }

  async _fetchFunFact(vegetable, tone) {
    if (this.funFactLoading) showElement(this.funFactLoading);
    if (this.funFactText) {
      this.funFactText.textContent = "Si Otak sedang berpikir...";
      hideElement(this.funFactText);
    }

    try {
      const fact = await this.rootFactsService.generateFacts(vegetable, tone);
      if (this.funFactText) {
        this.funFactText.textContent = fact;
        showElement(this.funFactText);
      }
    } catch (error) {
      console.error("Gagal mendapatkan fakta:", error);
      if (this.funFactText) {
        this.funFactText.textContent = `${vegetable} adalah sayuran sehat yang kaya akan nutrisi dan vitamin!`;
        showElement(this.funFactText);
      }
    } finally {
      if (this.funFactLoading) hideElement(this.funFactLoading);
    }
  }

  async _handleCopyFact() {
    if (!this.funFactText) return;
    const textToCopy = this.funFactText.textContent;

    if (!textToCopy || textToCopy.includes("sedang berpikir")) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      if (this.btnCopy) {
        const originalHTML = this.btnCopy.innerHTML;
        this.btnCopy.innerHTML = `<i data-lucide="check" width="18" height="18"></i> Tersalin!`;
        if (typeof lucide !== "undefined") lucide.createIcons();

        setTimeout(() => {
          this.btnCopy.innerHTML = originalHTML;
          if (typeof lucide !== "undefined") lucide.createIcons();
        }, 2000);
      }
    } catch (err) {
      console.error("Gagal menyalin fakta:", err);
      alert("Gagal menyalin teks ke clipboard.");
    }
  }
}

export default HomePresenter;
