# Bloom Anyway - Book Website

A beautiful, modern website for the book "Bloom Anyway" by Chioma Omeniho.

## Features

- **Hero Section**: Stunning gradient background with author image
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Built with Tailwind CSS and smooth animations
- **Content Sections**: 
  - Book description
  - Why the book was written
  - About the author
  - Support the mission
  - Reader testimonials
  - Purchase section with call-to-action

## Technologies Used

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript
- Font Awesome icons
- Google Fonts (Playfair Display & Inter)

## Getting Started

1. Open `index.html` in your web browser
2. The website is ready to view immediately

## Deployment

This website can be deployed to any static hosting service:

- **Netlify**: Drag and drop the folder
- **Vercel**: Import the project
- **GitHub Pages**: Push to a GitHub repository
- **Any static hosting service**

## Customization

### Images
- Update the hero image path in the HTML: `Images/Bloom Anyway Chioma Omeniho.jpg`
- Add more images to the `Images/` folder as needed

### Colors
The main gradient colors are defined in the CSS:
```css
.hero-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Content
All text content is directly editable in the HTML file. Simply open `index.html` and modify the text as needed.

### Contact Information
Update the email address in two places:
1. In the purchase section: `authorchiomaomeniho@gmail.com`
2. In the footer: `authorchiomaomeniho@gmail.com`

## Purchase Integration

Currently, the purchase button shows an alert. To integrate with actual payment systems:

1. Replace the `handlePurchase()` function with your payment provider's code
2. Add links to Amazon, Barnes & Noble, or other retailers
3. Integrate with payment processors like Stripe or PayPal

## Social Media

Add social media links in the footer by replacing the placeholder comment:
```html
<a href="YOUR_SOCIAL_LINK" class="text-gray-400 hover:text-white transition">
    <i class="fab fa-YOUR_PLATFORM text-xl"></i>
</a>
```

## Browser Support

This website supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
