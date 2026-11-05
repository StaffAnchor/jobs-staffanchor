import type { MetadataRoute } from "next";

// Lets the site be saved to a phone's home screen and opened like an app. It is the same site: same pages, same sign-in.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StaffAnchor Jobs",
    short_name: "StaffAnchor",
    description: "Live sales roles, free to apply. Track your applications and book interview prep.",
    id: "/",
    start_url: "/jobs?utm_source=app&utm_medium=home_screen",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A1630",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Current openings", url: "/jobs?utm_source=app&utm_medium=shortcut" },
      { name: "My applications", url: "/candidate-portal" },
      { name: "Interview prep", url: "/edge/book/mock-interview?src=app" },
    ],
  };
}
