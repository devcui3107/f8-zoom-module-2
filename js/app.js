import AuthService from "./services/AuthService.js";
import AuthModal from "./components/AuthModal.js";
import Toast from "./components/toast.js";
import RenderApi from "./api/renderApi.js";

class App {
  constructor() {
    this.services = {}; // Chứa tất cả services
    this.components = {}; // Chứa tất cả components
    this.init(); // Khởi tạo ngay khi tạo App
  }

  init() {
    this.initServices();
    this.initComponents();
    this.initUtils();

    // Khôi phục UI dựa trên trạng thái đăng nhập
    this.restoreUIState();

    // Render content mặc định
    this.renderDefaultContent();
  }

  // Khởi tạo các services
  initServices() {
    this.services.authService = new AuthService();
    this.services.renderApi = new RenderApi();
  }

  // Khởi tạo các components
  initComponents() {
    this.components.authModal = new AuthModal(this.services.authService, this);
  }

  // Khởi tạo utilities
  initUtils() {
    this.toast = new Toast();
    // Làm cho toast có thể truy cập từ mọi nơi
    window.app = this;
  }

  // Render content mặc định
  async renderDefaultContent() {
    try {
      // Render popular albums vào contentWrapper
      await this.services.renderApi.renderPopularAlbums("contentWrapper");
    } catch (error) {
      console.error("Error rendering default content:", error);
      // Hiển thị loading hoặc error state
      this.showLoadingState();
    }
  }

  // Hiển thị loading state
  showLoadingState() {
    const contentWrapper = document.getElementById("contentWrapper");
    if (contentWrapper) {
      contentWrapper.innerHTML = `
        <div class="content__loading">
          <div class="loading-spinner"></div>
          <p>Đang tải nội dung...</p>
        </div>
      `;
    }
  }

  // ========================================
  // EVENT HANDLING (Đơn Giản)
  // ========================================

  // Xử lý khi user đăng nhập thành công
  onUserLogin(user) {
    // Cập nhật UI trực tiếp
    this.updateUIForLoggedInUser(user);

    // Cập nhật trạng thái global
    this.services.authService.isAuthenticated = true;
    this.services.authService.currentUser = user;
  }

  // Xử lý khi user đăng xuất thành công
  onUserLogout() {
    // Cập nhật UI trực tiếp
    this.updateUIForLoggedOutUser();

    // Cập nhật trạng thái global
    this.services.authService.isAuthenticated = false;
    this.services.authService.currentUser = null;
  }

  // ========================================
  // UI STATE MANAGEMENT (Đơn Giản)
  // ========================================

  // Khôi phục UI dựa trên trạng thái đăng nhập
  restoreUIState() {
    const authService = this.services.authService;

    if (authService.checkAuthStatus()) {
      // Cập nhật UI để hiển thị user đã đăng nhập
      this.updateUIForLoggedInUser(authService.getCurrentUser());
    } else {
      // Cập nhật UI để hiển thị trạng thái chưa đăng nhập
      this.updateUIForLoggedOutUser();
    }
  }

  // Cập nhật UI cho user đã đăng nhập
  updateUIForLoggedInUser(user) {
    const authButtons = document.querySelector(".auth-buttons");
    const userMenu = document.querySelector(".user-menu");

    if (authButtons) {
      authButtons.style.display = "none";
    }

    if (userMenu) {
      userMenu.style.display = "block";

      // Cập nhật thông tin user
      const userAvatar = userMenu.querySelector("#userAvatar img");
      if (userAvatar) {
        userAvatar.alt = user.email;
      }

      const userName = userMenu.querySelector(".user-name");
      if (userName) {
        userName.textContent = user.email;
      }
    }
  }

  // Cập nhật UI cho user chưa đăng nhập
  updateUIForLoggedOutUser() {
    const authButtons = document.querySelector(".auth-buttons");
    const userMenu = document.querySelector(".user-menu");

    if (authButtons) {
      authButtons.style.display = "block";
    }

    if (userMenu) {
      userMenu.style.display = "none";
    }
  }

  // ========================================
  // PUBLIC METHODS
  // ========================================

  // Method để components khác có thể truy cập
  getAuthService() {
    return this.services.authService;
  }

  getRenderApi() {
    return this.services.renderApi;
  }

  getToast() {
    return this.toast;
  }

  // Method để kiểm tra trạng thái đăng nhập
  isUserLoggedIn() {
    return this.services.authService.checkAuthStatus();
  }

  // Method để lấy thông tin user hiện tại
  getCurrentUser() {
    return this.services.authService.getCurrentUser();
  }

  // Method để render content
  async renderContent(contentType, containerId = "contentWrapper") {
    try {
      switch (contentType) {
        case "popularAlbums":
          await this.services.renderApi.renderPopularAlbums(containerId);
          break;
        default:
          console.warn(`Unknown content type: ${contentType}`);
      }
    } catch (error) {
      console.error(`Error rendering ${contentType}:`, error);
      this.showLoadingState();
    }
  }
}

export default App;
