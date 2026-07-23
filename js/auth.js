// TAGGER PRO V6 - Authentication & Permissions

// ====== دوال الصلاحيات ======
function canEdit() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin;
}

function canViewInventory() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'cashier';
}

function canViewMaintenance() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'technician' || userRole === 'cashier';
}

function canEditMaintenance() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'technician' || userRole === 'cashier';
}

function canViewInvoices() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'cashier' || userRole === 'supervisor';
}

function canViewFinance() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin;
}

function canViewSuppliers() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin;
}

function canViewShifts() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'cashier';
}

function requireShift() {
    if (!currentShift) {
        showToast('⚠️ يجب فتح ورديه اولاً من قسم الورديات', 'error');
        return false;
    }
    return true;
}

function canViewUsers() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin;
}

function canViewReports() {
    return userRole === 'admin' || userRole === 'super_admin' || isSuperAdmin || userRole === 'supervisor' || userRole === 'cashier';
}

function showToastPermission() {
    showToast('⛔ غير مصرح لك بهذه العملية!', 'error');
}

function applyPermissions() {
    // أزرار الإضافة والتعديل في المخزن - فقط Admin و Super Admin
    const btnAddProduct = document.getElementById('btnAddProduct');
    const btnAddProductFull = document.getElementById('btnAddProductFull');
    const btnAddCategory = document.getElementById('btnAddCategory');
    
    if (!canEdit()) {
        if (btnAddProduct) btnAddProduct.style.display = 'none';
        if (btnAddProductFull) btnAddProductFull.style.display = 'none';
        if (btnAddCategory) btnAddCategory.style.display = 'none';
        // إخفاء أزرار التعديل والحذف في جدول المخزن
        document.querySelectorAll('#inventoryTableBody .bg-blue-600\\/20, #inventoryTableBody .bg-red-600\\/20').forEach(el => {
            el.parentElement.style.display = 'none';
        });
    }

    // الصيانة - فقط Admin و Super Admin و Technician
    const btnMaintenance = document.getElementById('btnMaintenance');
    if (btnMaintenance && !canViewMaintenance()) {
        btnMaintenance.style.display = 'none';
    }

    // الفواتير - الكل يشوفها
    const btnInvoices = document.getElementById('btnInvoices');
    if (btnInvoices && !canViewInvoices()) {
        btnInvoices.style.display = 'none';
    }

    // المالية - فقط Admin و Super Admin
    const btnFinance = document.getElementById('btnFinance');
    if (btnFinance && !canViewFinance()) {
        btnFinance.style.display = 'none';
    }

    // الموردين - فقط Admin و Super Admin
    const btnSuppliers = document.getElementById('btnSuppliers');
    if (btnSuppliers && !canViewSuppliers()) {
        btnSuppliers.style.display = 'none';
    }

    // الورديات - فقط Admin و Super Admin
    const btnShifts = document.getElementById('btnShifts');
    if (btnShifts && !canViewShifts()) {
        btnShifts.style.display = 'none';
    }

    // المستخدمين - فقط Admin و Super Admin
    const btnUsers = document.getElementById('btnUsers');
    if (btnUsers && !canViewUsers()) {
        btnUsers.style.display = 'none';
    }

    // التقارير - Admin, Super Admin, Supervisor
    const btnReports = document.getElementById('btnReports');
    if (btnReports && !canViewReports()) {
        btnReports.style.display = 'none';
    }

    // المخزن - الكاشير يشوف بس (مش بيعدل)
    const btnInventory = document.getElementById('btnInventory');
    if (btnInventory && !canViewInventory()) {
        btnInventory.style.display = 'none';
    }

    // الفروع - Super Admin فقط
    const btnBranches = document.getElementById('btnBranches');
    if (btnBranches) {
        btnBranches.style.display = isSuperAdmin ? '' : 'none';
    }

    // الضريبة - Admin و Super Admin فقط
    const btnVatSettings = document.getElementById('btnVatSettings');
    if (btnVatSettings) {
        btnVatSettings.style.display = (userRole === 'admin' || isSuperAdmin) ? '' : 'none';
    }
}

async function logout() {
    const confirmed = await showConfirm('تسجيل الخروج؟', 'خروج', { warning: true });
    if(confirmed) {
        logActivity('خروج', `المستخدم: ${localStorage.getItem('active_staff_name') || 'غير معروف'}`, 'auth');
        try { await sb.auth.signOut(); } catch(e) {}
        localStorage.removeItem('active_store_id');
        localStorage.removeItem('active_username');
        localStorage.removeItem('active_staff_name');
        localStorage.removeItem('active_staff_role');
        localStorage.removeItem('is_super_admin');
        window.location.href = "index.html";
    }
}

// ====== إدارة المستخدمين ======
async function loadUsersData() {
    try {
        let local = await SmartLoader.getLocalData('users');
        users = local.filter(u => u.store_id === currentStoreId);
        if (users.length === 0 && SyncManager.isOnline) {
            await SmartLoader.syncTable('users', currentStoreId, true);
            local = await SmartLoader.getLocalData('users');
            users = local.filter(u => u.store_id === currentStoreId);
        }
        const currentUsername = localStorage.getItem('active_username') || 'admin';
        currentUserData = users.find(u => u.username === currentUsername);
        if(currentUserData) {
            document.getElementById('currentUserDisplay').innerText = currentUserData.full_name;
            document.getElementById('currentUserRoleDisplay').innerText = getRoleLabel(currentUserData.role);
        }
        renderUsersTable();
        if (SyncManager.isOnline) {
            SmartLoader.syncTable('users', currentStoreId).then(synced => {
                if (synced.length > 0) {
                    SmartLoader.getLocalData('users').then(full => {
                        users = full.filter(u => u.store_id === currentStoreId);
                        currentUserData = users.find(u => u.username === currentUsername);
                        renderUsersTable();
                    });
                }
            });
        }
    } catch(err) {
        console.error('خطأ في تحميل المستخدمين:', err);
    }
}

function getRoleLabel(role) {
    const labels = { 'admin': '👑 مدير', 'cashier': '💵 كاشير', 'technician': '🔧 فني', 'supervisor': '👁️ مشرف' };
    return labels[role] || role;
}

function getRoleColor(role) {
    const colors = { 'admin': 'text-purple-400', 'cashier': 'text-emerald-400', 'technician': 'text-blue-400', 'supervisor': 'text-amber-400' };
    return colors[role] || 'text-slate-400';
}

function openUsers() {
    if (!canViewUsers()) { showToastPermission(); return; }
    document.getElementById('usersTab').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderUsersTable();
}

function closeUsers() {
    document.getElementById('usersTab').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const emptyMsg = document.getElementById('emptyUsers');
    if(!tbody) return;
    if(users.length === 0) { tbody.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
    emptyMsg.classList.add('hidden');
    tbody.innerHTML = users.map((u, index) => {
        const isCurrent = u.username === (currentUserData ? currentUserData.username : '');
        return `
            <tr class="border-b border-slate-800/60 hover:bg-slate-800/20 transition ${isCurrent ? 'bg-blue-950/20' : ''}">
                <td class="p-3">${index + 1}</td>
                <td class="p-3 font-bold text-slate-200">${u.username} ${isCurrent ? '⭐' : ''}</td>
                <td class="p-3 text-slate-300">${u.full_name}</td>
                <td class="p-3 text-center ${getRoleColor(u.role)}">${getRoleLabel(u.role)}</td>
                <td class="p-3 text-center ${u.is_active ? 'text-emerald-400' : 'text-red-400'}">${u.is_active ? '✅ مفعل' : '⛔ موقوف'}</td>
                <td class="p-3 text-center text-slate-400 text-[10px]">${new Date(u.created_at).toLocaleString('ar-EG')}</td>
                <td class="p-3 text-center">
                    ${currentUserData && currentUserData.role === 'admin' && u.username !== 'admin' ? `
                        <button onclick="editUser('${u.id}')" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteUser('${u.id}')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                    ${isCurrent ? `<button onclick="openChangePassword('${u.id}')" class="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-2 py-1 rounded-lg text-[10px] transition"><i class="fa-solid fa-key"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function openAddUserModal() {
    if (!canEdit()) { showToastPermission(); return; }
    document.getElementById('userModalTitle').innerText = 'إضافة مستخدم جديد';
    document.getElementById('editUserId').value = '';
    document.getElementById('userUsername').value = '';
    document.getElementById('userFullName').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = 'cashier';
    document.getElementById('userActive').checked = true;
    document.getElementById('userModal').classList.remove('hidden');
}

function editUser(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const user = users.find(u => u.id === id);
    if(!user) return;
    document.getElementById('userModalTitle').innerText = 'تعديل المستخدم';
    document.getElementById('editUserId').value = id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userFullName').value = user.full_name;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('userActive').checked = user.is_active;
    document.getElementById('userModal').classList.remove('hidden');
}

async function saveUser() {
    if (!canEdit()) { showToastPermission(); return; }
    const username = document.getElementById('userUsername').value.trim();
    const fullName = document.getElementById('userFullName').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const isActive = document.getElementById('userActive').checked;
    const editId = document.getElementById('editUserId').value;
    if(!username || !fullName) { showToast('⚠️ يرجى ملء جميع الحقول', 'error'); return; }
    if(!editId && !password) { showToast('⚠️ يرجى إدخال كلمة المرور', 'error'); return; }
    if(users.find(u => u.username === username && u.id !== editId)) { showToast('⚠️ اسم المستخدم موجود بالفعل', 'error'); return; }
    try {
        if(editId) {
            const updateData = { username, full_name: fullName, role, is_active: isActive };
            if(password) updateData.password = password;
            await sb.from('users').update(updateData).eq('id', editId);
        } else {
            await sb.from('users').insert([{
                store_id: currentStoreId,
                username: username,
                full_name: fullName,
                password: password,
                role: role,
                is_active: isActive
            }]);
        }
        closeModal('userModal');
        await loadUsersData();
        showToast(editId ? '✅ تم تحديث المستخدم' : '✅ تم إضافة المستخدم', 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

async function deleteUser(id) {
    if (!canEdit()) { showToastPermission(); return; }
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذا المستخدم؟', 'حذف المستخدم', { danger: true });
    if(!confirmed) return;
    try {
        await sb.from('users').delete().eq('id', id);
        users = users.filter(u => u.id !== id);
        renderUsersTable();
        showToast('🗑️ تم حذف المستخدم', 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}

function openChangePassword(id) {
    document.getElementById('changePasswordUserId').value = id;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('changePasswordModal').classList.remove('hidden');
}

async function saveNewPassword() {
    const id = document.getElementById('changePasswordUserId').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    if(!newPass || newPass.length < 4) { showToast('⚠️ كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error'); return; }
    if(newPass !== confirmPass) { showToast('⚠️ كلمة المرور غير متطابقة', 'error'); return; }
    try {
        await sb.from('users').update({ password: newPass }).eq('id', id);
        closeModal('changePasswordModal');
        showToast('✅ تم تغيير كلمة المرور بنجاح', 'success');
    } catch(err) {
        showToast('❌ خطأ: ' + err.message, 'error');
    }
}
