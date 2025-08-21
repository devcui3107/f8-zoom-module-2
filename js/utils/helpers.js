// Hàm định dạng số theo dấu phẩy vào hàng nghìn
export function formatNumberUser(number) {
  return Number(number).toLocaleString("en-US");
}

// Show Error:
export function showError(element, message) {
  element.style.display = "flex";
  const errorHtml = `
                <div class="error-message">
                  <i class="fas fa-info-circle"></i>
                  <span>${message}</span>
                </div>`;
  element.innerHTML = errorHtml;
}

// Hàm ẩn error message
export function hideError(errorElement) {
  errorElement.style.display = "none";
  errorElement.innerHTML = "";
}
