// Internationalization module — English + Simplified Chinese
// Usage: import { t, getLang, setLang } from './i18n.js';

const STRINGS = {
    en: {
        // Intro / page chrome
        enterButton:    "Click Me and You'll Find Out Who I Am!!!",
        bigTitle:       "This is\nJohn Pan",
        closeButton:    "Close Page",
        back:           "Back",

        // Chatbox
        chatTitle:      "💬 Chat with John",
        chatGreeting:   "Hey! I'm John. Ask me anything about myself or this site!",
        chatPlaceholder:"Type a message...",

        // Cube labels & popup titles
        aboutMe:        "About Me",
        contactMe:      "Contact Me",
        linkedin:       "LinkedIn",
        email:          "Email",
        instagram:      "Instagram",
        snapchat:       "Snapchat",
        myTracks:       "My Tracks",
        myProjects:     "My Projects",
        recipes:        "Recipes",
        recipesTitle:   "Recipes & Ratings",
        games:          "Games",
        pong:           "PONG",
        pigGame:        "Pig Game with Dice",
        miniGame:       "My 3D Mini Game",
        snake:          "Snake",
        tictactoe:      "Tic Tac Toe",
        euchre:         "Euchre",
        combat:         "1D Combat",
        combatTitle:    "1D Combat Simulator",
        guessNumber:    "Guess #",
        guessNumberTitle:"Guess My Number",
    },
    zh: {
        // Intro / page chrome
        enterButton:    "点击，探索我的世界！！！",
        bigTitle:       "我是\n潘栋",
        closeButton:    "关闭页面",
        back:           "返回",

        // Chatbox
        chatTitle:      "💬 和潘栋聊天",
        chatGreeting:   "嘿！我是潘栋。有什么想问我的？",
        chatPlaceholder:"发送消息...",

        // Cube labels & popup titles
        aboutMe:        "关于我",
        contactMe:      "联系我",
        linkedin:       "领英",
        email:          "邮件",
        instagram:      "Instagram",
        snapchat:       "Snapchat",
        myTracks:       "我的音乐",
        myProjects:     "我的项目",
        recipes:        "菜谱",
        recipesTitle:   "菜谱与评分",
        games:          "游戏",
        pong:           "乒乓",
        pigGame:        "骰子猪游戏",
        miniGame:       "我的3D小游戏",
        snake:          "贪吃蛇",
        tictactoe:      "井字棋",
        euchre:         "尤克牌戏",
        combat:         "1D战斗",
        combatTitle:    "1D战斗模拟器",
        guessNumber:    "猜数字",
        guessNumberTitle:"猜猜我的数字",
    }
};

/** Return current language code ('en' or 'zh') */
export function getLang() {
    return localStorage.getItem('lang') || 'en';
}

/** Persist language choice */
export function setLang(lang) {
    localStorage.setItem('lang', lang);
}

/** Translate a key for the current language, falling back to English */
export function t(key) {
    const lang = getLang();
    return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}
