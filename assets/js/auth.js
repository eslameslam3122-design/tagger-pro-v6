// ============================================================
// AUTH - دوال المصادقة وإدارة المستخدمين
// ============================================================

import { supabase, getSession, signIn, signOut, verifyStaff } from './supabase.js';
import { STATE, updateState } from './config.js';
import { showToast } from './utils.js';

// ============================================================
// تسجيل دخول المستخدمين (من صفحة index.html)
// ============================================================
export async function handleStaffLogin(username, password) {
    try {
        const session = await getSession();
        if (!session) {
            showToast('⚠️ يجب تفعيل اتصال السيرفر أولاً', 'error');
            return false;
        }

        const storeId = session.user.id;
        const staff = await verifyStaff(username, password, storeId);
        
        if (!staff) {
            showToast('❌ اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            return false;
        }

        // حفظ بيانات المستخدم
        localStorage.setItem('active_staff_role', staff.role);
        localStorage.setItem('active_staff_name', staff.name);
        localStorage.setItem('active_staff_id', staff.id);
        
        updateState({
            userRole: staff.role,
            staffName: staff.name,
            currentStoreId: storeId
        });

        showToast(`👋 مرحباً بك يا ${staff.name}`, 'success');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
    }
}

// ============================================================
// تفعيل السيرفر (للمالك)
// ============================================================
export async function activateServer(email, password) {
    try {
        const { user } = await signIn(email, password);
        const storeId = user.id;
        
        // إنشاء سجل المتجر إذا لم يكن موجوداً
        await supabase
            .from('stores')
            .upsert([{ 
                id: storeId, 
                store_name: 'Tagger Pro المحل الرئيسي' 
            }]);
        
        updateState({ currentStoreId: storeId });
        showToast('🟢 تم تفعيل السيرفر بنجاح!', 'success');
        return true;
    } catch (error) {
        showToast('❌ فشل التفعيل: ' + error.message, 'error');
        return false;
    }
}

// ============================================================
// تسجيل الخروج
// ============================================================
export function logout() {
    localStorage.clear();
    signOut();
    window.location.href = 'index.html';
}

// ============================================================
// التحقق من الصلاحيات
// ============================================================
export function checkPermission(allowedRoles) {
    return allowedRoles.includes(STATE.userRole);
}

// ============================================================
// تطبيق صلاحيات الواجهة
// ============================================================
export function applyRolePermissions() {
    if (STATE.userRole === 'cashier') {
        const hiddenTabs = ['products', 'customers', 'dashboard'];
        hiddenTabs.forEach(tab => {
            const btn = document.getElementById(`btn-${tab}`);
            if (btn) btn.style.display = 'none';
        });
        // توجيه الكاشير مباشرة للبيع
        switchTab('pos');
    }
}

// ============================================================
// تحميل بيانات المستخدم من localStorage
// ============================================================
export function loadUserFromStorage() {
    const role = localStorage.getItem('active_staff_role');
    const name = localStorage.getItem('active_staff_name');
    const id = localStorage.getItem('active_staff_id');
    
    if (role && name) {
        updateState({
            userRole: role,
            staffName: name,
            staffId: id
        });
        return true;
    }
    return false;
}