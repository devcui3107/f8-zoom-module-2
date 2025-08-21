import httpRequest from "./httpRequest.js";
import TemplateService from "../services/TemplateService.js";
import PlayerService from "../services/PlayerService.js";
import Lopza from "../lib/lopza.js";

class RenderApi {
  constructor() {
    this.templateService = new TemplateService();
    this.playerService = new PlayerService();
    this.sliders = new Map();
    this.currentAlbumData = null; // Lưu thông tin album hiện tại

    // Set template service cho player
    this.playerService.setTemplateService(this.templateService);

    // Render footer mặc định sau khi template service sẵn sàng
    this.initDefaultFooter();
  }

  // Khởi tạo footer mặc định
  async initDefaultFooter() {
    // Đợi template service load xong
    let attempts = 0;
    const maxAttempts = 50;

    while (
      !this.templateService.isTemplateLoaded("footer") &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (this.templateService.isTemplateLoaded("footer")) {
      this.playerService.renderDefaultFooter();
    }
  }

  async _buildAllAlbumsTemplate() {
    try {
      const data = await httpRequest.get("albums");

      if (data && data.albums) {
        // Sử dụng template all-albums
        return this.templateService.render("all-albums", {
          albums: data.albums,
        });
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  }

  async _buildPopularAlbumTemplate() {
    try {
      const data = await httpRequest.get("albums/popular");

      if (data && data.albums) {
        this.artistsData = data.albums;

        // Sử dụng template popular-album
        return this.templateService.render("popular-album", {
          albums: data.albums,
        });
      } else {
        console.error("Invalid data structure:", data);
        return "";
      }
    } catch (error) {
      console.error("Error fetching popular albums:", error);
      return "";
    }
  }

  async _buildNewReleasesTemplate() {
    try {
      const data = await httpRequest.get("albums/new-releases");

      if (data && data.albums) {
        // Sử dụng template new-releases
        return this.templateService.render("new-releases", {
          albums: data.albums,
        });
      } else {
        console.error("Invalid new releases data structure:", data);
        return "";
      }
    } catch (error) {
      console.error("Error fetching new releases:", error);
      return "";
    }
  }

  // Method để render vào DOM
  async renderPopularAlbums(containerId = "contentWrapper") {
    try {
      // Đợi template load xong
      await this.waitForTemplates();

      const allAlbumsHtml = await this._buildAllAlbumsTemplate();
      const popularAlbumsHtml = await this._buildPopularAlbumTemplate();
      const newReleasesHtml = await this._buildNewReleasesTemplate();

      if (allAlbumsHtml && popularAlbumsHtml && newReleasesHtml) {
        const container = document.getElementById(containerId);
        if (container) {
          // Render cả 3 section theo thứ tự
          container.innerHTML =
            allAlbumsHtml + popularAlbumsHtml + newReleasesHtml;

          // Khởi tạo slider sau khi render
          this.initializeSliders();

          // Bind events sau khi render
          this.bindAlbumEvents();
        } else {
          console.error(`Container not found: ${containerId}`);
        }
      }
    } catch (error) {
      console.error("Error rendering sections:", error);
    }
  }

  // Khởi tạo sliders
  initializeSliders() {
    // Tìm tất cả content__grid containers
    const gridContainers = document.querySelectorAll(".content__grid");

    gridContainers.forEach((container, index) => {
      // Tạo unique ID cho slider
      const sliderId = `slider-${index}`;
      container.id = sliderId;

      // Khởi tạo Lopza slider với options đơn giản
      const slider = new Lopza(container, {
        slidesPerView: 4,
        spaceBetween: 16,
        navigation: true,
      });

      // Lưu slider instance
      this.sliders.set(sliderId, slider);
    });
  }

  // Đợi templates load xong
  async waitForTemplates() {
    let attempts = 0;
    const maxAttempts = 50; // 5 giây

    while (
      (!this.templateService.isTemplateLoaded("all-albums") ||
        !this.templateService.isTemplateLoaded("popular-album") ||
        !this.templateService.isTemplateLoaded("new-releases")) &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.templateService.isTemplateLoaded("all-albums")) {
      throw new Error("Template all-albums failed to load");
    }

    if (!this.templateService.isTemplateLoaded("popular-album")) {
      throw new Error("Template popular-album failed to load");
    }

    if (!this.templateService.isTemplateLoaded("new-releases")) {
      throw new Error("Template new-releases failed to load");
    }
  }

  // Bind events cho album cards
  bindAlbumEvents() {
    const albumCards = document.querySelectorAll(".content__card[data-id]");

    albumCards.forEach((card) => {
      card.addEventListener("click", async (e) => {
        const albumId = card.dataset.id;

        // Hiển thị loading state
        this.showLoadingState();

        try {
          // Fetch album detail và tracks
          const albumDetail = await this.fetchAlbumDetail(albumId);
          if (albumDetail) {
            // Render album detail
            await this.renderAlbumDetail(albumDetail);
          }
        } catch (error) {
          console.error("Error fetching album detail:", error);
          this.hideLoadingState();
        }
      });
    });
  }

  // Fetch album detail và tracks
  async fetchAlbumDetail(albumId) {
    try {
      const data = await httpRequest.get(`albums/${albumId}/tracks`);

      if (data && data.album && data.tracks) {
        return data;
      } else {
        console.error("Invalid album detail data structure:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching album detail:", error);
      return null;
    }
  }

  // Render album detail
  async renderAlbumDetail(albumData) {
    try {
      // Đợi template load xong
      await this.waitForAlbumDetailTemplate();

      // Lưu current album data
      this.currentAlbumData = albumData;

      // Set playlist cho player service
      this.playerService.setPlaylist(albumData.tracks);

      const html = this.templateService.render("album-detail", {
        album: albumData.album,
        tracks: albumData.tracks,
        total: albumData.total,
      });

      if (html) {
        const container = document.getElementById("contentWrapper");
        if (container) {
          container.innerHTML = html;
          // Bind events cho album detail
          this.bindAlbumDetailEvents();

          // Ẩn loading state
          this.hideLoadingState();
        }
      }
    } catch (error) {
      console.error("Error rendering album detail:", error);
      this.hideLoadingState();
    }
  }

  // Đợi album detail template load xong
  async waitForAlbumDetailTemplate() {
    let attempts = 0;
    const maxAttempts = 50; // 5 giây

    while (
      !this.templateService.isTemplateLoaded("album-detail") &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.templateService.isTemplateLoaded("album-detail")) {
      throw new Error("Template album-detail failed to load");
    }
  }

  // Bind events cho album detail
  bindAlbumDetailEvents() {
    // Back button để quay về albums
    const backButton = document.querySelector(".album-detail__back");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.renderPopularAlbums(); // Quay về trang albums
      });
    }

    // Play button lớn để phát bài hát đầu tiên
    const playBtnLarge = document.querySelector(".play-btn-large");
    if (playBtnLarge) {
      playBtnLarge.addEventListener("click", () => {
        console.log("Play button large clicked - playing first track");
        this.playFirstTrack();
      });
    }

    // Track click events
    const trackItems = document.querySelectorAll(".track-item");
    trackItems.forEach((track) => {
      track.addEventListener("click", (e) => {
        const trackId = track.dataset.trackId;

        // TODO: Xử lý khi click vào track (play music, etc.)
        this.handleTrackClick(trackId);
      });
    });
  }

  // Phát bài hát đầu tiên trong album
  playFirstTrack() {
    if (
      this.currentAlbumData &&
      this.currentAlbumData.tracks &&
      this.currentAlbumData.tracks.length > 0
    ) {
      const firstTrack = this.currentAlbumData.tracks[0];

      // Phát bài hát đầu tiên
      this.playerService.playTrack(firstTrack);
    } else {
      console.warn("No tracks available to play");
    }
  }

  // Xử lý click vào track
  handleTrackClick(trackId) {
    // Tìm track data từ current album
    if (this.currentAlbumData && this.currentAlbumData.tracks) {
      const track = this.currentAlbumData.tracks.find((t) => t.id === trackId);
      if (track) {
        this.playerService.playTrack(track);
      } else {
        console.error("Track not found with ID:", trackId);
      }
    } else {
      console.error("No current album data or tracks available");
    }
  }

  // Hiển thị loading state
  showLoadingState() {
    const container = document.getElementById("contentWrapper");
    if (container) {
      container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Đang tải thông tin album...</p>
        </div>
      `;
    }
  }

  // Ẩn loading state
  hideLoadingState() {
    // Loading state sẽ được thay thế khi render xong
  }

  // Method để destroy sliders
  destroySliders() {
    this.sliders.forEach((slider, id) => {
      slider.destroy();
    });
    this.sliders.clear();
  }

  // Method để refresh sliders
  refreshSliders() {
    this.destroySliders();
    this.initializeSliders();
  }

  // Method để get slider instance
  getSlider(sliderId) {
    return this.sliders.get(sliderId);
  }

  // Method để get tất cả sliders
  getAllSliders() {
    return Array.from(this.sliders.values());
  }
}

export default RenderApi;
