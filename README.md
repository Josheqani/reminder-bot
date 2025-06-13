# Project Reminder Bot

A Telegram bot that sends daily reminders about project deadlines using the Persian calendar.

## Features

- Daily reminders at 12 AM
- Persian calendar support
- Project start and end date tracking
- Remaining days calculation
- Group chat support
- Manual status check command

## Setup

1. Create a new Telegram bot using [@BotFather](https://t.me/botfather) and get your bot token

2. Create a `.env` file in the project root with the following variables:
```
BOT_TOKEN=your_telegram_bot_token_here
PROJECT_TITLE=your_project_title_here
START_DATE=1402/12/01  # Format: YYYY/MM/DD in Persian calendar
END_DATE=1403/01/01    # Format: YYYY/MM/DD in Persian calendar
```

3. Install dependencies:
```bash
npm install
```

4. Start the bot:
```bash
npm start
```

## Usage

1. Add the bot to your Telegram group
2. The bot will automatically start sending daily reminders at 12 AM
3. Use `/status` command to check the current status and remaining days
4. Use `/start` command to start receiving reminders in private chat

## Commands

- `/start` - Start receiving reminders
- `/status` - Check current project status and remaining days 