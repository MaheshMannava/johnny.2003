const carouselImages = document.querySelector('.carousel-images');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
let currentIndex = 0;

// Variables for touch events
let startX = 0;
let endX = 0;

// Button click events
prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

nextButton.addEventListener('click', () => {
    if (currentIndex < carouselImages.children.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

// Touch event listeners for swipe
carouselImages.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
});

carouselImages.addEventListener('touchmove', (e) => {
    endX = e.touches[0].clientX;
});

carouselImages.addEventListener('touchend', () => {
    const swipeThreshold = 50; // Minimum swipe distance
    if (startX - endX > swipeThreshold && currentIndex < carouselImages.children.length - 1) {
        currentIndex++;
    } else if (endX - startX > swipeThreshold && currentIndex > 0) {
        currentIndex--;
    }
    updateCarousel();
});

// Function to update carousel position
function updateCarousel() {
    const width = carouselImages.children[0].clientWidth;
    carouselImages.style.transform = `translateX(-${currentIndex * width}px)`;
}

// Update carousel position on window resize
window.addEventListener('resize', updateCarousel);
