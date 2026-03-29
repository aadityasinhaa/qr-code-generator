# Modern QR Code Generator

A sleek, premium, and fully responsive QR Code Generator web application built with a modern glassmorphism aesthetic. It runs entirely in your browser, enabling quick creation of QR Codes for both text/links and uploaded images.

![Glassmorphism QR Generator](https://via.placeholder.com/800x400?text=Modern+QR+Code+Generator)

## ✨ Features

- **Text & Link to QR**: Instantly convert any typing, URL, or plain text into a scannable QR Code.
- **Image to QR**: Upload images (PNG, JPG, SVG). The app automatically downscales large images on the client-side to ensure the base64 output stays within the maximum QR character payload limits.
- **Privacy-First (No Server Needed)**: Everything is processed locally in your browser.
  - **Your data stays yours:** History and generated codes are stored locally in your browser's `localStorage` (up to the 5 most recent items).
  - No database or backend server means no one else can see your generated codes or uploaded files.
- **Modern UI & Dark Mode**: Beautiful glassmorphism UI with soft shadows, pill-shaped elements, and a seamless Light/Dark mode toggle.
- **Export & Share**:
  - Customize the generated QR size (128x128, 256x256, 512x512).
  - One-click **Download as PNG**.
  - One-click **Copy text payload** to clipboard.

## 🚀 Getting Started

This application is built with vanilla web technologies, requiring no build tools, no Node.js dependency, and no backend.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/modern-qr-generator.git
   ```
2. **Open it locally:**
   Simply double-click the `index.html` file in your preferred web browser, or use a tool like VS Code's "Live Server" extension for hot-reloading.

## 🛠️ Built With

- **HTML5 & Vanilla CSS**: For structure, styling, and the glassmorphism theme logic using detailed CSS variables.
- **Vanilla JavaScript**: For logic, DOM manipulation, image downscaling, and history management.
- **[QRCode.js](https://github.com/davidshimjs/qrcodejs)**: Lightweight JavaScript library for generating Cross-browser QR codes.
- **[Lucide Icons](https://lucide.dev/)**: Beautiful and consistent open-source icon set.
- **Google Fonts**: Inter, Bebas Neue, and Oswald for a premium typographic experience.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
