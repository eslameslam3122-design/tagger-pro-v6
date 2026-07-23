// Supabase Edge Function: receive-sms
// استقبال رسائل SMS من تطبيق الموبايل وتحويلها لعمليات كاش

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { store_id, wallet_id, message_text, sender } = await req.json();

        if (!store_id || !message_text) {
            return new Response(
                JSON.stringify({ error: 'store_id and message_text are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // محاولة تحديد المحفظة تلقائياً لو wallet_id مش مبعوت
        let resolvedWalletId = wallet_id || null;
        if (!resolvedWalletId) {
            const { data: walletRows } = await supabase
                .from('wallets')
                .select('id, name')
                .eq('store_id', store_id);
            if (walletRows && walletRows.length > 0) {
                const lowerMsg = message_text.toLowerCase();
                const walletKeywords = {
                    'فودافون': ['فودافون', 'vodafone', 'voda'],
                    'أورنج': ['أورنج', 'orange', 'اورنج'],
                    'اتصالات': ['اتصالات', 'etisalat', 'WE', ' dou'],
                    'انستاباي': ['انستاباي', 'instapay', 'insta'],
                    'فاليو': ['فاليو', 'valu', 'value'],
                    'بي تك': ['بي تك', 'btech', 'bt'],
                };
                for (const w of walletRows) {
                    const wNameLower = w.name.toLowerCase();
                    for (const [key, keywords] of Object.entries(walletKeywords)) {
                        if (wNameLower.includes(key) || keywords.some(kw => lowerMsg.includes(kw))) {
                            resolvedWalletId = w.id;
                            break;
                        }
                    }
                    if (resolvedWalletId) break;
                }
            }
        }

        // تحليل الرسالة
        const parsed = parseSmsMessage(message_text, sender);

        // إدراج العملية
        const { data, error } = await supabase
            .from('cash_transactions')
            .insert([{
                store_id,
                wallet_id: resolvedWalletId,
                transaction_type: parsed.type,
                amount: parsed.amount,
                client_phone: parsed.phone,
                fee: parsed.fee,
                profit: parsed.profit,
                notes: message_text,
                shift_id: null
            }])
            .select()
            .single();

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, transaction: data }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

// تحليل رسائل SMS
function parseSmsMessage(message: string, sender?: string) {
    const msg = message || '';

    // تحديد نوع العملية
    let type = 'deposit';
    if (msg.includes('تحويل') || msg.includes('سحب') || msg.includes('دفع')) {
        type = 'withdraw';
    }
    if (msg.includes('استلام') || msg.includes('إيداع') || msg.includes('تلقى')) {
        type = 'deposit';
    }

    // استخراج المبلغ
    let amount = 0;
    const amountPatterns = [
        /(?:مبلغ|بمبلغ|الamount)\s+([\d,\.]+)/i,
        /([\d,\.]+)\s*(?:جنيه|ج\.م|ج\.ه|LE)/i,
        /(?:تم\s+)?(?:استلام|إيداع|تحويل|سحب)\s+(?:مبلغ\s+)?([\d,\.]+)/,
        /([\d,\.]+)/  // fallback: أي رقم
    ];
    for (const pattern of amountPatterns) {
        const match = msg.match(pattern);
        if (match) {
            amount = parseFloat(match[1].replace(/,/g, ''));
            if (amount > 0) break;
        }
    }

    // استخراج رقم الهاتف
    let phone = '';
    const phoneMatch = msg.match(/(?:01[0-9]{9})/);
    if (phoneMatch) phone = phoneMatch[0];

    // حساب العمولة والربح تلقائياً
    let fee = 0;
    let profit = 0;
    if (amount > 0) {
        fee = Math.max(10, amount * 0.01);
        profit = fee * 0.6;
    }

    return { type, amount, phone, fee, profit };
}
