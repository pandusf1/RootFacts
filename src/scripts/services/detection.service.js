import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import "@tensorflow/tfjs-backend-webgl";
import { APP_CONFIG } from "../config.js";

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.currentBackend = "webgl";
    this.performanceStats = {
      operations: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }

  async loadModel(onProgressCallback = null) {
    try {
      // 1. Safe Adaptive Backend Strategy (WebGPU -> WebGL fallback)
      let backendSelected = "webgl";
      if (typeof navigator !== "undefined" && "gpu" in navigator) {
        try {
          if (tf.findBackend && tf.findBackend("webgpu")) {
            await tf.setBackend("webgpu");
            await tf.ready();
            backendSelected = "webgpu";
            console.log("✅ DetectionService: WebGPU backend active");
          } else {
            await tf.setBackend("webgl");
            await tf.ready();
            backendSelected = "webgl";
          }
        } catch (gpuError) {
          console.warn("⚠️ WebGPU setBackend failed, falling back to WebGL:", gpuError);
          await tf.setBackend("webgl");
          await tf.ready();
          backendSelected = "webgl";
        }
      } else {
        await tf.setBackend("webgl");
        await tf.ready();
        backendSelected = "webgl";
      }
      this.currentBackend = backendSelected;

      // 2. Fetch metadata.json with safe fallback path resolution
      let metadataResponse;
      try {
        metadataResponse = await fetch("/model/metadata.json");
        if (!metadataResponse.ok) throw new Error("Fallback to relative path");
      } catch (e) {
        metadataResponse = await fetch("model/metadata.json");
      }

      if (!metadataResponse.ok) {
        throw new Error(`Gagal membaca metadata.json (${metadataResponse.status})`);
      }
      const metadata = await metadataResponse.json();
      this.labels = metadata.labels || [];

      // 3. Load TensorFlow.js LayersModel with fallback
      const modelUrl = "/model/model.json";
      this.model = await tf.loadLayersModel(modelUrl, {
        onProgress: (fraction) => {
          const percentage = Math.round(fraction * 100);
          if (onProgressCallback && typeof onProgressCallback === "function") {
            onProgressCallback(percentage);
          }
        },
      }).catch(async () => {
        // Fallback to relative path if absolute root path fails on hosting environment
        return await tf.loadLayersModel("model/model.json", {
          onProgress: (fraction) => {
            const percentage = Math.round(fraction * 100);
            if (onProgressCallback && typeof onProgressCallback === "function") {
              onProgressCallback(percentage);
            }
          },
        });
      });

      return {
        model: this.model,
        labels: this.labels,
        backend: this.currentBackend,
      };
    } catch (error) {
      console.error("❌ DetectionService.loadModel error:", error);
      throw error;
    }
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error("Model belum dimuat");
    }

    if (!imageElement || imageElement.videoWidth === 0 || imageElement.videoHeight === 0) {
      return {
        label: "",
        confidence: 0,
        isValid: false,
      };
    }

    const startTime = performance.now();

    // Disciplinary memory management using tf.tidy()
    let result = null;
    tf.tidy(() => {
      // 1. Get raw pixels [height, width, 3]
      const imageTensor = tf.browser.fromPixels(imageElement);
      const h = imageTensor.shape[0];
      const w = imageTensor.shape[1];

      // 2. Teachable Machine Center Square Crop (prevents aspect ratio distortion)
      const minDim = Math.min(h, w);
      const startY = Math.floor((h - minDim) / 2);
      const startX = Math.floor((w - minDim) / 2);
      const croppedTensor = imageTensor.slice([startY, startX, 0], [minDim, minDim, 3]);

      // 3. Resize to 224 x 224
      const resizedTensor = tf.image.resizeBilinear(croppedTensor, [224, 224]);

      // 4. Teachable Machine MobileNet normalization [-1.0, 1.0]
      const normalizedTensor = resizedTensor.div(127.5).sub(1.0).expandDims(0);

      const prediction = this.model.predict(normalizedTensor);
      const probabilities = prediction.dataSync();

      let maxIdx = 0;
      let maxProb = 0;
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxIdx = i;
        }
      }

      const label = this.labels[maxIdx] || "Unknown";
      const confidence = Math.round(maxProb * 100);
      const threshold = APP_CONFIG.detectionConfidenceThreshold || 75;

      result = {
        label,
        confidence,
        isValid: confidence >= threshold,
        rawProbabilities: probabilities,
      };
    });

    const duration = performance.now() - startTime;
    this.performanceStats.operations += 1;
    this.performanceStats.totalTime += duration;
    this.performanceStats.averageTime = Math.round(
      this.performanceStats.totalTime / this.performanceStats.operations
    );

    return result;
  }
}

export default DetectionService;
