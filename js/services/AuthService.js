/**
 * Service xử lý logic Authentication
 */
import httpRequest from "../api/httpRequest.js";

class AuthService {
  constructor() {
    this.isAuthenticated = false; // Trạng thái đăng nhập
    this.currentUser = null; // Thông tin người dùng
    this.httpClient = httpRequest; // Sử dụng HttpRequest;

    // Khôi phục trạng thái từ localStorage khi khởi tạo
    this.restoreAuthState();
  }

  // Authentication methods - Chỉ là placeholder cho bây giờ
  async signup(userData) {
    try {
      // Gọi API đăng ký
      const response = await this.httpClient.post("auth/register", userData);

      // Kiểm tra response đúng cách
      if (
        response &&
        (response.success ||
          response.message === "User registered successfully")
      ) {
        console.log("Đăng ký thành công!");

        // Lưu thông tin user và token nếu cần
        if (response.user) {
          this.currentUser = response.user;
          this.isAuthenticated = true; // Đã đăng nhập

          // Lưu thông tin user vào localStorage
          localStorage.setItem("current_user", JSON.stringify(response.user));
        }
        if (response.access_token) {
          // Lưu token vào localStorage
          localStorage.setItem("access_token", response.access_token);
          localStorage.setItem("refresh_token", response.refresh_token);
          localStorage.setItem("token_type", response.token_type);
        }

        return {
          success: true,
          message: "Đăng ký thành công!",
          user: response.user,
          autoLogin: true, // 🆕 Đánh dấu đã tự động đăng nhập
          tokens: {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            token_type: response.token_type,
          },
        };
      } else {
        console.log("Đăng ký thất bại:", response.message);
        return {
          success: false,
          message: response.message || "Đăng ký thất bại",
        };
      }
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message);

        // 1. Lỗi validation (có details array)
        if (errorData.data?.error?.details) {
          const errorDetails = errorData.data.error.details[0];
          return {
            success: false,
            field: errorDetails.field,
            message: errorDetails.message,
          };
        }

        // 2. Lỗi business logic (không có details, có error object trực tiếp)
        if (errorData.data?.error) {
          const businessError = errorData.data.error;

          // Xác định field dựa vào error code
          let field = "general";
          if (businessError.code === "EMAIL_EXISTS") {
            field = "email";
          } else if (businessError.code === "PASSWORD_INVALID") {
            field = "password";
          }

          return {
            success: false,
            field: field,
            message: businessError.message,
          };
        }

        // 3. Lỗi chung
        return {
          success: false,
          message: errorData.message || "Đăng ký thất bại",
        };
      } catch (parseError) {
        console.error("Không thể parse error message:", parseError);
        return { success: false, message: "Lỗi không xác định" };
      }
    }
  }

  // Method đăng nhập
  async login(credentials) {
    try {
      // Gọi API đăng nhập
      const response = await this.httpClient.post("auth/login", credentials);

      if (response && response.access_token) {
        // Đăng nhập thành công

        // Cập nhật trạng thái đăng nhập
        this.isAuthenticated = true;
        this.currentUser = response.user;

        // Lưu token vào localStorage
        localStorage.setItem("access_token", response.access_token);
        if (response.refresh_token) {
          localStorage.setItem("refresh_token", response.refresh_token);
        }
        if (response.token_type) {
          localStorage.setItem("token_type", response.token_type);
        }

        // Lưu thông tin user vào localStorage
        if (response.user) {
          localStorage.setItem("current_user", JSON.stringify(response.user));
        }

        return {
          success: true,
          message: "Đăng nhập thành công!",
          user: response.user,
        };
      } else {
        return {
          success: false,
          message: response.message || "Đăng nhập thất bại",
        };
      }
    } catch (error) {
      console.error(
        "Lỗi khi gọi API login:",
        error.message || "Lỗi kết nối server"
      );

      try {
        const errorData = JSON.parse(error.message);

        // Xử lý lỗi từ API
        if (errorData.data?.error) {
          const businessError = errorData.data.error;
          return {
            success: false,
            message: businessError.message || "Đăng nhập thất bại",
          };
        }

        return {
          success: false,
          message: errorData.message || "Đăng nhập thất bại",
        };
      } catch (parseError) {
        return { success: false, message: "Lỗi kết nối server" };
      }
    }
  }

  async logout() {
    try {
      // Lấy access token từ localStorage
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        console.warn("Không có access token, xóa dữ liệu local trực tiếp");
        this.clearAuthData();
        return { success: true, message: "Đăng xuất thành công!" };
      }

      // Gọi API logout với Bearer token (không cần body)
      const response = await this.httpClient.post(
        "auth/logout",
        {},
        {
          Authorization: `Bearer ${accessToken}`,
        }
      );

      // Xóa dữ liệu local sau khi API thành công
      this.clearAuthData();

      return { success: true, message: "Đăng xuất thành công!" };
    } catch (error) {
      try {
        const errorData = JSON.parse(error.message);

        // Xử lý lỗi từ API logout
        if (errorData.data?.error) {
          const businessError = errorData.data.error;
          return {
            success: false,
            message: businessError.message || "Đăng xuất thất bại",
          };
        }

        return {
          success: false,
          message: errorData.message || "Đăng xuất thất bại",
        };
      } catch (parseError) {
        // Nếu không parse được error, vẫn xóa dữ liệu local để đảm bảo security
        this.clearAuthData();
        return { success: false, message: "Lỗi kết nối server" };
      }
    }
  }

  // Helper methods
  // Method để kiểm tra trạng thái đăng nhập
  checkAuthStatus() {
    // Kiểm tra cả từ memory và localStorage
    if (!this.isAuthenticated) {
      this.restoreAuthState();
    }
    return this.isAuthenticated;
  }

  // Method để lấy thông tin user hiện tại
  getCurrentUser() {
    if (!this.currentUser) {
      this.restoreAuthState();
    }
    return this.currentUser;
  }

  // Thêm method xóa dữ liệu auth
  clearAuthData() {
    this.isAuthenticated = false;
    this.currentUser = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("current_user");
  }

  // Thêm method khôi phục trạng thái
  restoreAuthState() {
    try {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("current_user");

      if (token && userStr) {
        // Có token và user info → Khôi phục trạng thái đăng nhập
        this.isAuthenticated = true;
        this.currentUser = JSON.parse(userStr);
      } else {
        // console.log("Không có thông tin đăng nhập trong localStorage");
      }
    } catch (error) {
      console.error("Lỗi khi khôi phục trạng thái:", error);
      // Nếu có lỗi, xóa localStorage và reset trạng thái
      this.clearAuthData();
    }
  }
}

export default AuthService;
