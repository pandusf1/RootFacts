import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
  generateCameraPermissionModal,
} from "../../templates.js";
import CameraService from "../../services/camera.service.js";
import DetectionService from "../../services/detection.service.js";
import RootFactsService from "../../services/rootfacts.service.js";
import HomePresenter from "./home-presenter.js";

export default class HomePage {
  constructor() {
    this._presenter = null;
  }

  async render() {
    return `
      ${generateCameraPermissionModal()}
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
  }

  async afterRender() {
    const cameraService = new CameraService();
    const detectionService = new DetectionService();
    const rootFactsService = new RootFactsService();

    this._presenter = new HomePresenter({
      view: this,
      cameraService,
      detectionService,
      rootFactsService,
    });

    await this._presenter.init();
  }
}
