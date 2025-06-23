
class SignInManager {
    constructor() {
        this.initializeEventListeners();
        this.initializeAnimations();
        this.checkExistingAuth();
    }

    initializeEventListeners() {
        // Initialize Google OAuth
        this.initializeGoogleAuth();

        // Guest login
        document.getElementById('continueAsGuest').addEventListener('click', () => {
            this.handleGuestLogin();
        });

        // Button animations
        this.addButtonAnimations();
    }

    initializeAnimations() {
        // Page entrance animation
        const tl = gsap.timeline();

        tl.set('.signin-card', { scale: 0.9, opacity: 0 })
          .set('.feature-item', { y: 20, opacity: 0 })
          .set('.signin-form > *', { y: 20, opacity: 0 });

        tl.to('.signin-card', {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(1.7)"
        })
        .to('.feature-item', {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.3")
        .to('.signin-form > *', {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.2");
    }

    addButtonAnimations() {
        const buttons = document.querySelectorAll('.google-signin-btn, .guest-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.02,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            button.addEventListener('click', () => {
                gsap.to(button, {
                    scale: 0.98,
                    duration: 0.05,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(button, {
                            scale: 1,
                            duration: 0.1,
                            ease: "back.out(1.7)"
                        });
                    }
                });
            });
        });
    }

    initializeGoogleAuth() {
        const GOOGLE_CLIENT_ID = '528620317376-j0v8n7304obhb8vfag8upeqhitmoeoih.apps.googleusercontent.com';
        
        // Wait for Google script to load
        const initGoogle = () => {
            console.log('Attempting to initialize Google OAuth...');
            console.log('Google available:', typeof google !== 'undefined');
            console.log('Google accounts available:', typeof google !== 'undefined' && google.accounts);
            
            if (typeof google !== 'undefined' && google.accounts) {
                try {
                    google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: this.handleGoogleSignIn.bind(this),
                        auto_select: false,
                        cancel_on_tap_outside: false
                    });
                    console.log('Google OAuth initialized successfully');

                    const googleBtn = document.getElementById('googleSignIn');
                    console.log('Google button found:', !!googleBtn);
                    
                    if (googleBtn) {
                        // Remove any existing event listeners
                        googleBtn.replaceWith(googleBtn.cloneNode(true));
                        const newGoogleBtn = document.getElementById('googleSignIn');
                        
                        newGoogleBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('Google sign-in button clicked');
                            
                            // Try multiple approaches to trigger Google sign-in
                            try {
                                // First try the prompt method
                                google.accounts.id.prompt((notification) => {
                                    console.log('Google prompt notification:', notification);
                                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                                        console.log('Google One Tap not displayed, trying renderButton approach');
                                        this.fallbackToRenderButton();
                                    }
                                });
                            } catch (promptError) {
                                console.log('Google prompt failed, trying renderButton approach:', promptError);
                                this.fallbackToRenderButton();
                            }
                        });
                        
                        console.log('Google button event listener added');
                    }
                } catch (error) {
                    console.error('Error initializing Google OAuth:', error);
                }
            } else {
                // Retry if Google script not loaded yet
                console.log('Google script not ready, retrying...');
                setTimeout(initGoogle, 200);
            }
        };

        // Multiple initialization attempts
        setTimeout(initGoogle, 100);
        setTimeout(initGoogle, 500);
        setTimeout(initGoogle, 1000);
        
        // Also initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initGoogle, 100);
            });
        }
        
        // Listen for the Google script load event
        window.addEventListener('load', () => {
            setTimeout(initGoogle, 100);
        });
    }

    fallbackToRenderButton() {
        // Create a hidden div for Google's rendered button
        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'googleButtonContainer';
        hiddenContainer.style.position = 'absolute';
        hiddenContainer.style.left = '-9999px';
        hiddenContainer.style.top = '-9999px';
        document.body.appendChild(hiddenContainer);

        try {
            google.accounts.id.renderButton(hiddenContainer, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                width: 250
            });

            // Trigger click on the hidden Google button
            setTimeout(() => {
                const googleRenderedBtn = hiddenContainer.querySelector('[role="button"]');
                if (googleRenderedBtn) {
                    googleRenderedBtn.click();
                } else {
                    console.log('Could not find rendered Google button, opening OAuth URL directly');
                    this.openGoogleOAuthDirectly();
                }
            }, 100);
        } catch (error) {
            console.error('Fallback render button failed:', error);
            this.openGoogleOAuthDirectly();
        }
    }

    openGoogleOAuthDirectly() {
        const GOOGLE_CLIENT_ID = '528620317376-j0v8n7304obhb8vfag8upeqhitmoeoih.apps.googleusercontent.com';
        const redirectUri = window.location.origin + '/signin.html';
        const scope = 'openid email profile';
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(scope)}&` +
            `access_type=offline&` +
            `prompt=select_account`;
        
        console.log('Opening Google OAuth URL directly:', authUrl);
        window.location.href = authUrl;
    }

    handleGoogleSignIn(response) {
        const credential = response.credential;
        const payload = this.parseJwt(credential);
        
        const userProfile = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            provider: 'google',
            authenticated: true
        };

        this.saveUserProfile(userProfile);
        
        // Clear the Google login requirement flag
        localStorage.removeItem('requireGoogleLogin');
        
        this.redirectToApp();
    }

    handleGuestLogin() {
        const requireGoogleLogin = localStorage.getItem('requireGoogleLogin');
        
        if (requireGoogleLogin === 'true') {
            this.showGoogleRequiredModal();
            return;
        }
        
        this.showGuestWarningModal();
    }

    disableGuestOption() {
        const guestBtn = document.getElementById('continueAsGuest');
        if (guestBtn) {
            guestBtn.disabled = true;
            guestBtn.style.opacity = '0.5';
            guestBtn.style.cursor = 'not-allowed';
            guestBtn.querySelector('span').textContent = 'Google Sign-in Required';
        }

        // Add notice
        const signInForm = document.querySelector('.signin-form');
        if (signInForm && !document.getElementById('googleRequiredNotice')) {
            const notice = document.createElement('div');
            notice.id = 'googleRequiredNotice';
            notice.innerHTML = `
                <div class="google-required-notice">
                    <i class="fas fa-info-circle"></i>
                    <span>Google sign-in is required after logging out as a guest</span>
                </div>
            `;
            signInForm.appendChild(notice);
        }
    }

    showGoogleRequiredModal() {
        const modalHtml = `
            <div class="google-required-overlay" id="googleRequiredOverlay">
                <div class="google-required-modal">
                    <div class="required-icon">
                        <i class="fab fa-google"></i>
                    </div>
                    <h2>Google Sign-in Required</h2>
                    <div class="required-content">
                        <p>You previously used guest access and logged out.</p>
                        <p>To continue using Alice AI, you must sign in with Google.</p>
                        <p>This ensures your data is secure and conversations are saved.</p>
                    </div>
                    <div class="required-actions">
                        <button class="required-btn" id="signInWithGoogle">
                            <i class="fab fa-google"></i>
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const overlay = document.getElementById('googleRequiredOverlay');
        const modal = overlay.querySelector('.google-required-modal');

        // Animate modal
        gsap.set(overlay, { opacity: 0 });
        gsap.set(modal, { scale: 0.8, opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        gsap.to(modal, { 
            scale: 1, 
            opacity: 1, 
            duration: 0.4, 
            ease: "back.out(1.7)" 
        });

        document.getElementById('signInWithGoogle').addEventListener('click', () => {
            overlay.remove();
            google.accounts.id.prompt();
        });
    }

    showGuestWarningModal() {
        // Create warning modal
        const modalHtml = `
            <div class="guest-warning-overlay" id="guestWarningOverlay">
                <div class="guest-warning-modal">
                    <div class="warning-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Guest Access Warning</h2>
                    <div class="warning-content">
                        <p><strong>Important Notice:</strong></p>
                        <ul>
                            <li>Guest access is limited to <strong>1 hour only</strong></li>
                            <li>You will be automatically logged out after 1 hour</li>
                            <li>All conversation history will be lost</li>
                            <li>You must sign in with Google to continue using the app</li>
                        </ul>
                        <p>For the best experience, we recommend signing in with Google to save your conversations and settings.</p>
                    </div>
                    <div class="warning-actions">
                        <button class="warning-btn cancel-btn" id="cancelGuest">
                            <i class="fab fa-google"></i>
                            Sign in with Google Instead
                        </button>
                        <button class="warning-btn confirm-btn" id="confirmGuest">
                            <i class="fas fa-clock"></i>
                            Continue as Guest (1 hour)
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const overlay = document.getElementById('guestWarningOverlay');
        const modal = overlay.querySelector('.guest-warning-modal');

        // Animate modal appearance
        gsap.set(overlay, { opacity: 0 });
        gsap.set(modal, { scale: 0.8, opacity: 0 });

        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        gsap.to(modal, { 
            scale: 1, 
            opacity: 1, 
            duration: 0.4, 
            ease: "back.out(1.7)",
            delay: 0.1 
        });

        // Event listeners
        document.getElementById('cancelGuest').addEventListener('click', () => {
            this.closeGuestWarning();
            // Trigger Google sign-in
            google.accounts.id.prompt();
        });

        document.getElementById('confirmGuest').addEventListener('click', () => {
            this.closeGuestWarning();
            this.proceedWithGuestLogin();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeGuestWarning();
            }
        });
    }

    closeGuestWarning() {
        const overlay = document.getElementById('guestWarningOverlay');
        const modal = overlay.querySelector('.guest-warning-modal');

        gsap.to(modal, { 
            scale: 0.8, 
            opacity: 0, 
            duration: 0.3, 
            ease: "power2.in" 
        });
        gsap.to(overlay, { 
            opacity: 0, 
            duration: 0.3,
            onComplete: () => {
                overlay.remove();
            }
        });
    }

    proceedWithGuestLogin() {
        const loginTime = Date.now();
        const userProfile = {
            name: 'Guest User',
            email: 'guest@example.com',
            picture: '',
            provider: 'guest',
            authenticated: true,
            loginTime: loginTime,
            expiresAt: loginTime + (60 * 60 * 1000) // 1 hour from now
        };

        this.saveUserProfile(userProfile);
        this.redirectToApp();
    }

    saveUserProfile(profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
    }

    checkExistingAuth() {
        const userProfile = localStorage.getItem('userProfile');
        const requireGoogleLogin = localStorage.getItem('requireGoogleLogin');
        
        // If Google login is required (user previously logged out as guest), disable guest option
        if (requireGoogleLogin === 'true') {
            this.disableGuestOption();
        }
        
        if (userProfile) {
            const profile = JSON.parse(userProfile);
            if (profile.authenticated) {
                // User is already authenticated, redirect to app
                this.redirectToApp();
            }
        }
    }

    redirectToApp() {
        // Show loading animation
        const card = document.querySelector('.signin-card');
        
        gsap.to(card, {
            scale: 0.95,
            opacity: 0,
            duration: 0.5,
            ease: "power2.in",
            onComplete: () => {
                window.location.href = 'index.html';
            }
        });
    }

    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }
}

// Initialize the sign-in manager
document.addEventListener('DOMContentLoaded', () => {
    new SignInManager();
});
