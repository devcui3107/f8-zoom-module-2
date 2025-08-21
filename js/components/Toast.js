class Toast {
  constructor() {
    this.toastContainer = null;
    this.init();
  }

  init() {
    this.createToastContainer();
  }

  createToastContainer() {
    // Tạo container cho toast nếu chưa có
    if (!document.getElementById("toast-container")) {
      this.toastContainer = document.createElement("div");
      this.toastContainer.id = "toast-container";
      this.toastContainer.className = "toast-container";
      document.body.appendChild(this.toastContainer);
    } else {
      this.toastContainer = document.getElementById("toast-container");
    }
  }

  // Hiển thị toast
  show(message, type = "info", duration = 3000) {
    const toast = this.createToastElement(message, type);

    // Thêm toast vào container
    this.toastContainer.appendChild(toast);

    // Hiển thị toast với animation
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Tự động ẩn sau duration
    setTimeout(() => {
      this.hide(toast);
    }, duration);

    return toast;
  }

  // Tạo toast element
  createToastElement(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Icon theo type
    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    return toast;
  }

  // Lấy icon theo type
  getIcon(type) {
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
    };

    return icons[type] || icons.info;
  }

  // Ẩn toast
  hide(toast) {
    toast.classList.remove("show");
    toast.classList.add("hide");

    // Xóa toast sau khi animation hoàn tất
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }

  // Các method tiện ích
  success(message, duration) {
    return this.show(message, "success", duration);
  }

  error(message, duration) {
    return this.show(message, "error", duration);
  }

  warning(message, duration) {
    return this.show(message, "warning", duration);
  }

  info(message, duration) {
    return this.show(message, "info", duration);
  }
}

export default Toast;
