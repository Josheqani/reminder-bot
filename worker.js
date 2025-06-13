// Import required dependencies
import moment from 'moment-jalaali';

// In-memory storage for active chats
const activeChats = new Set();

// Helper functions
const persianDays = {
    0: 'یکشنبه',
    1: 'دوشنبه',
    2: 'سه‌شنبه',
    3: 'چهارشنبه',
    4: 'پنج‌شنبه',
    5: 'جمعه',
    6: 'شنبه'
};

const persianMonths = {
    1: 'فروردین',
    2: 'اردیبهشت',
    3: 'خرداد',
    4: 'تیر',
    5: 'مرداد',
    6: 'شهریور',
    7: 'مهر',
    8: 'آبان',
    9: 'آذر',
    10: 'دی',
    11: 'بهمن',
    12: 'اسفند'
};

function toPersianNumber(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, function(w) {
        return persianDigits[+w];
    });
}

function getRemainingDays(endDate) {
    return endDate.diff(moment(), 'days');
}

function formatPersianDate(date) {
    const dayName = persianDays[date.day()];
    const monthName = persianMonths[date.jMonth() + 1];
    return `${dayName}، ${toPersianNumber(date.jDate())} ${monthName} ${toPersianNumber(date.jYear())}`;
}

function getCurrentPersianDate() {
    const now = moment();
    return formatPersianDate(now);
}

async function sendReminder(chatId, env) {
    const startDate = moment(env.START_DATE, 'jYYYY/jMM/jDD');
    const endDate = moment(env.END_DATE, 'jYYYY/jMM/jDD');
    const projectTitle = env.PROJECT_TITLE;
    
    const remainingDays = getRemainingDays(endDate);
    const currentDate = getCurrentPersianDate();
    const message = `🎯 *وضعیت پروژه*\n\n` +
                   `📅 *امروز:* ${currentDate}\n\n` +
                   `⏳ *${toPersianNumber(remainingDays)} روز تا پایان پروژه*\n` +
                   `📌 *${projectTitle}*\n\n` +
                   `📊 *جزئیات زمان‌بندی:*\n` +
                   `📅 *شروع:* ${formatPersianDate(startDate)}\n` +
                   `🎯 *پایان:* ${formatPersianDate(endDate)}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function handleCommand(command, chatId, env) {
    switch (command) {
        case '/start':
            const welcomeMessage = `🌟 *به ربات یادآوری پروژه خوش آمدید!*\n\n` +
                                 `📌 من هر روز در مورد پروژه "${env.PROJECT_TITLE}" یادآوری ارسال خواهم کرد.\n\n` +
                                 `💡 برای مشاهده وضعیت فعلی از دستور /status استفاده کنید.`;
            await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: welcomeMessage,
                    parse_mode: 'Markdown'
                })
            });
            activeChats.add(chatId);
            break;
            
        case '/status':
            await sendReminder(chatId, env);
            break;
    }
}

export default {
    async fetch(request, env, ctx) {
        if (request.method === 'POST') {
            const update = await request.json();
            
            // Handle commands
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                
                if (text.startsWith('/')) {
                    await handleCommand(text, chatId, env);
                }
            }
            
            // Handle new chat members
            if (update.message && update.message.new_chat_members) {
                const botUsername = env.BOT_USERNAME;
                if (update.message.new_chat_members.some(member => member.username === botUsername)) {
                    const chatId = update.message.chat.id;
                    const groupWelcomeMessage = `🌟 *سلام! به گروه خوش آمدید!*\n\n` +
                                              `📌 من هر روز در مورد پروژه "${env.PROJECT_TITLE}" یادآوری ارسال خواهم کرد.\n\n` +
                                              `💡 برای مشاهده وضعیت فعلی از دستور /status استفاده کنید.`;
                    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: groupWelcomeMessage,
                            parse_mode: 'Markdown'
                        })
                    });
                    activeChats.add(chatId);
                }
            }
            
            // Handle bot being removed
            if (update.message && update.message.left_chat_member) {
                const botUsername = env.BOT_USERNAME;
                if (update.message.left_chat_member.username === botUsername) {
                    activeChats.delete(update.message.chat.id);
                }
            }
            
            return new Response('OK', { status: 200 });
        }
        
        return new Response('Method not allowed', { status: 405 });
    },
    
    async scheduled(event, env, ctx) {
        // Send reminders to all active chats
        for (const chatId of activeChats) {
            await sendReminder(chatId, env);
        }
    }
}; 