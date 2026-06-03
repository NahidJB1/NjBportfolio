# NJB Portfolio — Setup Instructions

## File Structure
```
NjB/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── animations.css
│   ├── js/
│   │   └── main.js
│   └── photo/
│       ├── njblogo.png   ← Place your logo here
│       └── photo.jpg     ← Place your photo here
```

## Steps to Use

1. **Add your photo**: Copy your personal photo to `assets/photo/photo.jpg`
2. **Add your logo**: Copy your NJB logo to `assets/photo/njblogo.png`
3. **Open** `index.html` in any browser — no build step needed!
4. **Deploy**: Upload the entire `NjB/` folder to any web host (Netlify, Vercel, cPanel, etc.)

## Features
- 🎨 Dark cyber-futuristic design with animated canvas background
- ✨ Custom cursor with follower (desktop)
- ⚡ Page loader with progress bar
- 🔤 Typewriter role animation in hero
- 📱 Fully responsive (mobile, tablet, desktop)
- 🧭 Sticky navigation with active state
- 🔢 Animated stat counters
- 🖱️ Smooth scroll reveal on all sections
- 🏷️ Glitch hover effect on hero name
- 🌐 All 6 projects linked with descriptions
- 📬 Contact section with WhatsApp & email links
- 🔗 Social links: Facebook, Instagram, GitHub

## Performance Notes
- No heavy frameworks — pure HTML/CSS/JS
- Google Fonts loaded async
- Canvas animation is lightweight (60 nodes)
- All images lazy-load naturally via browser
- Works on any connection speed
