import { formatNumberUser } from "../utils/helpers.js";

class TemplateService {
  constructor() {
    this.templates = {};
    this.init();
  }

  async init() {
    // Load tất cả templates
    await this.loadTemplates();
  }

  async loadTemplates() {
    try {
      // Load all albums template
      const allAlbumsResponse = await fetch(
        "./templates/content-all-albums.html"
      );
      if (allAlbumsResponse.ok) {
        this.templates["all-albums"] = await allAlbumsResponse.text();
      } else {
        console.error("Failed to load all-albums template");
      }

      // Load popular albums template
      const popularAlbumResponse = await fetch(
        "./templates/content-popular-album.html"
      );
      if (popularAlbumResponse.ok) {
        this.templates["popular-album"] = await popularAlbumResponse.text();
      } else {
        console.error("Failed to load popular-album template");
      }

      // Load new releases template
      const newReleasesResponse = await fetch(
        "./templates/content-new-releases.html"
      );
      if (newReleasesResponse.ok) {
        this.templates["new-releases"] = await newReleasesResponse.text();
      } else {
        console.error("Failed to load new-releases template");
      }

      // Load album detail template
      const albumDetailResponse = await fetch(
        "./templates/content-album-detail.html"
      );
      if (albumDetailResponse.ok) {
        this.templates["album-detail"] = await albumDetailResponse.text();
      } else {
        console.error("Failed to load album-detail template");
      }

      // Load footer template
      const footerResponse = await fetch("./templates/footer.html");
      if (footerResponse.ok) {
        this.templates["footer"] = await footerResponse.text();
      } else {
        console.error("Failed to load footer template");
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }

  // Render template với data
  render(templateName, data) {
    const template = this.templates[templateName];
    if (!template) {
      console.error(`Template ${templateName} not found`);
      return "";
    }

    try {
      let html = template;

      // Helper functions cho template
      const helpers = {
        add: (a, b) => a + b,
        formatDuration: (seconds) => {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
        },
        formatNumberUser: (number) => formatNumberUser(number),
      };

      // Process helper functions trước
      html = this.processHelperFunctions(html, data, helpers);

      // Replace placeholders
      html = this.replacePlaceholders(html, data);

      // Process each loops
      html = this.processEachLoops(html, data, helpers);

      return html;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      return "";
    }
  }

  // Xử lý helper functions ở mọi nơi
  processHelperFunctions(html, data, helpers) {
    return html.replace(/\{\{([^}]+)\}\}/g, (placeholderMatch, key) => {
      const keyParts = key.trim().split(" ");
      const firstPart = keyParts[0];

      // Check if it's a helper function
      if (helpers[firstPart]) {
        if (firstPart === "add") {
          // Handle {{add @index 1}} - chỉ xử lý trong loops
          return placeholderMatch; // Để processEachLoops xử lý
        } else if (firstPart === "formatDuration") {
          // Handle {{formatDuration currentTrack.duration}}
          const propertyPath = keyParts[1]; // currentTrack.duration
          const keys = propertyPath.split(".");
          let value = data;

          for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
              value = value[k];
            } else {
              return placeholderMatch; // Return original if not found
            }
          }

          if (value !== undefined) {
            return helpers.formatDuration(value);
          }
        } else if (firstPart === "formatNumberUser") {
          // Handle {{formatNumberUser play_count}}
          const propertyPath = keyParts[1]; // play_count
          const keys = propertyPath.split(".");
          let value = data;

          for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
              value = value[k];
            } else {
              return placeholderMatch; // Return original if not found
            }
          }

          if (value !== undefined) {
            return helpers.formatNumberUser(value);
          }
        }
      }

      return placeholderMatch; // Return original if not a helper function
    });
  }

  // Xử lý {{#each}} loops
  processEachLoops(html, data, helpers) {
    return html.replace(
      /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayKey, loopContent) => {
        const array = data[arrayKey];

        if (!Array.isArray(array)) {
          console.warn(`Data for ${arrayKey} is not an array:`, array);
          return "";
        }

        return array
          .map((item, index) => {
            let itemHtml = loopContent;

            // Replace item properties
            itemHtml = itemHtml.replace(
              /\{\{([^}]+)\}\}/g,
              (placeholderMatch, key) => {
                const keyParts = key.trim().split(" ");
                const firstPart = keyParts[0];

                // Check if it's a helper function
                if (helpers[firstPart]) {
                  if (firstPart === "add") {
                    // Handle {{add @index 1}}
                    const arg1 =
                      keyParts[1] === "@index" ? index : item[keyParts[1]];
                    const arg2 = parseInt(keyParts[2]);
                    return helpers.add(arg1, arg2);
                  } else if (firstPart === "formatDuration") {
                    // Handle {{formatDuration duration}}
                    const arg1 = item[keyParts[1]];
                    return helpers.formatDuration(arg1);
                  } else if (firstPart === "formatNumberUser") {
                    // Handle {{formatNumberUser play_count}}
                    const arg1 = item[keyParts[1]];
                    return helpers.formatNumberUser(arg1);
                  }
                }

                // Handle regular properties
                const keys = key.trim().split(".");
                let value = item;

                for (const k of keys) {
                  if (value && typeof value === "object" && k in value) {
                    value = value[k];
                  } else if (k === "@index") {
                    value = index;
                  } else {
                    return placeholderMatch; // Return original if not found
                  }
                }

                return value !== undefined ? value : placeholderMatch;
              }
            );

            return itemHtml;
          })
          .join("");
      }
    );
  }

  // Replace placeholders
  replacePlaceholders(html, data) {
    return html.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split(".");
      let value = data;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return match; // Return original if not found
        }
      }

      return value !== undefined ? value : match;
    });
  }

  // Kiểm tra template đã load chưa
  isTemplateLoaded(templateName) {
    return !!this.templates[templateName];
  }

  // Lấy danh sách templates đã load
  getLoadedTemplates() {
    return Object.keys(this.templates);
  }
}

export default TemplateService;
