class PlayerService {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.audio = null;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 0.5;
    this.lastVolume = 0.5; // Lưu volume trước khi mute
    this.templateService = null;

    // Playlist management
    this.playlist = []; // Danh sách tracks
    this.currentTrackIndex = -1; // Index của track hiện tại
    this.repeatMode = "none"; // 'none', 'one', 'all'
    this.shuffleMode = false; // Bật/tắt shuffle
    this.originalPlaylist = []; // Lưu playlist gốc khi shuffle

    this.init();
  }

  init() {
    this.audio = new Audio();
    this.audio.volume = this.volume;

    // Audio event listeners
    this.audio.addEventListener("loadedmetadata", () => {
      this.duration = this.audio.duration;
      this.updateProgressBar();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.currentTime = this.audio.currentTime;
      this.updateProgressBar();
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      this.updatePlayButton();

      // Auto-advance to next track
      this.handleTrackEnd();
    });
  }

  // Xử lý khi track kết thúc
  handleTrackEnd() {
    if (this.repeatMode === "one") {
      // Lặp 1 bài
      this.playTrack(this.currentTrack);
      return;
    }

    if (
      this.repeatMode === "all" ||
      this.currentTrackIndex < this.playlist.length - 1
    ) {
      // Lặp toàn bộ hoặc còn bài tiếp theo
      this.nextTrack();
    } else {
      // Hết playlist, dừng phát
      console.log("Playlist ended");
      this.currentTrack = null;
      this.currentTrackIndex = -1;
      this.updateFooterPlayer();
    }
  }

  setTemplateService(templateService) {
    this.templateService = templateService;
  }

  // Render footer mặc định khi khởi tạo
  renderDefaultFooter() {
    if (!this.templateService) return;

    try {
      const defaultTrack = {
        image_url: "placeholder.svg?height=56&width=56",
        title: "Chưa có bài hát nào",
        artist_name: "Chọn bài hát để phát",
        duration: 0,
      };

      const footerHtml = this.templateService.render("footer", {
        currentTrack: defaultTrack,
      });

      const footer = document.querySelector(".player");
      if (footer) {
        footer.innerHTML = footerHtml;

        // Cập nhật volume icon và handle với vị trí đúng
        this.updateVolumeIcon();
        this.updateVolumeVisuals();
      }
    } catch (error) {
      console.error("Error rendering default footer:", error);
    }
  }

  // Phát bài hát mới
  playTrack(track) {
    this.currentTrack = track;
    // Cập nhật currentTrackIndex nếu track có trong playlist
    if (this.playlist.length > 0) {
      const trackIndex = this.playlist.findIndex((t) => t.id === track.id);
      if (trackIndex !== -1) {
        this.currentTrackIndex = trackIndex;
      } else {
        console.warn(`Track ${track.title} not found in playlist`);
      }
    } else {
      console.warn("No playlist available");
    }

    // Highlight track đang phát
    this.highlightCurrentTrack(track.id);

    // Cập nhật footer player
    this.updateFooterPlayer();

    // Phát nhạc
    if (this.audio.src !== track.audio_url) {
      this.audio.src = track.audio_url || track.image_url; // Fallback nếu không có audio_url
    }

    this.audio.play();
    this.isPlaying = true;
    this.updatePlayButton();
  }

  // Highlight track đang phát
  highlightCurrentTrack(trackId) {
    // Remove highlight từ tất cả tracks
    const allTracks = document.querySelectorAll(".track-item");
    allTracks.forEach((track) => {
      track.classList.remove("playing", "active");
    });

    // Highlight track hiện tại
    const currentTrackElement = document.querySelector(
      `[data-track-id="${trackId}"]`
    );
    if (currentTrackElement) {
      currentTrackElement.classList.add("playing", "active");
    }
  }

  // Toggle play/pause
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Pause
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
  }

  // Play
  play() {
    this.audio.play();
    this.isPlaying = true;
    this.updatePlayButton();
  }

  // Cập nhật footer player
  updateFooterPlayer() {
    if (!this.templateService || !this.currentTrack) {
      console.error(
        "Cannot update footer: missing template service or current track"
      );
      return;
    }

    try {
      const footerHtml = this.templateService.render("footer", {
        currentTrack: this.currentTrack,
      });
      const footer = document.querySelector(".player");

      if (footer) {
        footer.innerHTML = footerHtml;

        // Bind events và cập nhật volume visuals
        this.bindFooterEvents();
        this.updateVolumeVisuals();
        this.updateVolumeIcon();

        // Khôi phục shuffle và repeat state
        this.restorePlayerState();
      } else {
        console.error("Footer element not found");
      }
    } catch (error) {
      console.error("Error updating footer player:", error);
    }
  }

  // Khôi phục player state (shuffle, repeat)
  restorePlayerState() {
    // Khôi phục shuffle state
    if (this.shuffleMode) {
      const shuffleBtn = document.querySelector(".shuffle-btn");
      if (shuffleBtn) {
        shuffleBtn.classList.add("active");
      }
    }

    // Khôi phục repeat state
    if (this.repeatMode !== "none") {
      const repeatBtn = document.querySelector(".repeat-btn");
      if (repeatBtn) {
        repeatBtn.classList.add("active");
        switch (this.repeatMode) {
          case "one":
            repeatBtn.innerHTML =
              '<i class="fas fa-redo-alt"></i><span class="repeat-indicator">1</span>';
            break;
          case "all":
            repeatBtn.innerHTML =
              '<i class="fas fa-redo"></i><span class="repeat-indicator">ALL</span>';
            break;
        }
      }
    }
  }

  // Next track
  nextTrack() {
    if (this.playlist.length === 0) return;

    if (this.repeatMode === "one") {
      // Lặp 1 bài
      this.playTrack(this.currentTrack);
      return;
    }

    // Chuyển sang bài tiếp theo
    this.currentTrackIndex =
      (this.currentTrackIndex + 1) % this.playlist.length;
    const nextTrack = this.playlist[this.currentTrackIndex];

    if (nextTrack) {
      this.playTrack(nextTrack);
    }
  }

  // Previous track
  prevTrack() {
    if (this.playlist.length === 0) return;

    if (this.repeatMode === "one") {
      // Lặp 1 bài
      this.playTrack(this.currentTrack);
      return;
    }

    // Chuyển sang bài trước
    this.currentTrackIndex =
      this.currentTrackIndex > 0
        ? this.currentTrackIndex - 1
        : this.playlist.length - 1;
    const prevTrack = this.playlist[this.currentTrackIndex];

    if (prevTrack) {
      this.playTrack(prevTrack);
    }
  }

  // Bind events cho footer controls
  bindFooterEvents() {
    // Play button
    const playBtn = document.querySelector(".play-btn");
    if (playBtn) {
      playBtn.addEventListener("click", () => this.togglePlay());
    } else {
      console.warn("❌ Play button not found");
    }

    // Next button
    const nextBtn = document.querySelector(".next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.nextTrack();
      });
    } else {
      console.warn("❌ Next button not found");
    }

    // Previous button
    const prevBtn = document.querySelector(".prev-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.prevTrack();
      });
    } else {
      console.warn("❌ Prev button not found");
    }

    // Repeat button
    const repeatBtn = document.querySelector(".repeat-btn");
    if (repeatBtn) {
      repeatBtn.addEventListener("click", () => {
        this.toggleRepeatMode();
      });
    } else {
      console.warn("❌ Repeat button not found");
    }

    // Shuffle button
    const shuffleBtn = document.querySelector(".shuffle-btn");
    if (shuffleBtn) {
      shuffleBtn.addEventListener("click", () => {
        this.toggleShuffleMode();
      });
    } else {
      console.warn("❌ Shuffle button not found");
    }

    // Volume button click để toggle mute
    const volumeBtn = document.querySelector(".volume-container .control-btn");
    if (volumeBtn) {
      volumeBtn.addEventListener("click", () => this.toggleMute());
    } else {
      console.warn("❌ Volume button not found");
    }

    // Volume bar click và drag
    const volumeBar = document.querySelector(".volume-bar");
    if (volumeBar) {
      // Click để set volume
      volumeBar.addEventListener("click", (e) => {
        const rect = volumeBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const clickPercent = clickX / width;
        this.setVolume(clickPercent);
      });

      // Drag để thay đổi volume
      this.setupVolumeDrag(volumeBar);
    } else {
      console.warn("Volume bar not found");
    }

    // Progress bar click
    const progressBar = document.querySelector(".progress-bar");
    if (progressBar) {
      progressBar.addEventListener("click", (e) => {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const clickPercent = clickX / width;
        this.seekTo(clickPercent);
      });
    } else {
      console.warn("Progress bar not found");
    }
  }

  // Setup volume drag functionality
  setupVolumeDrag(volumeBar) {
    let isDragging = false;

    const handleMouseDown = (e) => {
      isDragging = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const rect = volumeBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickPercent = Math.max(0, Math.min(1, clickX / width));

      this.setVolume(clickPercent);
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    // Mouse events
    volumeBar.addEventListener("mousedown", handleMouseDown);

    // Touch events cho mobile
    volumeBar.addEventListener("touchstart", (e) => {
      isDragging = true;
      const touch = e.touches[0];
      const rect = volumeBar.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const width = rect.width;
      const clickPercent = Math.max(0, Math.min(1, clickX / width));
      this.setVolume(clickPercent);
    });

    volumeBar.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const rect = volumeBar.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const width = rect.width;
      const clickPercent = Math.max(0, Math.min(1, clickX / width));
      this.setVolume(clickPercent);
    });

    volumeBar.addEventListener("touchend", () => {
      isDragging = false;
    });
  }

  // Toggle mute
  toggleMute() {
    if (this.volume > 0) {
      // Lưu volume hiện tại và mute
      this.lastVolume = this.volume;
      this.setVolume(0);
    } else {
      // Unmute và khôi phục volume trước đó
      const volumeToRestore = this.lastVolume || 0.5;
      this.setVolume(volumeToRestore);
    }
  }

  // Set volume
  setVolume(percent) {
    this.volume = Math.max(0, Math.min(1, percent));
    this.audio.volume = this.volume;

    // Update volume bar visual
    this.updateVolumeVisuals();

    // Update volume icon
    this.updateVolumeIcon();
  }

  // Cập nhật volume visuals (fill và handle)
  updateVolumeVisuals() {
    const volumeFill = document.querySelector(".volume-fill");
    const volumeHandle = document.querySelector(".volume-handle");

    if (volumeFill) {
      volumeFill.style.width = this.volume * 100 + "%";
    }

    if (volumeHandle) {
      // Di chuyển handle theo âm lượng (căn giữa handle)
      const handleWidth = 12; // Giả sử handle có width 12px
      // Cho phép handle di chuyển đến cuối thanh (100%)
      const left = Math.min(this.volume * 100, 100);
      volumeHandle.style.left = left + "%";
    }
  }

  // Update volume icon theo âm lượng
  updateVolumeIcon() {
    const volumeIcon = document.querySelector(
      ".volume-container .control-btn i"
    );
    if (volumeIcon) {
      if (this.volume === 0) {
        volumeIcon.className = "fas fa-volume-mute";
      } else if (this.volume < 0.3) {
        volumeIcon.className = "fas fa-volume-off";
      } else if (this.volume < 0.7) {
        volumeIcon.className = "fas fa-volume-down";
      } else {
        volumeIcon.className = "fas fa-volume-up";
      }
    }
  }

  // Seek to position
  seekTo(percent) {
    if (this.audio.duration) {
      this.audio.currentTime = this.audio.duration * percent;
    }
  }

  // Cập nhật progress bar
  updateProgressBar() {
    const progressFill = document.querySelector(".progress-fill");
    const progressHandle = document.querySelector(".progress-handle");
    const currentTimeEl = document.querySelector(".current-time");

    if (progressFill && this.duration > 0) {
      const percent = (this.currentTime / this.duration) * 100;
      progressFill.style.width = percent + "%";

      // Di chuyển progress handle theo thời gian (căn giữa handle)
      if (progressHandle) {
        const handleWidth = 12; // Giả sử handle có width 12px
        // Cho phép handle di chuyển đến cuối thanh (100%)
        const left = Math.min(percent, 100);
        progressHandle.style.left = left + "%";
      }
    }

    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(this.currentTime);
    }
  }

  // Cập nhật play button
  updatePlayButton() {
    const playBtn = document.querySelector(".play-btn i");
    if (playBtn) {
      playBtn.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
    }
  }

  // Format time
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  // Get current track info
  getCurrentTrack() {
    return this.currentTrack;
  }

  // Check if playing
  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  // Set playlist
  setPlaylist(tracks, startIndex = 0) {
    this.playlist = tracks;
    this.currentTrackIndex = startIndex;
  }

  // Toggle shuffle mode
  toggleShuffleMode() {
    const shuffleBtn = document.querySelector(".shuffle-btn");
    if (!shuffleBtn) return;

    this.shuffleMode = !this.shuffleMode;

    if (this.shuffleMode) {
      // Bật shuffle
      shuffleBtn.classList.add("active");
      this.originalPlaylist = [...this.playlist];
      this.shufflePlaylist();
      console.log("Shuffle mode enabled");
    } else {
      // Tắt shuffle
      shuffleBtn.classList.remove("active");
      this.playlist = [...this.originalPlaylist];
      // Khôi phục currentTrackIndex
      if (this.currentTrack) {
        const trackIndex = this.playlist.findIndex(
          (t) => t.id === this.currentTrack.id
        );
        if (trackIndex !== -1) {
          this.currentTrackIndex = trackIndex;
        }
      }
      console.log("Shuffle mode disabled");
    }
  }

  // Shuffle playlist
  shufflePlaylist() {
    if (this.playlist.length <= 1) return;

    const shuffled = [...this.playlist];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    this.playlist = shuffled;
    console.log("Playlist shuffled");
  }

  // Toggle repeat mode
  toggleRepeatMode() {
    const repeatBtn = document.querySelector(".repeat-btn");
    if (!repeatBtn) return;

    switch (this.repeatMode) {
      case "none":
        this.repeatMode = "one";
        repeatBtn.classList.add("active");
        repeatBtn.innerHTML =
          '<i class="fas fa-redo-alt"></i><span class="repeat-indicator">1</span>';
        console.log("Repeat mode: One");
        break;
      case "one":
        this.repeatMode = "all";
        repeatBtn.classList.add("active");
        repeatBtn.innerHTML =
          '<i class="fas fa-redo"></i><span class="repeat-indicator">ALL</span>';
        console.log("Repeat mode: All");
        break;
      case "all":
        this.repeatMode = "none";
        repeatBtn.classList.remove("active");
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        console.log("Repeat mode: None");
        break;
    }

    console.log(`Repeat mode changed to: ${this.repeatMode}`);
  }
}

export default PlayerService;
