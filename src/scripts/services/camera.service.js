class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.targetFps = 30;
    this.selectedDeviceId = null;
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
  }

  async loadCameras(cameraSelect) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      if (cameraSelect) {
        const currentValue = cameraSelect.value;
        cameraSelect.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "default";
        defaultOpt.textContent = "Kamera Utama (Belakang)";
        cameraSelect.appendChild(defaultOpt);

        const frontOpt = document.createElement("option");
        frontOpt.value = "front";
        frontOpt.textContent = "Kamera Depan";
        cameraSelect.appendChild(frontOpt);

        videoDevices.forEach((device, index) => {
          if (device.deviceId) {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Kamera ${index + 1}`;
            cameraSelect.appendChild(option);
          }
        });

        if (currentValue && Array.from(cameraSelect.options).some((opt) => opt.value === currentValue)) {
          cameraSelect.value = currentValue;
        }
      }

      return videoDevices;
    } catch (error) {
      console.warn("Gagal memuat daftar kamera:", error);
      return [];
    }
  }

  async startCamera(videoId, canvasId, selectedCameraValue = "default") {
    this.initializeElements(videoId, canvasId);

    if (this.stream) {
      this.stopCamera();
    }

    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    if (selectedCameraValue === "front") {
      constraints.video.facingMode = "user";
    } else if (selectedCameraValue === "default" || selectedCameraValue === "environment") {
      constraints.video.facingMode = { ideal: "environment" };
    } else if (selectedCameraValue && !selectedCameraValue.startsWith("camera-")) {
      constraints.video.deviceId = { exact: selectedCameraValue };
    } else {
      constraints.video.facingMode = { ideal: "environment" };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (primaryError) {
      console.warn("Kemungkinan constraint berlebih, mencoba fallback standar:", primaryError);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (fallbackError) {
        console.error("Gagal meminta izin kamera:", fallbackError);
        throw fallbackError;
      }
    }

    if (this.video && this.stream) {
      this.video.srcObject = this.stream;
      await this.video.play();
    }

    return this.stream;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    const numFps = Number(fps);
    if (!isNaN(numFps) && numFps > 0) {
      this.targetFps = numFps;
    }
  }

  isActive() {
    return (
      Boolean(this.stream) &&
      this.stream.active &&
      this.stream.getVideoTracks().some((track) => track.readyState === "live")
    );
  }
}

export default CameraService;
