// Afrihost Wireless Devices Demo JavaScript

// Device data
const devices = {
    'zte-g5ts': {
        name: 'ZTE G5TS',
        description: '5G CPE WiFi 6 Router',
        price: 'R2 499.00',
        features: [
            'Supports 4G, 5G + WiFi 6 technology',
            'Dual-band WiFi (2.4GHz and 5GHz)',
            'Connect up to 64 wireless devices',
            'High-speed internet connectivity',
            'Easy setup and management',
            'Compact and modern design'
        ],
        specs: {
            'Network': '4G/5G + WiFi 6',
            'WiFi Standards': '802.11ax/ac/n/g/b',
            'Frequency Bands': '2.4GHz + 5GHz',
            'Max Devices': 'Up to 64',
            'Ethernet Ports': '2 x Gigabit',
            'Dimensions': '180 x 120 x 40mm'
        }
    },
    'tp-link-nx510v': {
        name: 'TP-Link NX510v',
        description: '5G Fixed Wireless Router',
        price: 'R3 999.00',
        features: [
            'Advanced 5G and WiFi 6 support',
            'Dual-band WiFi (2.4GHz and 5GHz)',
            'Connect over 250 wireless devices',
            'Enterprise-grade performance',
            'Advanced security features',
            'Professional management interface'
        ],
        specs: {
            'Network': '4G/5G + WiFi 6',
            'WiFi Standards': '802.11ax/ac/n/g/b',
            'Frequency Bands': '2.4GHz + 5GHz',
            'Max Devices': 'Over 250',
            'Ethernet Ports': '4 x Gigabit',
            'Dimensions': '200 x 150 x 45mm'
        }
    }
};

// Navigation dropdown functionality
function showDropdown(type) {
    const messages = {
        'status': 'Check network status and service availability',
        'contact': 'Contact support: 0860 AFRIHOST (0860 237 446)',
        'more': 'More options: Support, Account, Billing'
    };

    showToast(messages[type], 'info');
}

// Device details modal
function showDeviceDetails(deviceId) {
    const device = devices[deviceId];
    if (!device) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>${device.name}</h2>
        <p class="device-description">${device.description}</p>
        <div class="price-section">
            <span class="modal-price">${device.price}</span>
        </div>

        <div class="modal-section">
            <h3>Key Features</h3>
            <ul class="features-list">
                ${device.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>

        <div class="modal-section">
            <h3>Technical Specifications</h3>
            <div class="specs-grid">
                ${Object.entries(device.specs).map(([key, value]) => `
                    <div class="spec-item">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="modal-actions">
            <button class="w-button --type-primary --size-large" onclick="buyDevice('${deviceId}')">
                <span class="icon --cart-default">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M3 2h2.382a1 1 0 0 1 .894.553L7 4h14a1 1 0 0 1 .914 1.406l-3.65 7a1 1 0 0 1-.914.594H10l-1 2h10a1 1 0 0 1 0 2H7a1 1 0 0 1-.857-1.514L8 12 4 4H3a1 1 0 1 1 0-2m5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4m10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4"></path>
                    </svg>
                </span>
                Buy Now - ${device.price}
            </button>
            <button class="w-button --type-secondary --size-large" onclick="compareDevice('${deviceId}')">
                Compare Devices
            </button>
        </div>
    `;

    // Add modal styles
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .device-description {
                color: #666;
                font-size: 16px;
                margin-bottom: 20px;
            }
            .price-section {
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            .modal-price {
                font-size: 28px;
                font-weight: 700;
                color: var(--primary-color);
            }
            .modal-section {
                margin-bottom: 24px;
            }
            .modal-section h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #333;
            }
            .features-list {
                list-style: none;
                padding: 0;
            }
            .features-list li {
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
                position: relative;
                padding-left: 20px;
            }
            .features-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #28a745;
                font-weight: bold;
            }
            .specs-grid {
                display: grid;
                gap: 12px;
            }
            .spec-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .modal-actions {
                display: flex;
                gap: 12px;
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .modal-actions .w-button {
                flex: 1;
            }
        `;
        document.head.appendChild(style);
    }

    document.getElementById('deviceModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('deviceModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Buy device functionality
function buyDevice(deviceId) {
    const device = devices[deviceId];
    if (!device) return;

    // Simulate adding to cart
    showToast(`${device.name} added to cart! Redirecting to checkout...`, 'success');

    // Close modal if open
    closeModal();

    // Simulate redirect after delay
    setTimeout(() => {
        showToast('Redirecting to Afrihost ClientZone...', 'info');
        // In a real implementation, this would redirect to the actual purchase page
        console.log(`Would redirect to purchase page for ${deviceId}`);
    }, 2000);
}

// Compare device functionality
function compareDevice(deviceId) {
    const device = devices[deviceId];
    if (!device) return;

    showToast(`${device.name} added to comparison list`, 'success');

    // Store in localStorage for comparison (simplified implementation)
    let comparison = JSON.parse(localStorage.getItem('deviceComparison') || '[]');
    if (!comparison.includes(deviceId)) {
        comparison.push(deviceId);
        localStorage.setItem('deviceComparison', JSON.stringify(comparison));
    }

    closeModal();
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Card hover effects
function initializeCardEffects() {
    const cards = document.querySelectorAll('.device-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Price animation
function animatePrices() {
    const prices = document.querySelectorAll('.formatted-price');

    prices.forEach(price => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'pulse 0.6s ease-in-out';
                }
            });
        });

        observer.observe(price);
    });
}

// Initialize page functionality
function initializePage() {
    // Add click event listeners for card interactions
    document.querySelectorAll('.device-card').forEach(card => {
        const deviceId = card.dataset.device;

        // Add click listener to the whole card (not just the image)
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('.w-button')) {
                showDeviceDetails(deviceId);
            }
        });
    });

    // Initialize effects
    initializeCardEffects();
    animatePrices();

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Show welcome message
    setTimeout(() => {
        showToast('Welcome to Afrihost Wireless Devices!', 'info');
    }, 1000);
}

// Add pulse animation to CSS
const pulseAnimation = document.createElement('style');
pulseAnimation.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(pulseAnimation);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Service worker registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Export functions for testing
window.demoAPI = {
    showDeviceDetails,
    buyDevice,
    compareDevice,
    showToast,
    closeModal,
    devices
};