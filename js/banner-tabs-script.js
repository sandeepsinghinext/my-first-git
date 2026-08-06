(function() {
    // Configuration Options
    const bannerTabsConfig = {
        autoRotate: true,      // Enable/disable automatic rotation
        rotationSpeed: 5000,   // Time between rotations in milliseconds
        pauseOnHover: true,    // Pause rotation when hovering
        dragThreshold: 50,     // Minimum pixels to drag for tab change
        swipeThreshold: 30     // Minimum pixels to swipe on touch devices
    };
    
    // Internal variables
    let bannerRotationInterval;
    let currentTabIndex = 0;
    let isHovering = false;
    let isDragging = false;
    let startPosX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
    let dragStartTime = 0;
    
    // Initialize banner tabs
    function initBannerTabs() {
        const bannerTabButtons = document.querySelectorAll('.banner-tab-button');
        const bannerTabSlider = document.querySelector('.banner-tab-slider');
        const bannerContentContainer = document.querySelector('.banner-tabs-content-container');
        const bannerContentWrapper = document.querySelector('.banner-tabs-content-wrapper');
        const prevArrow = document.querySelector('.banner-nav-prev');
        const nextArrow = document.querySelector('.banner-nav-next');
        const tabCount = bannerTabButtons.length;
        
        // Set initial slider position
        if (bannerTabSlider) {
            bannerTabSlider.style.width = `${100 / tabCount}%`;
        }
        
        // Add click handlers to each tab
        bannerTabButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                switchToTab(index);
                resetRotationTimer();
            });
            
            // Add hover events if pauseOnHover is enabled
            if (bannerTabsConfig.pauseOnHover) {
                button.addEventListener('mouseenter', () => {
                    isHovering = true;
                    if (bannerTabsConfig.autoRotate) {
                        clearInterval(bannerRotationInterval);
                    }
                });
                
                button.addEventListener('mouseleave', () => {
                    isHovering = false;
                    if (bannerTabsConfig.autoRotate && !isHovering) {
                        resetRotationTimer();
                    }
                });
            }
        });
        
        // Add arrow navigation
        prevArrow.addEventListener('click', () => {
            const prevTab = currentTabIndex > 0 ? currentTabIndex - 1 : tabCount - 1;
            switchToTab(prevTab);
            resetRotationTimer();
        });
        
        nextArrow.addEventListener('click', () => {
            const nextTab = currentTabIndex < tabCount - 1 ? currentTabIndex + 1 : 0;
            switchToTab(nextTab);
            resetRotationTimer();
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                const prevTab = currentTabIndex > 0 ? currentTabIndex - 1 : tabCount - 1;
                switchToTab(prevTab);
                resetRotationTimer();
            } else if (e.key === 'ArrowRight') {
                const nextTab = currentTabIndex < tabCount - 1 ? currentTabIndex + 1 : 0;
                switchToTab(nextTab);
                resetRotationTimer();
            }
        });
        
        // Mouse and touch events for dragging
        bannerContentWrapper.addEventListener('mousedown', handleDragStart);
        bannerContentWrapper.addEventListener('touchstart', handleDragStart, { passive: false });
        
        // Function to switch to a specific tab
        function switchToTab(index) {
            currentTabIndex = index;
            const tabWidthPercentage = 100 / tabCount;
            
            // Update active tab
            bannerTabButtons.forEach(btn => btn.classList.remove('active', 'banner-tab-active'));
            bannerTabButtons[index].classList.add('active', 'banner-tab-active');
            
            // Move slider
            if (bannerTabSlider) {
                bannerTabSlider.style.left = `${index * tabWidthPercentage}%`;
            }
            
            // Calculate and set new position
            const newPosition = -index * bannerContentWrapper.offsetWidth;
            prevTranslate = newPosition;
            setSliderPosition(newPosition);
        }
        
        // Drag functions
        function handleDragStart(e) {
            // Ignore if clicking on a link or button
            if (e.target.closest('a, button, [onclick]')) {
                return;
            }
            
            // Set initial position
            if (e.type === 'touchstart') {
                startPosX = e.touches[0].clientX;
                e.preventDefault(); // Prevent scroll
            } else {
                startPosX = e.clientX;
            }
            
            // Record start time
            dragStartTime = Date.now();
            
            // Set up drag
            isDragging = true;
            currentTranslate = prevTranslate;
            bannerContentContainer.classList.add('dragging');
            
            // Add move and end events
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchend', handleDragEnd);
        }
        
        function handleDragMove(e) {
            if (!isDragging) return;
            
            let currentPosX;
            if (e.type === 'touchmove') {
                currentPosX = e.touches[0].clientX;
                e.preventDefault(); // Prevent scroll
            } else {
                currentPosX = e.clientX;
            }
            
            const diffX = currentPosX - startPosX;
            currentTranslate = prevTranslate + diffX;
            
            // Limit dragging to prevent overscrolling
            const maxTranslate = 0;
            const minTranslate = -(bannerContentWrapper.offsetWidth * (tabCount - 1));
            currentTranslate = Math.min(Math.max(currentTranslate, minTranslate), maxTranslate);
            
            // Update position
            setSliderPosition(currentTranslate);
        }
        
        function handleDragEnd() {
            if (!isDragging) return;
            
            // Clean up events
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchend', handleDragEnd);
            
            isDragging = false;
            bannerContentContainer.classList.remove('dragging');
            
            // Calculate drag distance and duration
            const dragDuration = Date.now() - dragStartTime;
            const diffX = currentTranslate - prevTranslate;
            const absDiffX = Math.abs(diffX);
            
            // Determine if drag was significant enough to change tab
            const threshold = window.innerWidth < 768 ? bannerTabsConfig.swipeThreshold : bannerTabsConfig.dragThreshold;
            const isQuickSwipe = dragDuration < 300 && absDiffX > 30;
            
            if (absDiffX > threshold || isQuickSwipe) {
                if (diffX > 0 && currentTabIndex > 0) {
                    // Swipe right to go previous
                    switchToTab(currentTabIndex - 1);
                } else if (diffX < 0 && currentTabIndex < tabCount - 1) {
                    // Swipe left to go next
                    switchToTab(currentTabIndex + 1);
                } else {
                    // Return to current position
                    setSliderPosition(prevTranslate);
                }
            } else {
                // Return to current position
                setSliderPosition(prevTranslate);
            }
            
            if (bannerTabsConfig.autoRotate && !isHovering) {
                resetRotationTimer();
            }
        }
        
        function setSliderPosition(position) {
            bannerContentContainer.style.transform = `translateX(${position}px)`;
        }
        
        // Function to reset the rotation timer
        function resetRotationTimer() {
            if (bannerRotationInterval) {
                clearInterval(bannerRotationInterval);
            }
            
            if (bannerTabsConfig.autoRotate && !isHovering) {
                bannerRotationInterval = setInterval(() => {
                    currentTabIndex = (currentTabIndex + 1) % bannerTabButtons.length;
                    switchToTab(currentTabIndex);
                }, bannerTabsConfig.rotationSpeed);
            }
        }
        
        // Initialize auto-rotation if enabled
        if (bannerTabsConfig.autoRotate) {
            resetRotationTimer();
        }
        
        // Expose control functions to global scope
        window.bannerTabs = {
            switchToTab,
            startRotation: () => {
                bannerTabsConfig.autoRotate = true;
                resetRotationTimer();
            },
            stopRotation: () => {
                bannerTabsConfig.autoRotate = false;
                clearInterval(bannerRotationInterval);
            },
            setRotationSpeed: (speed) => {
                bannerTabsConfig.rotationSpeed = speed;
                if (bannerTabsConfig.autoRotate) {
                    resetRotationTimer();
                }
            }
        };
    }
    
    // Initialize when DOM is ready
    if (document.readyState !== 'loading') {
        initBannerTabs();
    } else {
        document.addEventListener('DOMContentLoaded', initBannerTabs);
    }
})();