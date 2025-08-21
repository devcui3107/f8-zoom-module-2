/**
 * 🎠 Lopza - Simple Slider Library
 * Slider đơn giản với trackpad gesture và navigation buttons
 */
class Lopza {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    this.options = {
      slidesPerView: options.slidesPerView || 4,
      spaceBetween: options.spaceBetween || 16,
      navigation: options.navigation !== false,
    };

    // State
    this.currentPosition = 0;
    this.maxScroll = 0;
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;

    // Methods
    this.init = this.init.bind(this);
    this.setupSlider = this.setupSlider.bind(this);
    this.setupNavigation = this.setupNavigation.bind(this);
    this.setupTrackpad = this.setupTrackpad.bind(this);
    this.updateMaxScroll = this.updateMaxScroll.bind(this);
    this.goToStart = this.goToStart.bind(this);
    this.goToEnd = this.goToEnd.bind(this);
    this.handleTrackpad = this.handleTrackpad.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.init();
  }

  init() {
    if (!this.container) {
      console.error("Lopza: Container not found");
      return;
    }

    this.setupSlider();
    this.setupNavigation();
    this.setupTrackpad();
    this.updateMaxScroll();
  }

  setupSlider() {
    // Wrap content in slider container
    this.container.classList.add("lopza-slider");

    // Create wrapper for slides
    this.wrapper = document.createElement("div");
    this.wrapper.className = "lopza-wrapper";

    // Move all direct children to wrapper
    while (this.container.firstChild) {
      this.wrapper.appendChild(this.container.firstChild);
    }

    this.container.appendChild(this.wrapper);

    // Get all slides
    this.slides = Array.from(this.wrapper.children);

    // Add slide classes
    this.slides.forEach((slide, index) => {
      slide.classList.add("lopza-slide");
      slide.setAttribute("data-slide-index", index);
    });
  }

  setupNavigation() {
    if (!this.options.navigation) return;

    // Create navigation buttons
    this.prevButton = document.createElement("button");
    this.nextButton = document.createElement("button");

    this.prevButton.className = "lopza-nav-btn lopza-prev";
    this.nextButton.className = "lopza-nav-btn lopza-next";

    this.prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    this.nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';

    // Add navigation to container
    this.container.appendChild(this.prevButton);
    this.container.appendChild(this.nextButton);

    // Bind events
    this.prevButton.addEventListener("click", this.goToStart);
    this.nextButton.addEventListener("click", this.goToEnd);

    // Update navigation state
    this.updateNavigation();
  }

  setupTrackpad() {
    // Trackpad gesture support
    this.container.addEventListener("wheel", this.handleTrackpad, {
      passive: false,
    });

    // Mouse events
    this.wrapper.addEventListener("mousedown", this.handleMouseDown);
    this.wrapper.addEventListener("mousemove", this.handleMouseMove);
    this.wrapper.addEventListener("mouseup", this.handleMouseUp);
    this.wrapper.addEventListener("mouseleave", this.handleMouseUp);

    // Touch events
    this.wrapper.addEventListener("touchstart", this.handleTouchStart);
    this.wrapper.addEventListener("touchmove", this.handleTouchMove);
    this.wrapper.addEventListener("touchend", this.handleTouchEnd);
  }

  updateMaxScroll() {
    const containerWidth = this.container.offsetWidth;
    const wrapperWidth = this.wrapper.scrollWidth;
    this.maxScroll = Math.max(0, wrapperWidth - containerWidth);
  }

  goToStart() {
    this.currentPosition = 0;
    this.wrapper.style.transform = `translateX(0px)`;
    this.updateNavigation();
  }

  goToEnd() {
    this.currentPosition = this.maxScroll;
    this.wrapper.style.transform = `translateX(-${this.maxScroll}px)`;
    this.updateNavigation();
  }

  // Handle trackpad wheel events for MacBook
  handleTrackpad(e) {
    // Chỉ ngăn cuộn ngang, không ngăn cuộn dọc
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault(); // Chỉ ngăn cuộn ngang
      
      // Horizontal scroll detection
      const scrollAmount = e.deltaX * 50; // Tốc độ x50 - nhanh hơn x25
      const newPosition = this.currentPosition + scrollAmount;

      // Giới hạn scroll trong khoảng cho phép
      this.currentPosition = Math.max(0, Math.min(this.maxScroll, newPosition));
      this.wrapper.style.transform = `translateX(-${this.currentPosition}px)`;

      this.updateNavigation();
    }
    // Nếu là cuộn dọc (deltaY > deltaX) thì không làm gì, để trang cuộn bình thường
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.startX = e.pageX - this.container.offsetLeft;
    this.scrollLeft = this.currentPosition;
    this.wrapper.style.cursor = "grabbing";
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    const x = e.pageX - this.container.offsetLeft;
    const walk = (x - this.startX) * 2;
    const newPosition = this.scrollLeft - walk;

    // Giới hạn scroll trong khoảng cho phép
    this.currentPosition = Math.max(0, Math.min(this.maxScroll, newPosition));
    this.wrapper.style.transform = `translateX(-${this.currentPosition}px)`;
  }

  handleMouseUp() {
    this.isDragging = false;
    this.wrapper.style.cursor = "grab";
    this.updateNavigation();
  }

  handleTouchStart(e) {
    this.isDragging = true;
    this.startX = e.touches[0].pageX - this.container.offsetLeft;
    this.scrollLeft = this.currentPosition;
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    const x = e.touches[0].pageX - this.container.offsetLeft;
    const walk = (x - this.startX) * 2;
    const newPosition = this.scrollLeft - walk;

    // Giới hạn scroll trong khoảng cho phép
    this.currentPosition = Math.max(0, Math.min(this.maxScroll, newPosition));
    this.wrapper.style.transform = `translateX(-${this.currentPosition}px)`;
  }

  handleTouchEnd() {
    this.isDragging = false;
    this.updateNavigation();
  }

  updateNavigation() {
    if (!this.options.navigation) return;

    // Disable buttons khi ở đầu/cuối
    this.prevButton.disabled = this.currentPosition === 0;
    this.nextButton.disabled = this.currentPosition >= this.maxScroll;

    this.prevButton.classList.toggle("disabled", this.prevButton.disabled);
    this.nextButton.classList.toggle("disabled", this.nextButton.disabled);
  }

  destroy() {
    // Remove event listeners
    this.container.removeEventListener("wheel", this.handleTrackpad);
    this.wrapper.removeEventListener("mousedown", this.handleMouseDown);
    this.wrapper.removeEventListener("mousemove", this.handleMouseMove);
    this.wrapper.removeEventListener("mouseup", this.handleMouseUp);
    this.wrapper.removeEventListener("mouseleave", this.handleMouseUp);
    this.wrapper.removeEventListener("touchstart", this.handleTouchStart);
    this.wrapper.removeEventListener("touchmove", this.handleTouchMove);
    this.wrapper.removeEventListener("touchend", this.handleTouchEnd);

    // Remove navigation
    if (this.prevButton) this.prevButton.remove();
    if (this.nextButton) this.nextButton.remove();

    // Restore original structure
    while (this.wrapper.firstChild) {
      this.container.appendChild(this.wrapper.firstChild);
    }
    this.wrapper.remove();

    this.container.classList.remove("lopza-slider");
  }

  // Public methods
  getCurrentPosition() {
    return this.currentPosition;
  }

  getMaxScroll() {
    return this.maxScroll;
  }

  refresh() {
    this.updateMaxScroll();
    this.updateNavigation();
  }
}

// Export for ES6 modules
export default Lopza;

// Also make it available globally
if (typeof window !== "undefined") {
  window.Lopza = Lopza;
}
