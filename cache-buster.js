// Cache buster for GitHub Pages
// This forces the browser to reload all resources

(function() {
    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }
    
    // Force reload if old version detected
    const currentVersion = '3.0';
    const storedVersion = localStorage.getItem('gameVersion');
    
    if (storedVersion && storedVersion !== currentVersion) {
        localStorage.setItem('gameVersion', currentVersion);
        // Force hard reload
        location.reload(true);
    } else if (!storedVersion) {
        localStorage.setItem('gameVersion', currentVersion);
    }
    
    // Add timestamp to prevent caching during development
    console.log('Game Version:', currentVersion, 'Loaded at:', new Date().toISOString());
})();