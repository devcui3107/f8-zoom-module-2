import httpRequest from "./httpRequest.js";
import { formatNumberUser } from "../utils/helpers.js";

class RenderApi {
  constructor() {
    this.artistsData = [];
  }

  async _buildArtistsTemplate() {
    const data = await httpRequest.get("artists");

    if (data && data.artists) {
      this.artistsData = data.artists; // Lưu lại danh sách dữ liệu API

      const templateString = data.artists
        .map((artist) => {
          return `<div class="library-item" data-id="${artist.id}">
                    <img
                      src="${artist.image_url}"
                      alt="${artist.name}"
                      class="item-image"
                    />
                    <div class="item-info">
                      <div class="item-title">${artist.name}</div>
                      <div class="item-subtitle">Artist</div>
                    </div>
                  </div>`;
        })
        .join("");

      return templateString;
    }
  }

  async _buildArtistDetail(artistId) {
    const artist = this.artistsData.find((a) => a.id === artistId);
    if (!artist) return;

    return `<section class="artist-hero" data-id="${artist.id}">
              <div class="hero-background">
                <img
                  src="${artist.background_image_url}"
                  alt="${artist.name} artist background"
                  class="hero-image"
                />
                <div class="hero-overlay"></div>
              </div>
              <div class="hero-content">
                <div class="verified-badge">
                  <i class="fas fa-check-circle"></i>
                  <span>Verified Artist</span>
                </div>
                <h1 class="artist-name">${artist.name}</h1>
                <p class="monthly-listeners">${formatNumberUser(
                  artist.monthly_listeners
                )} monthly listeners</p>
              </div>
              </section>

              <!-- Artist Controls -->
              <section class="artist-controls">
              <button class="play-btn-large">
                <i class="fas fa-play"></i>
              </button>
              </section>
              <section class="popular-section">
              <h2 class="section-title">Popular</h2>
              <div class="track-list">
                <div class="track-item">
                  <div class="track-number">1</div>
                  <div class="track-image">
                    <img
                      src="placeholder.svg?height=40&width=40"
                      alt="Cho Tôi Lang Thang"
                    />
                  </div>
                  <div class="track-info">
                    <div class="track-name">Cho Tôi Lang Thang</div>
                  </div>
                  <div class="track-plays">27,498,341</div>
                  <div class="track-duration">4:18</div>
                  <button class="track-menu-btn">
                    <i class="fas fa-ellipsis-h"></i>
                  </button>
                </div>

                <div class="track-item playing">
                  <div class="track-number">
                    <i class="fas fa-volume-up playing-icon"></i>
                  </div>
                  <div class="track-image">
                    <img src="placeholder.svg?height=40&width=40" alt="Lối Nhỏ" />
                  </div>
                  <div class="track-info">
                    <div class="track-name playing-text">Lối Nhỏ</div>
                  </div>
                  <div class="track-plays">45,686,866</div>
                  <div class="track-duration">4:12</div>
                  <button class="track-menu-btn">
                    <i class="fas fa-ellipsis-h"></i>
                  </button>
                </div>

                <div class="track-item">
                  <div class="track-number">3</div>
                  <div class="track-image">
                    <img
                      src="placeholder.svg?height=40&width=40"
                      alt="Cho Minh Em"
                    />
                  </div>
                  <div class="track-info">
                    <div class="track-name">Cho Minh Em</div>
                  </div>
                  <div class="track-plays">20,039,024</div>
                  <div class="track-duration">3:26</div>
                  <button class="track-menu-btn">
                    <i class="fas fa-ellipsis-h"></i>
                  </button>
                </div>
              </div>
              </section>`;
  }

  // Render Sidebar Nghệ Sĩ
  renderArtists() {
    const artistsList = document.getElementById("artists");

    this._buildArtistsTemplate().then((result) => {
      artistsList.innerHTML = result;

      const artistItem = artistsList.querySelectorAll(".library-item");

      artistItem.forEach((item) => {
        item.addEventListener("click", (e) => {
          // Xoá toàn bộ Active
          artistItem.forEach((item) => item.classList.remove("active"));

          // Thêm Active vào phần tử được click
          item.classList.add("active");

          const artistId = e.target.dataset.id;
          this.renderArtistsDetail(artistId);
        });
      });

      artistItem[0].click();
    });
  }

  // Render Chi Tiết Nghệ Sĩ
  renderArtistsDetail(artistId) {
    const contentWrapper = document.getElementById("contentWrapper");

    this._buildArtistDetail(artistId).then((result) => {
      contentWrapper.innerHTML = result;
    });
  }
}

export default RenderApi;
