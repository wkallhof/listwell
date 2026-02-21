import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Listwell",
    short_name: "Listwell",
    description:
      "Turn photos of items into ready-to-post marketplace listings with AI",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#279E89",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
