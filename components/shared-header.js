// Shared header loader
function loadHeader(pageType = 'home') {
    const headerContainer = document.getElementById('shared-header');
    if (!headerContainer) return;

    // Adjust path based on current location
    const basePath = window.location.pathname.includes('/order') ? '../' : '';
    const headerFile = pageType === 'order' ? `${basePath}components/header-order.html` : `${basePath}components/header.html`;
    
    fetch(headerFile)
        .then(response => response.text())
        .then(html => {
            headerContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading header:', error);
            // Fallback: create basic header
            headerContainer.innerHTML = `
                <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <a href="/" class="serif text-2xl font-bold tracking-tight text-slate-900">Bloom Anyway</a>
                        <div class="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
                            <a href="/" class="hover:text-slate-900 transition">Home</a>
                            <a href="/#content" class="hover:text-slate-900 transition">About</a>
                            <a href="/#author" class="hover:text-slate-900 transition">Author</a>
                            <a href="/#testimonials" class="hover:text-slate-900 transition">Testimonials</a>
                            <a href="/order" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition">Order</a>
                        </div>
                    </nav>
                </header>
            `;
        });
}

// Initialize header when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Determine page type from URL
    const isOrderPage = window.location.pathname.includes('/order') || window.location.pathname.includes('order.html');
    const pageType = isOrderPage ? 'order' : 'home';
    
    loadHeader(pageType);
});
