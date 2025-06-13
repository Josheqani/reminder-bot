require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-jalaali');
const cron = require('node-cron');

// Initialize bot with token from environment variables
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Parse dates from environment variables
const startDate = moment(process.env.START_DATE, 'jYYYY/jMM/jDD');
const endDate = moment(process.env.END_DATE, 'jYYYY/jMM/jDD');
const projectTitle = process.env.PROJECT_TITLE;

// Persian day names
const persianDays = {
    0: 'یکشنبه',
    1: 'دوشنبه',
    2: 'سه‌شنبه',
    3: 'چهارشنبه',
    4: 'پنج‌شنبه',
    5: 'جمعه',
    6: 'شنبه'
};

// Persian month names
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

// Function to convert English numbers to Persian
function toPersianNumber(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, function(w) {
        return persianDigits[+w];
    });
}

// Function to calculate remaining days
function getRemainingDays() {
    return endDate.diff(moment(), 'days');
}

// Function to format date in Persian calendar with day and month names
function formatPersianDate(date) {
    const dayName = persianDays[date.day()];
    const monthName = persianMonths[date.jMonth() + 1];
    return `${dayName}، ${toPersianNumber(date.jDate())} ${monthName} ${toPersianNumber(date.jYear())}`;
}

// Function to get current date in Persian
function getCurrentPersianDate() {
    const now = moment();
    return formatPersianDate(now);
}

// Function to send reminder message
async function sendReminder(chatId) {
    const remainingDays = getRemainingDays();
    const currentDate = getCurrentPersianDate();
    const message = `🎯 *وضعیت پروژه*\n\n` +
                   `📅 *امروز:* ${currentDate}\n\n` +
                   `⏳ *${toPersianNumber(remainingDays)} روز تا پایان پروژه*\n` +
                   `📌 *${projectTitle}*\n\n` +
                   `📊 *جزئیات زمان‌بندی:*\n` +
                   `📅 *شروع:* ${formatPersianDate(startDate)}\n` +
                   `🎯 *پایان:* ${formatPersianDate(endDate)}`;
    
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('خطا در ارسال پیام:', error);
    }
}

// Store active chat IDs
const activeChats = new Set();

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    activeChats.add(chatId);
    const welcomeMessage = `🌟 *به ربات یادآوری پروژه خوش آمدید!*\n\n` +
                          `📌 من هر روز در مورد پروژه "${projectTitle}" یادآوری ارسال خواهم کرد.\n\n` +
                          `💡 برای مشاهده وضعیت فعلی از دستور /status استفاده کنید.`;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    sendReminder(chatId);
});

// Schedule daily reminder at 12 AM
cron.schedule('0 0 * * *', () => {
    activeChats.forEach(chatId => {
        sendReminder(chatId);
    });
});

// Handle bot being added to a group
bot.on('new_chat_members', (msg) => {
    if (msg.new_chat_members.some(member => member.username === bot.options.username)) {
        const chatId = msg.chat.id;
        activeChats.add(chatId);
        const groupWelcomeMessage = `🌟 *سلام! به گروه خوش آمدید!*\n\n` +
                                  `📌 من هر روز در مورد پروژه "${projectTitle}" یادآوری ارسال خواهم کرد.\n\n` +
                                  `💡 برای مشاهده وضعیت فعلی از دستور /status استفاده کنید.`;
        bot.sendMessage(chatId, groupWelcomeMessage, { parse_mode: 'Markdown' });
    }
});

// Handle bot being removed from a group
bot.on('left_chat_member', (msg) => {
    if (msg.left_chat_member.username === bot.options.username) {
        activeChats.delete(msg.chat.id);
    }
});

console.log('bot is running...'); 