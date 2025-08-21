import { showError, hideError } from "../utils/helpers.js";

class AuthModal {
  constructor(authService, app) {
    this.authService = authService;
    this.app = app; // Truyền App instance trực tiếp
    this.isOpen = false;
    this.currentForm = "signup"; // 'signup' hoặc 'login'
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
  }

  bindElements() {
    // Get DOM elements
    this.signupBtn = document.querySelector(".signup-btn");
    this.loginBtn = document.querySelector(".login-btn");
    this.authModal = document.getElementById("authModal");
    this.modalClose = document.getElementById("modalClose");
    this.signupForm = document.getElementById("signupForm");
    this.loginForm = document.getElementById("loginForm");
    this.showLoginBtn = document.getElementById("showLogin");
    this.showSignupBtn = document.getElementById("showSignup");
  }

  bindEvents() {
    // Open modal events
    this.signupBtn.addEventListener("click", () => {
      this.showSignupForm();
      this.openModal();
    });

    this.loginBtn.addEventListener("click", () => {
      this.showLoginForm();
      this.openModal();
    });

    // Close modal events
    this.modalClose.addEventListener("click", () => this.closeModal());

    this.authModal.addEventListener("click", (e) => {
      if (e.target === this.authModal) {
        this.closeModal();
      }
    });

    // Switch forms events
    this.showLoginBtn.addEventListener("click", () => this.showLoginForm());
    this.showSignupBtn.addEventListener("click", () => this.showSignupForm());

    // Keyboard events
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeModal();
      }
    });

    // Event Form Submit
    this.signupForm.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSignupSubmit();
    });

    this.loginForm.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLoginSubmit();
    });

    // Logout event
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // User dropdown events
    const userAvatar = document.getElementById("userAvatar");
    const userDropdown = document.getElementById("userDropdown");

    if (userAvatar && userDropdown) {
      // Toggle dropdown when clicking avatar
      userAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !userAvatar.contains(e.target) &&
          !userDropdown.contains(e.target)
        ) {
          userDropdown.classList.remove("show");
        }
      });

      // Close dropdown when pressing Escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && userDropdown.classList.contains("show")) {
          userDropdown.classList.remove("show");
        }
      });
    }
  }

  // ========================================
  // FORM HANDLING METHODS
  // ========================================

  // Xử lý Form Login Submit
  async handleLoginSubmit() {
    const { email, password, errorEmail, errorPassword } =
      this.getFormData("login");

    if (this.validateForm(email, password, errorEmail, errorPassword)) {
      await this.performLogin(email, password);
    }
  }

  // Xử lý Form Signup Submit
  async handleSignupSubmit() {
    const { email, password, errorEmail, errorPassword } =
      this.getFormData("signup");

    if (this.validateForm(email, password, errorEmail, errorPassword)) {
      await this.performSignup(email, password);
    }
  }

  // Lấy dữ liệu form
  getFormData(formType) {
    const form = formType === "login" ? this.loginForm : this.signupForm;
    const email = form.querySelector(`#${formType}Email`);
    const password = form.querySelector(`#${formType}Password`);
    const errorEmail = email.parentElement.querySelector(".error-message");
    const errorPassword =
      password.parentElement.querySelector(".error-message");

    return {
      email: email.value,
      password: password.value,
      errorEmail,
      errorPassword,
    };
  }

  // Validate form data
  validateForm(email, password, errorEmail, errorPassword) {
    let hasError = false;

    if (!email) {
      showError(errorEmail, "Please enter email");
      hasError = true;
    } else {
      hideError(errorEmail);
    }

    if (!password) {
      showError(errorPassword, "Please enter password");
      hasError = true;
    } else {
      hideError(errorPassword);
    }

    return !hasError;
  }

  // ========================================
  // AUTH OPERATIONS
  // ========================================

  // Thực hiện đăng nhập
  async performLogin(email, password) {
    try {
      const result = await this.authService.login({ email, password });

      if (result.success) {
        this.onLoginSuccess(result.user);
      } else {
        this.onLoginError(result.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      this.onLoginError("Có lỗi xảy ra khi đăng nhập!");
    }
  }

  // Thực hiện đăng ký
  async performSignup(email, password) {
    try {
      const result = await this.authService.signup({ email, password });

      if (result.success) {
        if (result.autoLogin) {
          this.onSignupSuccessWithAutoLogin(result.user);
        } else {
          this.onSignupSuccess();
        }
      } else {
        this.onSignupError(result);
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      this.onSignupError({ message: "Có lỗi xảy ra khi đăng ký!" });
    }
  }

  // Thực hiện đăng xuất
  async handleLogout() {
    try {
      const result = await this.authService.logout();

      if (result.success) {
        this.onLogoutSuccess();
      } else {
        this.onLogoutError(result.message);
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      this.onLogoutError("Có lỗi xảy ra khi đăng xuất!");
    }
  }

  // ========================================
  // SUCCESS/ERROR HANDLERS
  // ========================================

  onLoginSuccess(user) {
    this.showToast("success", "Đăng nhập thành công!");
    this.closeModal();
    // Gọi trực tiếp method của App
    this.app.onUserLogin(user);
  }

  onLoginError(message) {
    this.showToast("error", "Đăng nhập thất bại: " + message);
  }

  onSignupSuccess() {
    this.showToast("success", "Đăng ký thành công!");
    this.closeModal();
  }

  onSignupSuccessWithAutoLogin(user) {
    this.showToast("success", "Đăng ký thành công!");
    this.closeModal();
    // Gọi trực tiếp method của App
    this.app.onUserLogin(user);
  }

  onSignupError(result) {
    if (result.field === "password") {
      const errorPassword = this.signupForm
        .querySelector("#signupPassword")
        .parentElement.querySelector(".error-message");
      const errorEmail = this.signupForm
        .querySelector("#signupEmail")
        .parentElement.querySelector(".error-message");
      showError(errorPassword, result.message);
      hideError(errorEmail);
    } else if (result.field === "email") {
      const errorEmail = this.signupForm
        .querySelector("#signupEmail")
        .parentElement.querySelector(".error-message");
      const errorPassword = this.signupForm
        .querySelector("#signupPassword")
        .parentElement.querySelector(".error-message");
      showError(errorEmail, result.message);
      hideError(errorPassword);
    } else {
      this.showToast("error", "Đăng ký thất bại: " + result.message);
    }
  }

  onLogoutSuccess() {
    this.showToast("success", "Đăng xuất thành công!");
    // Gọi trực tiếp method của App
    this.app.onUserLogout();
  }

  onLogoutError(message) {
    this.showToast("error", "Đăng xuất thất bại: " + message);
  }

  // ========================================
  // FORM SWITCHING METHODS
  // ========================================

  showLoginForm() {
    this.currentForm = "login";
    this.loginForm.style.display = "block";
    this.signupForm.style.display = "none";
  }

  showSignupForm() {
    this.currentForm = "signup";
    this.signupForm.style.display = "block";
    this.loginForm.style.display = "none";
  }

  // ========================================
  // MODAL CONTROL METHODS
  // ========================================

  openModal() {
    this.isOpen = true;
    this.authModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.isOpen = false;
    this.authModal.classList.remove("show");
    document.body.style.overflow = "auto";
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Hiển thị toast thông báo
  showToast(type, message) {
    if (this.app && this.app.getToast) {
      const toast = this.app.getToast();
      if (type === "success") {
        toast.success(message);
      } else if (type === "error") {
        toast.error(message);
      }
    }
  }

  // Public methods để components khác có thể truy cập
  getCurrentForm() {
    return this.currentForm;
  }

  isModalOpen() {
    return this.isOpen;
  }
}

export default AuthModal;
