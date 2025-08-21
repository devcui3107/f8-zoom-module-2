class HttpRequest {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://spotify.f8team.dev/api/";
  }

  async _send(url, method = "GET", body = null, customHeaders = {}) {
    try {
      const options = {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...customHeaders, // Merge custom headers
        },
      };

      // Chỉ thêm body cho trường hợp POST PUT PATCH
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(this.baseUrl + url, options);

      if (response.ok) {
        // Success response (200-299)
        try {
          return await response.json();
        } catch (jsonError) {
          // Nếu response không phải JSON, trả về text
          const textResponse = await response.text();
          return { message: textResponse || "Success" };
        }
      } else {
        // Error response (400, 500, etc.)
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Nếu error response không phải JSON, lấy text
          const textResponse = await response.text();
          errorData = { message: textResponse || "Request failed" };
        }

        throw new Error(
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            message: errorData.message || "Request failed",
            data: errorData,
          })
        );
      }
    } catch (error) {
      console.log("HTTP Request Error:", error.message);
      // SỬA: Re-throw error để component có thể xử lý
      throw error;
    }
  }

  async get(url) {
    return await this._send(url);
  }

  async post(url, body, customHeaders = {}) {
    return await this._send(url, "POST", body, customHeaders);
  }

  async put(url, body) {
    return await this._send(url, "PUT", body);
  }

  async patch(url, body) {
    return await this._send(url, "PATCH", body);
  }

  async delete(url) {
    return await this._send(url, "DELETE");
  }
}

const httpRequest = new HttpRequest();

export default httpRequest;
