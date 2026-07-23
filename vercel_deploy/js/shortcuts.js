function openShortcutsHelp() {
    openModal('shortcutsModal');
}

function initShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        switch(e.key) {
            case '?':
                e.preventDefault();
                openModal('shortcutsModal');
                break;
            case 'F2':
                e.preventDefault();
                holdCurrentInvoice();
                break;
            case 'F3':
                e.preventDefault();
                openAddCustomerModal();
                break;
            case 'F4':
                e.preventDefault();
                const bc = document.getElementById('barcodeInput');
                if (bc) bc.focus();
                break;
            case 'F5':
                e.preventDefault();
                openCashWallet();
                break;
            case 'F6':
                e.preventDefault();
                openInvoices();
                break;
            case 'F7':
                e.preventDefault();
                if (typeof openZReport === 'function') openZReport();
                break;
            case 'F8':
                e.preventDefault();
                checkoutInvoice();
                break;
            case 'F9':
                e.preventDefault();
                openMaintenance();
                break;
            case 'F10':
                e.preventDefault();
                openReports();
                break;
            case 'F11':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                document.querySelectorAll('[id$="Tab"]:not(.hidden)').forEach(el => {
                    if (el.id === 'kioskModeBar') exitKioskMode();
                    else closeModal(el.id);
                });
                document.querySelectorAll('[class*="fixed"][class*="z-"]').forEach(el => {
                    if (el.classList.contains('hidden')) return;
                    const id = el.id;
                    if (id && id !== 'kioskModeBar') closeModal(id);
                });
                break;
        }
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(){});
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('DOMContentLoaded', initShortcuts);
