document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================================
    //   CORE DOM ELEMENTS & STATE (declared first so preload can access them)
    // =========================================================================
    const TOTAL_FRAMES = 240;
    const preloadedImages = [];
    let loadedCount = 0;
    let imagesPreloaded = false;

    // Hero canvas — MUST be declared before preloadFrames() is called
    const canvas = document.getElementById("hero-canvas");
    let ctx = null;
    if (canvas) ctx = canvas.getContext("2d");

    const loaderElement = document.getElementById("showroom-loader");
    const loaderFill    = document.querySelector(".hero-loader-fill");

    // Paint Color CSS Filters and Image Asset Mappings
    const colorFilters = {
        "dehradun-dew": {
            name: "Dehradun Dew",
            filter: "sepia(0.8) hue-rotate(82deg) saturate(0.85) brightness(1.12) contrast(0.92)"
        },
        "sobo-surge": {
            name: "Sobo Surge",
            filter: "sepia(0.85) hue-rotate(136deg) saturate(2.6) brightness(0.92) contrast(1.08)"
        },
        "pangong-pulse": {
            name: "Pangong Pulse",
            filter: "sepia(0.95) hue-rotate(182deg) saturate(2.4) brightness(0.68) contrast(1.15)"
        },
        "pure-grey": {
            name: "Pure Grey",
            filter: "brightness(0.95) contrast(1.02)"
        },
        "daytona-grey": {
            name: "Daytona Grey",
            filter: "brightness(0.75) contrast(1.1)"
        },
        "pristine-white": {
            name: "Pristine White",
            filter: "brightness(1.15) contrast(0.95)"
        }
    };

    const colorImages = {
        "dehradun-dew": "assets/Dehradun Dew with Dual Tone.png",
        "sobo-surge": "assets/Sobo Surge with Dual Tone.png",
        "pangong-pulse": "assets/Pangong Pulse with Dual Tone.png",
        "pure-grey": "assets/Grey.png",
        "daytona-grey": "assets/Daytona Grey with Dual Tone.png",
        "pristine-white": "assets/Pristine White with Dual Tone.png"
    };
    
    // Helper to pad numbers: 5 -> "005"
    function pad(num, size) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }


    // Preload all 240 frames once (shared by Hero canvas & Showroom 360 viewer)
    function preloadFrames() {
        function checkCompletion() {
            if (loadedCount === TOTAL_FRAMES) {
                imagesPreloaded = true;
                if (loaderElement) loaderElement.classList.add("fade-out");
                resizeCanvas();
                handleScrollAnimations();
            }
        }

        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            
            img.onload = () => {
                loadedCount++;

                // Update progress bar fill
                if (loaderFill) {
                    loaderFill.style.width = `${(loadedCount / TOTAL_FRAMES) * 100}%`;
                }

                // Draw first frame immediately as soon as it loads — canvas is ready
                if (i === 1 && canvas && ctx) {
                    resizeCanvas();
                    drawImageProp(ctx, img);
                    // Apply initial color filter based on active chip
                    const activeCard = document.querySelector(".showroom-color-card.active");
                    const initColorKey = activeCard ? activeCard.getAttribute("data-color") : "pure-grey";
                    const initConfig = colorFilters[initColorKey];
                    if (initConfig) {
                        let f = initConfig.filter;
                        if (initColorKey === "dehradun-dew") {
                            f = "sepia(0.4) hue-rotate(90deg) saturate(0.6) brightness(1.05)";
                        } else {
                            f = f.replace("grayscale(1) ", "");
                        }
                        canvas.style.filter = f;
                    }
                    // Fade out loader once first frame is rendered
                    if (loaderElement) loaderElement.classList.add("fade-out");
                }

                // Determine current frame index based on scroll position
                const heroSection = document.getElementById("hero-scroll");
                let currentFrameIndex = 0;
                if (heroSection) {
                    const heroRect = heroSection.getBoundingClientRect();
                    const totalScrollable = heroSection.scrollHeight - window.innerHeight;
                    let scrolled = -heroRect.top;
                    let scrollPercent = scrolled / totalScrollable;
                    scrollPercent = Math.max(0, Math.min(1, scrollPercent));
                    currentFrameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(scrollPercent * TOTAL_FRAMES));
                }

                // Draw frame matching current scroll position as it loads
                if (i - 1 === currentFrameIndex && i !== 1 && canvas && ctx) {
                    drawImageProp(ctx, img);
                }

                checkCompletion();
            };

            img.onerror = () => {
                loadedCount++;
                if (loaderFill) {
                    loaderFill.style.width = `${(loadedCount / TOTAL_FRAMES) * 100}%`;
                }
                checkCompletion();
            };

            img.src = `public/images/herosection/ezgif-frame-${pad(i, 3)}.jpg`;
            preloadedImages.push(img);
        }
    }
    
    preloadFrames();

    // =========================================================================
    //   MOBILE NAV MENU TOGGLE
    // =========================================================================
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    const mainNav = document.querySelector(".main-nav");
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener("click", () => {
            mobileMenuToggle.classList.toggle("active");
            mainNav.classList.toggle("active");
        });

        const navLinks = document.querySelectorAll(".main-nav a");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                mobileMenuToggle.classList.remove("active");
                mainNav.classList.remove("active");
            });
        });
    }

    // =========================================================================
    //   SCROLL-DRIVEN HERO CANVAS ANIMATION
    // =========================================================================
    // NOTE: canvas & ctx are declared at the TOP of the DOMContentLoaded handler
    // so they are available when frame 1 fires its onload above.

    function drawImageProp(context, img) {
        const canvasWidth = context.canvas.width;
        const canvasHeight = context.canvas.height;
        
        // Use default dimensions if image is not loaded
        const imgWidth = img.naturalWidth || 1200;
        const imgHeight = img.naturalHeight || 675;
        
        if (window.innerWidth <= 768) {
            // Mobile: simulate object-fit: contain so the car isn't cropped at the sides
            const r = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
            const nw = imgWidth * r;
            const nh = imgHeight * r;
            const cx = (canvasWidth - nw) * 0.5;
            const cy = (canvasHeight - nh) * 0.5;
            
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            context.drawImage(img, 0, 0, imgWidth, imgHeight, cx, cy, nw, nh);
            return;
        }
        
        const r = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
        let nw = imgWidth * r;
        let nh = imgHeight * r;
        let ar = 1;
        
        if (nw < canvasWidth) { ar = canvasWidth / nw; }
        if (Math.abs(ar - 1) < 1e-14 && nh < canvasHeight) { ar = canvasHeight / nh; }
        nw *= ar;
        nh *= ar;
        
        let cw = imgWidth / (nw / canvasWidth);
        let ch = imgHeight / (nh / canvasHeight);
        
        let cx2 = (imgWidth - cw) * 0.5;
        let cy2 = (imgHeight - ch) * 0.5;
        
        if (cx2 < 0) cx2 = 0;
        if (cy2 < 0) cy2 = 0;
        if (cw > imgWidth) cw = imgWidth;
        if (ch > imgHeight) ch = imgHeight;
        
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(img, cx2, cy2, cw, ch, 0, 0, canvasWidth, canvasHeight);
    }

    // Resize canvas to match screen aspect ratio
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        // Initial drawing of first frame
        if (preloadedImages[0]) {
            drawImageProp(ctx, preloadedImages[0]);
        }
    }
    
    window.addEventListener("resize", resizeCanvas);
    if (canvas) resizeCanvas();

    // Ensure interior images are in full color on load
    (function applyInitialInteriorFilter() {
        const interiorImgs = [
            document.getElementById("showroom-interior-img"),
            document.getElementById("cabin-parallax-img")
        ];
        interiorImgs.forEach(el => {
            if (el) el.style.filter = "none";
        });
    })();

    // Scroll interpolation calculator for text overlays (Framer Motion feel)
    function getSlideStyle(percent, start, peakStart, peakEnd, end) {
        let opacity = 0;
        let translateY = 30; // Drift distance
        
        if (percent >= start && percent <= end) {
            if (percent < peakStart) {
                // Fade in
                const ratio = (percent - start) / (peakStart - start);
                opacity = ratio;
                translateY = 30 * (1 - ratio);
            } else if (percent >= peakStart && percent <= peakEnd) {
                // Peak visible
                opacity = 1;
                translateY = 0;
            } else {
                // Fade out
                const ratio = (percent - peakEnd) / (end - peakEnd);
                opacity = 1 - ratio;
                translateY = -30 * ratio; // Drift up
            }
        }
        return { opacity, translateY };
    }

    // Main scroll handler coordinating Canvas and Cabin Zoom Parallax
    function handleScrollAnimations() {
        const scrollY = window.scrollY;

        // 1. HERO CANVAS ANIMATION & SLIDES
        const heroSection = document.getElementById("hero-scroll");
        if (heroSection && canvas) {
            const heroRect = heroSection.getBoundingClientRect();
            const totalScrollable = heroSection.scrollHeight - window.innerHeight;
            
            // Current scrolled pixels inside hero container
            let scrolled = -heroRect.top;
            let scrollPercent = scrolled / totalScrollable;
            scrollPercent = Math.max(0, Math.min(1, scrollPercent));
            
            // Swapping frame index (0-239)
            const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(scrollPercent * TOTAL_FRAMES));
            const currentImg = preloadedImages[frameIndex];
            
            if (currentImg && currentImg.complete) {
                drawImageProp(ctx, currentImg);
            } else if (preloadedImages[0] && preloadedImages[0].complete) {
                // Fallback to first frame if current hasn't finished loading
                drawImageProp(ctx, preloadedImages[0]);
            }
            
            // Dynamic scroll-driven color filter updates
            // Slide 1 car body (scrollPercent <= 0.15) should get the showroom selected color filter.
            // Slides 2-5 mechanical chassis (scrollPercent > 0.15) should be unfiltered (none).
            const activeChip = document.querySelector(".showroom-color-card.active");
            const colorKey = activeChip ? activeChip.getAttribute("data-color") : "pure-grey";
            const config = colorFilters[colorKey];
            
            if (scrollPercent <= 0.15) {
                if (config) {
                    let filterString = config.filter;
                    if (colorKey === "dehradun-dew") {
                        filterString = "sepia(0.4) hue-rotate(90deg) saturate(0.8) brightness(1.05)";
                    } else {
                        filterString = filterString.replace("grayscale(1) ", "");
                    }
                    canvas.style.filter = filterString;
                }
            } else {
                canvas.style.filter = "none";
            }
            
            // Interpolate slide text transformations
            // Ranges (start, peakStart, peakEnd, end) mapped to scroll percentages
            const slideConfigs = [
                { id: "slide-1", range: [0.0, 0.0, 0.08, 0.15] },
                { id: "slide-2", range: [0.18, 0.24, 0.32, 0.38] },
                { id: "slide-3", range: [0.40, 0.46, 0.54, 0.60] },
                { id: "slide-4", range: [0.62, 0.68, 0.76, 0.82] },
                { id: "slide-5", range: [0.84, 0.90, 0.96, 1.00] }
            ];
            
            slideConfigs.forEach(config => {
                const el = document.getElementById(config.id);
                if (el) {
                    const style = getSlideStyle(scrollPercent, ...config.range);
                    
                    if (style.opacity > 0) {
                        el.classList.add("active");
                        el.style.opacity = style.opacity;
                        el.style.transform = `translateY(${style.translateY}px)`;
                    } else {
                        el.classList.remove("active");
                        el.style.opacity = "0";
                    }
                }
            });
        }

        // 2. CABIN STEP-IN ZOOM PARALLAX
        const interiorSection = document.getElementById("interior");
        if (interiorSection && window.innerWidth > 768) { // Only run zoom parallax on desktop
            const interiorRect = interiorSection.getBoundingClientRect();
            const totalScrollable = interiorSection.scrollHeight - window.innerHeight;
            
            let scrolled = -interiorRect.top;
            let scrollPercent = scrolled / totalScrollable;
            scrollPercent = Math.max(0, Math.min(1, scrollPercent));
            
            const zoomContainer = interiorSection.querySelector(".parallax-zoom-container");
            const cabinImg = document.getElementById("cabin-parallax-img");
            
            if (zoomContainer && cabinImg) {
                // Expand container width from 50vw to 100vw and height from 30vw to 100vh
                const widthVal = 50 + (50 * scrollPercent);
                const heightVal = 30 + (70 * scrollPercent);
                const borderRadiusVal = 20 * (1 - scrollPercent);
                const imageScale = 1.2 - (0.1 * scrollPercent); // Smooth zoom-in detail
                
                zoomContainer.style.width = `${widthVal}vw`;
                zoomContainer.style.height = `${heightVal}vh`;
                zoomContainer.style.borderRadius = `${borderRadiusVal}px`;
                cabinImg.style.transform = `scale(${imageScale})`;
            }
            
            // Toggle cabin detail text slides based on scroll milestones
            const textSlides = [
                { id: "cabin-text-1", start: 0.12, end: 0.38 },
                { id: "cabin-text-2", start: 0.42, end: 0.68 },
                { id: "cabin-text-3", start: 0.72, end: 0.98 }
            ];
            
            textSlides.forEach(slide => {
                const el = document.getElementById(slide.id);
                if (el) {
                    if (scrollPercent >= slide.start && scrollPercent <= slide.end) {
                        el.classList.add("active");
                    } else {
                        el.classList.remove("active");
                    }
                }
            });
        }
    }

    window.addEventListener("scroll", handleScrollAnimations);
    
    // =========================================================================
    //   INTERACTIVE DIGITAL SHOWROOM CUSTOMIZATION ENGINE
    // =========================================================================
    
    // 1. Drivetrain/Trim selection configurations
    const trimRadios = document.querySelectorAll('input[name="trim-select"]');
    const showPriceValue = document.getElementById("showroom-price-value");
    
    const showStatRange = document.getElementById("show-stat-range");
    const showStatRealRange = document.getElementById("show-stat-real-range");
    const showStatPower = document.getElementById("show-stat-power");
    const showStatTorque = document.getElementById("show-stat-torque");
    
    const fillRange = document.getElementById("fill-range");
    const fillRealRange = document.getElementById("fill-real-range");
    const fillPower = document.getElementById("fill-power");
    const fillTorque = document.getElementById("fill-torque");

    const trimSpecs = {
        "smart": {
            priceText: "₹6,99,000",
            range: "226 km",
            realRange: "160-170 km",
            power: "45 kW (60 HP)",
            torque: "110 Nm",
            rangeFill: "79%",
            realRangeFill: "76%",
            powerFill: "81%",
            torqueFill: "96%"
        },
        "pure-19": {
            priceText: "₹8,49,000",
            range: "226 km",
            realRange: "160-170 km",
            power: "45 kW (60 HP)",
            torque: "110 Nm",
            rangeFill: "79%",
            realRangeFill: "76%",
            powerFill: "81%",
            torqueFill: "96%"
        },
        "pure-24": {
            priceText: "₹9,49,000",
            range: "285 km",
            realRange: "205-215 km",
            power: "55 kW (74 HP)",
            torque: "114 Nm",
            rangeFill: "100%",
            realRangeFill: "100%",
            powerFill: "100%",
            torqueFill: "100%"
        },
        "creative": {
            priceText: "₹9,99,000",
            range: "285 km",
            realRange: "205-215 km",
            power: "55 kW (74 HP)",
            torque: "114 Nm",
            rangeFill: "100%",
            realRangeFill: "100%",
            powerFill: "100%",
            torqueFill: "100%"
        }
    };

    const colorChipsData = {
        "dehradun-dew": { body: "#d2e5dd", roof: "#1a1e24" },
        "sobo-surge": { body: "#00a2ac", roof: "#1a1e24" },
        "pangong-pulse": { body: "#0c3c52", roof: "#1a1e24" },
        "pure-grey": { body: "#5e6368", roof: "#1a1e24" },
        "daytona-grey": { body: "#3c3f41", roof: "#1a1e24" },
        "pristine-white": { body: "#ffffff", roof: "#1a1e24" }
    };

    const variantColors = {
        "smart": ["pangong-pulse", "pure-grey", "daytona-grey", "pristine-white"],
        "pure-19": ["sobo-surge", "pangong-pulse", "pure-grey", "daytona-grey", "pristine-white"],
        "pure-24": ["sobo-surge", "pangong-pulse", "pure-grey", "daytona-grey", "pristine-white"],
        "creative": ["dehradun-dew", "sobo-surge", "pangong-pulse", "pure-grey", "daytona-grey", "pristine-white"]
    };

    // Dynamic variant specifications and features list data
    const variantFeaturesData = {
        "smart": [
            "6 Airbags as standard",
            "ABS with EBD",
            "Rear Parking Sensor",
            "i-TPMS & ISOFIX child mount",
            "i-High Beam Alert",
            "Digital Island Cluster",
            "Multi Drive Modes – City & Sport",
            "Multi Mode Regen with Regen Selector",
            "Automatic with Drive Selection Knob"
        ],
        "pure-19": [
            "Smart 19 features plus:",
            "Fabricia Luxe Dashboard",
            "Sportluxe Steering Wheel",
            "Premium Melange Fabric Seats",
            "Chrome Line Door Handles",
            "R14 Steel Wheels with Wheel Covers",
            "iRA.ev Connectivity with 40+ Features"
        ],
        "pure-24": [
            "Smart 19 features plus:",
            "Fabricia Luxe Dashboard",
            "Sportluxe Steering Wheel",
            "Premium Melange Fabric Seats",
            "Chrome Line Door Handles",
            "R14 Steel Wheels with Wheel Covers",
            "iRA.ev Connectivity with 40+ Features"
        ],
        "creative": [
            "Pure+ 24 features plus:",
            "R14 Hyperstyle Wheels",
            "LED DRLs & Lux Beam LED Headlamps",
            "360° SVS HD Camera & Blind View Monitor",
            "ESP with Traction Control & Hill Hold Control",
            "Automatic Headlamps & Rain Sensing Wipers",
            "Ultra View 26.03 cm HD Touchscreen",
            "Cruise Control & Passive Entry Passive Start",
            "Electrically Adjustable & Autofold ORVMs",
            "Rear AC Vents & Cooled Glovebox"
        ]
    };

    function renderVariantFeatures() {
        const selectedTrimRadio = document.querySelector('input[name="trim-select"]:checked');
        const selectedTrim = selectedTrimRadio ? selectedTrimRadio.value : "creative";
        const features = variantFeaturesData[selectedTrim] || [];
        
        const featuresListContainer = document.getElementById("features-list-container");
        if (featuresListContainer) {
            featuresListContainer.innerHTML = features.map(feat => `
                <div class="variant-feature-item">
                    <span class="feature-item-bullet">✓</span>
                    <span class="feature-item-text">${feat}</span>
                </div>
            `).join('');
        }
    }

    function updateColorCardNames() {
        const selectedTrimRadio = document.querySelector('input[name="trim-select"]:checked');
        const selectedTrim = selectedTrimRadio ? selectedTrimRadio.value : "creative";
        const isDualTone = (selectedTrim === "creative");
        
        const colorNamesMap = {
            "daytona-grey": "Daytona Grey",
            "dehradun-dew": "Dehradun Dew",
            "pure-grey": "Pure Grey",
            "pangong-pulse": "Pangong Pulse",
            "pristine-white": "Pristine White",
            "sobo-surge": "Sobo Surge"
        };
        
        const cards = document.querySelectorAll(".showroom-color-card");
        cards.forEach(card => {
            const colorKey = card.getAttribute("data-color");
            const nameSpan = card.querySelector(".color-card-name");
            if (nameSpan && colorNamesMap[colorKey]) {
                nameSpan.textContent = colorNamesMap[colorKey] + (isDualTone ? " with Dual Tone" : "");
            }
        });
    }

    trimRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            const selectedTrim = radio.value;
            const specs = trimSpecs[selectedTrim];
            
            if (specs) {
                // Dynamic content fading
                const fadeElements = [
                    { el: showPriceValue, val: specs.priceText },
                    { el: showStatRange, val: specs.range },
                    { el: showStatRealRange, val: specs.realRange },
                    { el: showStatPower, val: specs.power },
                    { el: showStatTorque, val: specs.torque }
                ];
                
                fadeElements.forEach(item => {
                    if (item.el) {
                        item.el.style.opacity = "0.2";
                        setTimeout(() => {
                            item.el.textContent = item.val;
                            item.el.style.opacity = "1";
                        }, 120);
                    }
                });
                
                // Animate progress bar widths
                if (fillRange) fillRange.style.width = specs.rangeFill;
                if (fillRealRange) fillRealRange.style.width = specs.realRangeFill;
                if (fillPower) fillPower.style.width = specs.powerFill;
                if (fillTorque) fillTorque.style.width = specs.torqueFill;

                // Sync target price to savings calculator
                const targetPriceInput = document.getElementById("savings-target-price");
                if (targetPriceInput) {
                    targetPriceInput.value = specs.priceText.replace(/[^0-9]/g, '');
                    updateSavingsCalculations();
                }

                // Update Customizer Variant title and price display
                const customizerVariantTitle = document.getElementById("customizer-variant-title");
                const customizerVariantPrice = document.getElementById("customizer-variant-price");
                
                let variantDisplayName = "Tiago.ev ";
                if (selectedTrim === "smart") variantDisplayName += "Smart 19";
                else if (selectedTrim === "pure-19") variantDisplayName += "Pure+ 19";
                else if (selectedTrim === "pure-24") variantDisplayName += "Pure+ 24";
                else if (selectedTrim === "creative") variantDisplayName += "Creative+ 24";
                
                let priceLakh = "₹9.99 Lakh";
                if (selectedTrim === "smart") priceLakh = "₹6.99 Lakh";
                else if (selectedTrim === "pure-19") priceLakh = "₹8.49 Lakh";
                else if (selectedTrim === "pure-24") priceLakh = "₹9.49 Lakh";
                else if (selectedTrim === "creative") priceLakh = "₹9.99 Lakh";

                if (customizerVariantTitle) customizerVariantTitle.textContent = variantDisplayName;
                if (customizerVariantPrice) customizerVariantPrice.textContent = priceLakh;

                // Update allowed colors list and gradient representation on cards
                const allowedColors = variantColors[selectedTrim] || [];
                let isCurrentColorAllowed = false;
                
                const cards = document.querySelectorAll(".showroom-color-card");
                cards.forEach(card => {
                    const colorKey = card.getAttribute("data-color");
                    const data = colorChipsData[colorKey];
                    const chipSpan = card.querySelector(".color-card-chip");
                    
                    if (data && allowedColors.includes(colorKey)) {
                        card.style.display = "flex";
                        
                        // Dual tone (creative) vs Single tone (others)
                        if (chipSpan) {
                            if (selectedTrim === "creative") {
                                chipSpan.style.background = `linear-gradient(135deg, ${data.body} 50%, ${data.roof} 50%)`;
                            } else {
                                chipSpan.style.background = data.body;
                            }
                        }
                        
                        if (card.classList.contains("active")) {
                            isCurrentColorAllowed = true;
                        }
                    } else {
                        card.style.display = "none";
                    }
                });

                // If currently active color is not allowed, switch to the first allowed color
                if (!isCurrentColorAllowed && allowedColors && allowedColors.length > 0) {
                    const firstAllowedColor = allowedColors[0];
                    const targetCard = document.querySelector(`.showroom-color-card[data-color="${firstAllowedColor}"]`);
                    if (targetCard) {
                        targetCard.click();
                    }
                }

                // Update names of color cards with dual-tone suffixes
                updateColorCardNames();

                // Reset all accessory additions on variant change to avoid pricing inconsistencies
                const accessoryBtns = document.querySelectorAll(".btn-add-accessory");
                accessoryBtns.forEach(btn => {
                    btn.classList.remove("added", "btn-primary");
                    btn.classList.add("btn-outline");
                    btn.textContent = "Add";
                });

                // If features tab is active, re-render standard trim features list
                const activeTab = document.querySelector(".customizer-tab.active");
                if (activeTab && activeTab.getAttribute("data-tab") === "features") {
                    renderVariantFeatures();
                }
            }
        });
    });

    // =========================================================================
    //   SAVINGS / INVESTMENT PLANNER LOGIC
    // =========================================================================
    const savingsTargetPrice = document.getElementById("savings-target-price");
    const dailySavingsRange = document.getElementById("daily-savings-range");
    const dailySavingsInput = document.getElementById("daily-savings-input");
    const resultYears = document.getElementById("result-years");
    const resultMonths = document.getElementById("result-months");
    const resultDays = document.getElementById("result-days");
    const savingsSummaryText = document.getElementById("savings-summary-text");
    const savingsProgressFill = document.getElementById("savings-progress-fill");
    const milestonePercentage = document.getElementById("milestone-percentage");
    const presetBtns = document.querySelectorAll(".btn-preset");

    function updateSavingsCalculations() {
        if (!savingsTargetPrice || !dailySavingsRange || !dailySavingsInput) return;

        const targetPrice = parseFloat(savingsTargetPrice.value) || 0;
        const dailySavings = parseFloat(dailySavingsInput.value) || 0;

        if (targetPrice <= 0 || dailySavings <= 0) {
            if (resultYears) resultYears.textContent = "0.0";
            if (resultMonths) resultMonths.textContent = "0.0";
            if (resultDays) resultDays.textContent = "0";
            if (savingsSummaryText) savingsSummaryText.innerHTML = "Please set a valid target price and daily savings amount.";
            if (savingsProgressFill) savingsProgressFill.style.width = "0%";
            if (milestonePercentage) milestonePercentage.textContent = "0%";
            return;
        }

        const totalDays = Math.ceil(targetPrice / dailySavings);
        const totalMonths = (totalDays / 30.417).toFixed(1);
        const totalYears = (totalDays / 365).toFixed(1);

        // Update timeline text fields
        if (resultDays) resultDays.textContent = totalDays.toLocaleString();
        if (resultMonths) resultMonths.textContent = totalMonths;
        if (resultYears) resultYears.textContent = totalYears;

        // Dynamic summary message formatting
        let yearsPart = Math.floor(totalDays / 365);
        let monthsPart = Math.round((totalDays % 365) / 30.417);
        if (monthsPart === 12) {
            yearsPart += 1;
            monthsPart = 0;
        }

        let timeString = "";
        if (yearsPart > 0) {
            timeString += `<strong>${yearsPart} ${yearsPart === 1 ? 'year' : 'years'}</strong>`;
        }
        if (monthsPart > 0) {
            if (yearsPart > 0) timeString += " and ";
            timeString += `<strong>${monthsPart} ${monthsPart === 1 ? 'month' : 'months'}</strong>`;
        }
        if (yearsPart === 0 && monthsPart === 0) {
            timeString = `<strong>${totalDays} ${totalDays === 1 ? 'day' : 'days'}</strong>`;
        }

        if (savingsSummaryText) {
            savingsSummaryText.innerHTML = `By saving <strong>₹${dailySavings.toLocaleString()}</strong> every day, you will be able to buy your Tiago.ev priced at <strong>₹${targetPrice.toLocaleString()}</strong> in about ${timeString}!`;
        }

        // Progress fill based on range limit
        const progressPercentage = Math.min(100, Math.round((dailySavings / 5000) * 100));
        if (savingsProgressFill) savingsProgressFill.style.width = `${progressPercentage}%`;
        if (milestonePercentage) milestonePercentage.textContent = `${progressPercentage}%`;
    }

    if (dailySavingsRange && dailySavingsInput) {
        dailySavingsRange.addEventListener("input", (e) => {
            dailySavingsInput.value = e.target.value;
            presetBtns.forEach(btn => {
                if (parseInt(btn.getAttribute("data-value")) === parseInt(e.target.value)) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
            updateSavingsCalculations();
        });

        dailySavingsInput.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value) || 0;
            dailySavingsRange.value = Math.min(5000, Math.max(100, val));
            
            presetBtns.forEach(btn => {
                if (parseInt(btn.getAttribute("data-value")) === val) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
            updateSavingsCalculations();
        });
    }

    if (savingsTargetPrice) {
        savingsTargetPrice.addEventListener("input", () => {
            updateSavingsCalculations();
        });
    }

    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            presetBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const val = btn.getAttribute("data-value");
            if (dailySavingsInput && dailySavingsRange) {
                dailySavingsInput.value = val;
                dailySavingsRange.value = val;
                updateSavingsCalculations();
            }
        });
    });

    // Initial calculations
    updateSavingsCalculations();

    // 2. Color Vibe chips and CSS paint filters
    const showroomChips = document.querySelectorAll(".showroom-chip");
    const showroomColorDisplay = document.getElementById("showroom-color-display");
    const showroom360Img = document.getElementById("showroom-360-img");
    const showroomInteriorImg = document.getElementById("showroom-interior-img");
    


    showroomChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const colorKey = chip.getAttribute("data-color");
            const config = colorFilters[colorKey];
            
            if (config) {
                // Update active states
                showroomChips.forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                
                // Update displayed name with Dual Tone check
                const selectedTrimRadio = document.querySelector('input[name="trim-select"]:checked');
                const selectedTrim = selectedTrimRadio ? selectedTrimRadio.value : "creative";
                const isDualTone = (selectedTrim === "creative");
                if (showroomColorDisplay) {
                    showroomColorDisplay.textContent = config.name + (isDualTone ? " with Dual Tone" : "");
                }

                // Update Tone dropdown icon to match active color chip
                const toneColorIcon = document.querySelector(".tone-color-icon");
                if (toneColorIcon) {
                    const data = colorChipsData[colorKey];
                    if (data) {
                        if (isDualTone) {
                            toneColorIcon.style.background = `linear-gradient(135deg, ${data.body} 50%, ${data.roof} 50%)`;
                        } else {
                            toneColorIcon.style.background = data.body;
                        }
                    }
                }
                
                // Sync body class theme safely without overwriting other potential classes
                Array.from(document.body.classList).forEach(cls => {
                    if (cls.startsWith('color-')) {
                        document.body.classList.remove(cls);
                    }
                });
                document.body.classList.add(`color-${colorKey}`);
                
                // Update exterior static image src
                const showroomExteriorImg = document.getElementById("showroom-exterior-img");
                if (showroomExteriorImg && colorImages[colorKey]) {
                    showroomExteriorImg.style.opacity = "0.4";
                    setTimeout(() => {
                        showroomExteriorImg.src = colorImages[colorKey];
                        showroomExteriorImg.style.opacity = "1";
                    }, 120);
                }
                
                // Apply color shifting filter transitions
                const cabinParallaxImg = document.getElementById("cabin-parallax-img");
                const showcaseVideo = document.querySelector(".showcase-video-player");
                const showcaseImg = document.querySelector(".showcase-image");
                
                if (showcaseVideo) showcaseVideo.style.filter = "none";
                if (showcaseImg) showcaseImg.style.filter = "none";
                
                const mediaItems = [
                    { el: showroom360Img,     isGreenBase: false, isInterior: false },
                    { el: showroomInteriorImg, isGreenBase: false, isInterior: true },
                    { el: cabinParallaxImg,    isGreenBase: false, isInterior: true },
                    { el: canvas,              isGreenBase: true,  isInterior: false }
                ];
                
                mediaItems.forEach(item => {
                    if (item.el) {
                        item.el.style.opacity = "0.4";
                        setTimeout(() => {
                            let filterString = config.filter;
                            if (item.isInterior) {
                                // Interior images: keep their natural colors!
                                filterString = "none";
                            } else if (item.isGreenBase) {
                                // Hero canvas: keep in color
                                if (colorKey === "dehradun-dew") {
                                    filterString = "sepia(0.4) hue-rotate(90deg) saturate(0.8) brightness(1.05)";
                                } else {
                                    filterString = filterString.replace("grayscale(1) ", "");
                                }
                            }
                            item.el.style.filter = filterString;
                            item.el.style.opacity = "1";
                            if (item.el === canvas) handleScrollAnimations();
                        }, 120);
                    }
                });
            }
        });
    });

    // 3. Toggle View buttons (Exterior Design vs 360 Walkaround vs Cabin View)
    const toggleViewBtns = document.querySelectorAll(".toggle-view-btn");
    const viewExteriorContainer = document.getElementById("view-exterior-container");
    const view360Container = document.getElementById("view-360-container");
    const viewInteriorContainer = document.getElementById("view-interior-container");

    toggleViewBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetView = btn.getAttribute("data-view");
            
            toggleViewBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const containers = [
                { el: viewExteriorContainer, view: "exterior" },
                { el: view360Container, view: "360" },
                { el: viewInteriorContainer, view: "interior" }
            ];

            containers.forEach(item => {
                if (item.el) {
                    if (item.view === targetView) {
                        item.el.classList.add("active");
                    } else {
                        item.el.classList.remove("active");
                    }
                }
            });
        });
    });

    // 4. Interactive draggable rotation in Showroom
    let isDraggingShowroom = false;
    let startXShowroom = 0;
    let startFrameShowroom = 1;
    let currentFrameShowroom = 1;
    const pixelsPerFrameShowroom = 5;

    if (view360Container && showroom360Img) {
        const startDrag = (e) => {
            isDraggingShowroom = true;
            startXShowroom = e.pageX || e.touches[0].pageX;
            startFrameShowroom = currentFrameShowroom;
        };

        const dragMove = (e) => {
            if (!isDraggingShowroom) return;
            e.preventDefault();
            
            const currentX = e.pageX || e.touches[0].pageX;
            const deltaX = currentX - startXShowroom;
            const frameOffset = Math.round(-deltaX / pixelsPerFrameShowroom);
            
            let newFrame = startFrameShowroom + frameOffset;
            
            // Clamp and wrap frame index loops (1-240)
            if (newFrame > TOTAL_FRAMES) {
                newFrame = ((newFrame - 1) % TOTAL_FRAMES) + 1;
            } else if (newFrame < 1) {
                newFrame = TOTAL_FRAMES - (Math.abs(newFrame) % TOTAL_FRAMES);
            }
            
            currentFrameShowroom = newFrame;
            showroom360Img.src = `public/images/herosection/ezgif-frame-${pad(newFrame, 3)}.jpg`;
        };

        const stopDrag = () => {
            isDraggingShowroom = false;
        };

        view360Container.addEventListener("mousedown", startDrag);
        view360Container.addEventListener("touchstart", startDrag, { passive: true });
        
        window.addEventListener("mousemove", dragMove);
        window.addEventListener("touchmove", dragMove, { passive: false });
        
        window.addEventListener("mouseup", stopDrag);
        window.addEventListener("touchend", stopDrag);
    }

    // =========================================================================
    //   DRIVETRAIN SHOWCASE MEDIA TABS (VIDEO VS EXPLODED)
    // =========================================================================
    const showcaseTabs = document.querySelectorAll(".showcase-tab");
    const mediaContainers = document.querySelectorAll(".media-container");

    showcaseTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.getAttribute("data-tab");

            showcaseTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            mediaContainers.forEach(container => {
                if (container.id === `showcase-${targetTab}`) {
                    container.classList.add("active");
                } else {
                    container.classList.remove("active");
                }
            });
        });
    });

    // =========================================================================
    //   BOOKING MODAL DIALOG SYNC
    // =========================================================================
    const bookingModal = document.getElementById("booking-modal");
    const bookNowButtons = document.querySelectorAll(".btn-book-now");
    const configBookBtn = document.querySelector(".btn-config-book");
    const modalCloseBtn = document.getElementById("modal-close-btn");
    const leadForm = document.getElementById("lead-form");
    const formSuccess = document.getElementById("form-success");

    const openModal = (e) => {
        if (e) e.preventDefault();
        window.location.href = "https://ev.tatamotors.com/tiago/ev.html";
    };

    const closeModal = () => {
        if (!bookingModal) return;
        bookingModal.classList.remove("active");
        document.body.classList.remove("modal-open");
        
        setTimeout(() => {
            if (leadForm && formSuccess) {
                leadForm.reset();
                leadForm.style.display = "flex";
                formSuccess.style.display = "none";
            }
        }, 300);
    };

    bookNowButtons.forEach(btn => btn.addEventListener("click", openModal));
    if (configBookBtn) configBookBtn.addEventListener("click", openModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    
    if (bookingModal) {
        bookingModal.addEventListener("click", (e) => {
            if (e.target === bookingModal) {
                closeModal();
            }
        });
    }

    if (leadForm) {
        leadForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const name = document.getElementById("form-name").value;
            const phone = document.getElementById("form-phone").value;
            const email = document.getElementById("form-email").value;
            const city = document.getElementById("form-city").value;
            
            const variant = document.getElementById("form-variant").value;
            const color = document.getElementById("form-color").value;

            console.log("Registered Booking Configuration:", { name, phone, email, city, variant, color });

            leadForm.style.opacity = "0";
            setTimeout(() => {
                leadForm.style.display = "none";
                leadForm.style.opacity = "1";
                if (formSuccess) {
                    formSuccess.style.display = "flex";
                }
            }, 300);
        });
    }

    // =========================================================================
    //   STANDARD SCROLL REVEALS
    // =========================================================================
    const revealElements = document.querySelectorAll(".scroll-reveal");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        });

        revealElements.forEach(el => {
            // Skip the cabin zoom slides as they are controlled by the handleScrollAnimations
            if (el.parentElement.classList.contains("parallax-text-container") && window.innerWidth > 768) {
                return;
            }
            revealObserver.observe(el);
        });
    } else {
        revealElements.forEach(el => el.classList.add("active"));
    }
    
    // =========================================================================
    //   INTERACTIVE FEATURES EXPLORER LOGIC
    // =========================================================================
    const featureSearch = document.getElementById("feature-search");
    const featureTabBtns = document.querySelectorAll(".feature-tab-btn");
    const featureCards = document.querySelectorAll(".feature-card");

    let currentCategory = "all";
    let searchQuery = "";

    function filterExplorerFeatures() {
        featureCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            const cardTitle = card.querySelector("h4").textContent.toLowerCase();
            const cardDesc = card.querySelector("p").textContent.toLowerCase();
            
            const matchesCategory = (currentCategory === "all" || cardCategory === currentCategory);
            const matchesSearch = (cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery));

            if (matchesCategory && matchesSearch) {
                card.style.display = "block";
                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                }, 10);
            } else {
                card.style.opacity = "0";
                card.style.transform = "scale(0.95)";
                setTimeout(() => {
                    card.style.display = "none";
                }, 200);
            }
        });
    }

    if (featureSearch) {
        featureSearch.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterExplorerFeatures();
        });
    }

    featureTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            featureTabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.getAttribute("data-category");
            filterExplorerFeatures();
        });
    });

    // Ripple click animation on cards
    featureCards.forEach(card => {
        card.addEventListener("click", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement("span");
            ripple.classList.add("ripple");
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            // Clean up old ripples
            const existingRipple = card.querySelector(".ripple");
            if (existingRipple) existingRipple.remove();

            card.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Initial triggers
    resizeCanvas();
    handleScrollAnimations();
    
    // Trigger initial trim color setup and color filter initialization
    const initialTrimRadio = document.querySelector('input[name="trim-select"]:checked');
    let colorClicked = false;
    if (initialTrimRadio) {
        const chips = document.querySelectorAll(".showroom-chip");
        const detectClick = () => { colorClicked = true; };
        chips.forEach(c => c.addEventListener("click", detectClick));
        
        initialTrimRadio.dispatchEvent(new Event('change'));
        
        chips.forEach(c => c.removeEventListener("click", detectClick));
    }
    
    // If no color chip was clicked during the trim initialization (meaning the default color is allowed),
    // click the active chip once to ensure the initial color filters are applied.
    if (!colorClicked) {
        const activeColorChip = document.querySelector(".showroom-chip.active");
        if (activeColorChip) {
            activeColorChip.click();
        }
    }

    // =========================================================================
    //   NEW CUSTOMIZER TABS NAVIGATION
    // =========================================================================
    const customizerTabs = document.querySelectorAll(".customizer-tab");
    const tabDesign = document.getElementById("tab-content-design");
    const tabFeatures = document.getElementById("tab-content-features");
    const tabAccessories = document.getElementById("tab-content-accessories");

    customizerTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            customizerTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const targetTab = tab.getAttribute("data-tab");
            
            if (targetTab === "design") {
                if (tabDesign) tabDesign.classList.add("active");
                if (tabFeatures) tabFeatures.classList.remove("active");
                if (tabAccessories) tabAccessories.classList.remove("active");
            } else if (targetTab === "features") {
                if (tabDesign) tabDesign.classList.remove("active");
                if (tabFeatures) tabFeatures.classList.add("active");
                if (tabAccessories) tabAccessories.classList.remove("active");
                renderVariantFeatures();
            } else if (targetTab === "accessories") {
                if (tabDesign) tabDesign.classList.remove("active");
                if (tabFeatures) tabFeatures.classList.remove("active");
                if (tabAccessories) tabAccessories.classList.add("active");
            }
        });
    });

    // =========================================================================
    //   COLLAPSIBLE TONE DROPDOWN
    // =========================================================================
    const toneDropdown = document.querySelector(".tone-dropdown-trigger");
    const verticalColorList = document.querySelector(".vertical-color-list");
    if (toneDropdown && verticalColorList) {
        toneDropdown.addEventListener("click", () => {
            verticalColorList.classList.toggle("collapsed");
            const caret = toneDropdown.querySelector(".dropdown-caret");
            if (caret) {
                const isCollapsed = verticalColorList.classList.contains("collapsed");
                caret.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0deg)";
            }
        });
    }

    // =========================================================================
    //   ACCESSORIES TOGGLE AND DYNAMIC PRICING SYSTEM
    // =========================================================================
    const accessoryBtns = document.querySelectorAll(".btn-add-accessory");
    accessoryBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const isAdded = btn.classList.contains("added");
            const priceText = btn.parentElement.querySelector(".accessory-price").textContent;
            const priceVal = parseInt(priceText.replace(/[^0-9]/g, ''));
            
            const priceDisplay = document.getElementById("showroom-price-value");
            let currentTotalPrice = parseInt(priceDisplay.textContent.replace(/[^0-9]/g, ''));

            if (!isAdded) {
                btn.classList.add("added", "btn-primary");
                btn.classList.remove("btn-outline");
                btn.textContent = "Added";
                currentTotalPrice += priceVal;
            } else {
                btn.classList.remove("added", "btn-primary");
                btn.classList.add("btn-outline");
                btn.textContent = "Add";
                currentTotalPrice -= priceVal;
            }

            priceDisplay.textContent = "₹" + currentTotalPrice.toLocaleString('en-IN');
        });
    });
});
