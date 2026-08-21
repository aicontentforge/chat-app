const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database("./chat.db");

console.log("Database path:", path.resolve("./chat.db"));

db.serialize(() => {

    // ================= USERS =================

    db.run(`
    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT UNIQUE NOT NULL,

        password TEXT NOT NULL,

        uniqueId TEXT UNIQUE,

        displayName TEXT,

        avatar TEXT,

        bio TEXT DEFAULT 'Hey there! I am using Chat App.',

        age INTEGER,

        gender TEXT,

        purpose TEXT,

        country TEXT,

        countryCode TEXT,

        state TEXT,

        city TEXT,

        latitude REAL,

        longitude REAL,

        discoverable INTEGER DEFAULT 1,

        categories TEXT DEFAULT '[]',

        joinedAt TEXT,

        pinnedChats TEXT DEFAULT '[]',

        lastSeen TEXT,

        totalDonated INTEGER DEFAULT 0,
        donorBadgeExpiresAt TEXT

    )
    `);

    // ---------- USERS MIGRATIONS ----------

    const userColumns = [

        "uniqueId TEXT UNIQUE",
        "displayName TEXT",
        "avatar TEXT",
        "bio TEXT DEFAULT 'Hey there! I am using Chat App.'",
        "age INTEGER",
        "gender TEXT",
        "purpose TEXT",
        "country TEXT",
        "countryCode TEXT",
        "state TEXT",
        "city TEXT",
        "latitude REAL",
        "longitude REAL",
        "discoverable INTEGER DEFAULT 1",
        "categories TEXT DEFAULT '[]'",
        "joinedAt TEXT",
        "pinnedChats TEXT DEFAULT '[]'",
        "lastSeen TEXT",
        "totalDonated INTEGER DEFAULT 0",
        "donorBadgeExpiresAt TEXT"

    ];

    userColumns.forEach(column => {

        db.run(
            `ALTER TABLE users ADD COLUMN ${column}`,
            err => {
                if (
                    err &&
                    !err.message.includes("duplicate column")
                ) {
                    console.log(err.message);
                }
            }
        );

    });

    // ================= DONATIONS =================

db.run(`
CREATE TABLE IF NOT EXISTS donations (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT NOT NULL,

    amountCents INTEGER NOT NULL,

    productId TEXT,

    purchaseToken TEXT UNIQUE,

    orderId TEXT,

    createdAt TEXT NOT NULL,
    verified INTEGER DEFAULT 0

)
`);

// ================= DONOR BADGE HISTORY =================

db.run(`
CREATE TABLE IF NOT EXISTS donor_badge_history (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT NOT NULL,

    badgeNumber INTEGER,

    enteredAt TEXT NOT NULL,

    leftAt TEXT,

    donorBadgeExpiresAt TEXT

)
`);

    // ================= MESSAGES =================

    db.run(`
    CREATE TABLE IF NOT EXISTS messages (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sender TEXT NOT NULL,

        receiver TEXT NOT NULL,

        message TEXT,

        image TEXT,

        audio TEXT,

        file TEXT,

        fileName TEXT,

        time TEXT NOT NULL,

        seen INTEGER DEFAULT 0,

        reaction TEXT DEFAULT NULL,

        replyTo INTEGER,

        edited INTEGER DEFAULT 0,

        editedTime TEXT,

        pinned INTEGER DEFAULT 0

    )
    `);

    const messageColumns = [

        "reaction TEXT DEFAULT NULL",
        "replyTo INTEGER",
        "edited INTEGER DEFAULT 0",
        "editedTime TEXT",
        "pinned INTEGER DEFAULT 0"

    ];

    messageColumns.forEach(column => {

        db.run(
            `ALTER TABLE messages ADD COLUMN ${column}`,
            err => {
                if (
                    err &&
                    !err.message.includes("duplicate column")
                ) {
                    console.log(err.message);
                }
            }
        );

    });

    // ================= REPORTS =================

    db.run(`
    CREATE TABLE IF NOT EXISTS reports (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        reporter TEXT NOT NULL,

        reported TEXT NOT NULL,

        reason TEXT DEFAULT 'Abusive behaviour',

        createdAt TEXT

    )
    `);

    // ================= MUTED =================

    db.run(`
    CREATE TABLE IF NOT EXISTS muted_chats (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        username TEXT,

        mutedUser TEXT,

        muted INTEGER DEFAULT 1,

        UNIQUE(username, mutedUser)

    )
    `);

    // ================= BLOCKED =================

    db.run(`
    CREATE TABLE IF NOT EXISTS blocked_users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        blocker TEXT NOT NULL,

        blocked TEXT NOT NULL,

        createdAt TEXT

    )
    `);

    // ================= GROUPS =================

    db.run(`
    CREATE TABLE IF NOT EXISTS groups (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        avatar TEXT,

        createdBy TEXT,

        createdAt TEXT

    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS group_members (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        groupId INTEGER NOT NULL,

        username TEXT NOT NULL,

        role TEXT DEFAULT 'member'

    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS group_messages (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        groupId INTEGER NOT NULL,

        sender TEXT NOT NULL,

        message TEXT,

        image TEXT,

        audio TEXT,

        file TEXT,

        fileName TEXT,

        replyTo INTEGER,

        reaction TEXT DEFAULT NULL,

        edited INTEGER DEFAULT 0,

        pinned INTEGER DEFAULT 0,

        time TEXT

    )
    `);

    // ================= GLOBAL CHAT POSTS =================

// ================= GLOBAL CHAT POSTS =================

// ================= GLOBAL CHAT POSTS =================

db.run(`
CREATE TABLE IF NOT EXISTS global_posts (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    authorId TEXT NOT NULL,

    text TEXT DEFAULT '',

    imageUrl TEXT,

    createdAt TEXT NOT NULL,

    likedBy TEXT DEFAULT '[]',

    mentions TEXT DEFAULT '[]',

    status TEXT DEFAULT 'active'

)
`);

// ---------- GLOBAL POSTS MIGRATION ----------

db.run(
    `ALTER TABLE global_posts ADD COLUMN status TEXT DEFAULT 'active'`,
    err => {
        if (
            err &&
            !err.message.includes("duplicate column")
        ) {
            console.log(err.message);
        }
    }
);



// ================= GLOBAL POST MIGRATIONS =================

db.run(`
    ALTER TABLE global_posts
    ADD COLUMN status TEXT DEFAULT 'active'
`, err => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err.message);
    }

});

// ================= GLOBAL CHAT COMMENTS =================

// ================= GLOBAL CHAT COMMENTS =================

// ================= GLOBAL CHAT COMMENTS =================

// ================= GLOBAL CHAT COMMENTS =================

db.run(`
CREATE TABLE IF NOT EXISTS global_comments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    postId INTEGER NOT NULL,

    authorId TEXT NOT NULL,

    text TEXT NOT NULL,

    createdAt TEXT NOT NULL,

    mentions TEXT DEFAULT '[]',

    status TEXT DEFAULT 'active'

)
`);


// ---------- GLOBAL COMMENTS MIGRATION ----------

db.run(
    `ALTER TABLE global_comments ADD COLUMN status TEXT DEFAULT 'active'`,
    err => {
        if (
            err &&
            !err.message.includes("duplicate column")
        ) {
            console.log(err.message);
        }
    }
);
// ================= GLOBAL COMMENT MIGRATIONS =================

db.run(`
    ALTER TABLE global_comments
    ADD COLUMN status TEXT DEFAULT 'active'
`, err => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err.message);
    }

});

// ================= GLOBAL CHAT REPORTS =================

// ================= GLOBAL CHAT REPORTS =================

db.run(`
CREATE TABLE IF NOT EXISTS global_reports (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    postId INTEGER,

    commentId INTEGER,

    reporterId TEXT NOT NULL,

    reason TEXT NOT NULL,

    createdAt TEXT NOT NULL

)
`);

// ================= GLOBAL CHAT HIDDEN ITEMS =================

db.run(`
CREATE TABLE IF NOT EXISTS global_hidden_items (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    reporterId TEXT NOT NULL,

    postId INTEGER,

    commentId INTEGER,

    createdAt TEXT NOT NULL

)
`);

});

module.exports = db;