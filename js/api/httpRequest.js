class HttpRequest {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "https://spotify.f8team.dev/api/";
  }

  async _send(url, method = "GET", body = null) {
    try {
      const options = {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Chỉ thêm body cho trường hợp POST PUT PATCH
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(this.baseUrl + url, options);

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.log(error);
    }
  }

  async get(url) {
    return await this._send(url);
  }

  async post(url, body) {
    return await this._send(url, "POST", body);
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
