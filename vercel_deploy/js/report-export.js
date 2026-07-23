let _currentReportExportElement = null;

function openReportExport(elementId) {
    _currentReportExportElement = elementId;
    openModal('reportExportModal');
}

async function exportReportAs(format) {
    const element = _currentReportExportElement ? document.getElementById(_currentReportExportElement) : document.querySelector('.main-content');
    if (!element) { showToast('لا يوجد محتوى للتصدير', 'error'); closeModal('reportExportModal'); return; }

    try {
        if (format === 'image') {
            await exportAsImage(element);
        } else if (format === 'pdf') {
            await exportAsPdf(element);
        } else if (format === 'csv') {
            exportAsCsv();
        }
    } catch(e) {
        showToast('حدث خطأ أثناء التصدير', 'error');
    }
    closeModal('reportExportModal');
}

async function exportAsImage(element) {
    try {
        if (typeof html2canvas === 'undefined') {
            await loadScript('vendor/html2canvas.min.js');
        }
        const canvas = await html2canvas(element, { backgroundColor: '#1e1b4b', scale: 2 });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toISOString().split('T')[0]}.png`;
        a.click();
        showToast('🖼️ تم حفظ الصورة', 'success');
    } catch(e) {
        showToast('خطأ في تصدير الصورة', 'error');
    }
}

async function exportAsPdf(element) {
    try {
        if (typeof html2canvas === 'undefined') {
            await loadScript('vendor/html2canvas.min.js');
        }
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            await loadScript('vendor/jspdf.umd.min.js');
        }
        const canvas = await html2canvas(element, { backgroundColor: '#1e1b4b', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (window.jspdf?.jsPDF || window.jsPDF)({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('📄 تم حفظ التقرير كـ PDF', 'success');
    } catch(e) {
        showToast('خطأ في تصدير PDF', 'error');
    }
}

function exportAsCsv() {
    let csv = '\uFEFF';
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) { showToast('لا توجد جداول للتصدير', 'error'); return; }

    tables.forEach((table, idx) => {
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push('"' + th.textContent.trim().replace(/"/g, '""') + '"');
        });
        csv += headers.join(',') + '\n';

        table.querySelectorAll('tbody tr').forEach(tr => {
            const cells = [];
            tr.querySelectorAll('td').forEach(td => {
                cells.push('"' + td.textContent.trim().replace(/"/g, '""') + '"');
            });
            if (cells.length > 0) csv += cells.join(',') + '\n';
        });
        csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 تم تصدير CSV', 'success');
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
