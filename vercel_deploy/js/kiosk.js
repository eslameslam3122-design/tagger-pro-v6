let isKioskMode = false;

function enterKioskMode() {
    isKioskMode = true;
    const bar = document.getElementById('kioskModeBar');
    if (bar) bar.classList.remove('hidden');

    document.body.style.paddingTop = '40px';
    document.body.classList.add('kiosk-mode');

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggleBtn');
    if (sidebar) sidebar.classList.add('hidden');
    if (toggle) toggle.classList.add('hidden');

    const header = document.querySelector('header');
    if (header) header.style.display = 'none';

    try { document.documentElement.requestFullscreen(); } catch(e) {}

    logActivity('وضع العرض', 'تم تفعيل وضع العرض (Kiosk)', 'info');
    showToast('🖥️ وضع العرض — اضغط Esc للخروج', 'info');
}

function exitKioskMode() {
    isKioskMode = false;
    const bar = document.getElementById('kioskModeBar');
    if (bar) bar.classList.add('hidden');

    document.body.style.paddingTop = '0';
    document.body.classList.remove('kiosk-mode');

    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggleBtn');
    if (sidebar) sidebar.classList.remove('hidden');
    if (toggle) toggle.classList.remove('hidden');

    const header = document.querySelector('header');
    if (header) header.style.display = '';

    try { document.exitFullscreen(); } catch(e) {}

    logActivity('وضع العرض', 'تم إلغاء وضع العرض', 'info');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isKioskMode) {
        e.preventDefault();
        exitKioskMode();
    }
});
