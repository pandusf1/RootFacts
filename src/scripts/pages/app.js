import HomePage from "./home/home-page.js";

class App {
  constructor({ container }) {
    this._container = container;
  }

  async renderPage() {
    const page = new HomePage();
    this._container.innerHTML = await page.render();
    await page.afterRender();
  }
}

export default App;
