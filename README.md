# Nahid Jahan Bhuiyan — Personal Portfolio

Welcome to the repository for my personal portfolio website. This project serves as a comprehensive showcase of my work as a Full-Stack Developer and UI/UX Designer, featuring my latest projects, technical skills, and professional journey.

## 🚀 Live Demo
You can view the live portfolio at: **[nahidjahanbhuiyan.com](https://nahidjahanbhuiyan.com/)**

## 🎨 Design Philosophy
This portfolio was recently redesigned from the ground up to embrace a **Premium Minimalist Editorial** aesthetic.
- **Typography:** Built entirely on the *Inter* typeface for maximum readability and a timeless, modern feel.
- **Color Palette:** A warm, dark-mode design (`#111111` background) accented by a sophisticated copper/amber (`#c8956c`) to reduce eye strain and highlight key information.
- **User Experience:** Focuses on smooth, subtle micro-animations (like soft hover lifts and scroll reveals) rather than overwhelming visual noise. The goal is to let the work speak for itself.

## 📁 Project Structure
The repository is organized to keep the codebase clean, modular, and easy to maintain.

```text
NjBportfolio/
├── index.html              # The main landing page (Hero, About, Projects, Skills, Contact)
├── assets/                 # Core assets directory
│   ├── css/                # Stylesheets (style.css, animations.css, project-specific CSS)
│   ├── js/                 # Global Javascript (main.js) for interactions and components
│   ├── photo/              # All high-res images and project screenshots
│   ├── header.html         # Modular navigation header injected globally
│   └── footer.html         # Modular footer injected globally
└── projects/               # Individual deep-dive case study pages
    ├── factshield.html
    ├── medelife.html
    ├── kerja-kad.html
    └── ...
```

## 🛠️ Technical Stack
- **HTML5:** Semantic and accessible markup.
- **Vanilla CSS3:** Custom design system without reliance on heavy frameworks. Includes CSS variables for global theming, Flexbox/Grid for responsive layouts, and keyframe animations.
- **Vanilla JavaScript (ES6):** Lightweight DOM manipulation, Intersection Observers for scroll animations, custom Lightbox implementation, and modular component injection.

## 💡 Key Features
- **Dynamic Component Injection:** The navigation header and footer are written once and injected into every page via JavaScript, ensuring DRY (Don't Repeat Yourself) principles.
- **Smart Image Lightbox:** A custom-built, lightweight image viewer that automatically attaches to gallery images without cluttering the HTML with excessive data attributes.
- **Rich Case Studies:** Detailed project pages (like FactShield and MEDeLIFE) that break down system architecture, UX psychology, and technical milestones.
- **Fully Responsive:** Beautifully scaled across desktop, tablet, and mobile devices.

## 📄 License
This project and its assets are proprietary. &copy; 2026 Nahid Jahan Bhuiyan. All rights reserved.
