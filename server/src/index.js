'use strict';

const express = require("express");
const app = express();

const bcrypt = require("bcrypt");

require('dotenv').config();
const PORT = process.env.PORT || 5000;

const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY; // for JWT tokens

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const cors = require("cors");
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

// Authentication middleware
const jwtAuth = async (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ "Error": "Token is not in header" });
    }

    jwt.verify(token, SECRET_KEY, async(err, data) => {
        if (err) {
            return res.status(401).json({ "Error": "Not authenticated" });
        }
        try {
            const result = await pool.query(
            "SELECT * FROM Users WHERE user_id = $1", [data.user_id]);
            const user = result.rows[0]; // user_id is unique, so max 1 row

            if (!user) {
                return res.status(401).json({ "Error": "User matching token not found" });
            }
            else {
                req.user = user;
                next();
            }
        }
        catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send("Server error");
        }
    });
}

// Middleware for verifying that the requesting user owns set setId
const ownerAuth = async (req, res, next) => {

    try {
        const user = req.user;

        const setId = parseInt(req.params.setId);
        if (isNaN(setId)) {
            return res.status(400).json({ "Error": `Invalid set id "${setId}"`});
        }
        
        const findSet = await pool.query(
            "SELECT * FROM FCSets WHERE set_id = $1", [setId]
        );
        const flashcardSet = findSet.rows[0];
        if (!flashcardSet) {
            return res.status(404).json({ "Error": `Flashcard set ${setId} not found`});
        }

        if (flashcardSet.owner_id !== user.user_id) {
            return res.status(409).json({ "Error": `Not authorized to modify this set`});
        }
        next();
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send("Server error");
    }
}

// Middleware for verifying ownership or public set
const ownerOrPublic = async (req, res, next) => {

        try {
        const user = req.user;

        const setId = parseInt(req.params.setId);
        if (isNaN(setId)) {
            return res.status(400).json({ "Error": `Invalid set id "${req.params.setId}"`});
        }
        
        const findSet = await pool.query(
            "SELECT * FROM FCSets WHERE set_id = $1", [setId]
        );
        const flashcardSet = findSet.rows[0];
        if (!flashcardSet) {
            return res.status(404).json({ "Error": `Flashcard set ${setId} not found`});
        }

        if (flashcardSet.owner_id !== user.user_id && flashcardSet.permissions !== 'pub') {
            return res.status(409).json({ "Error": `Not authorized to view this set`});
        }
        next();
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send("Server error");
    }
}

app.post("/auth/tokens", async (req, res) => {

    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ "Error": "Username and password should be valid strings" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM Users WHERE username = $1", [username]);
        const user = result.rows[0]; // username is unique, so max 1 row

        if (!user) {
            return res.status(404).json({ "Error": "Username or password is incorrect"});
        }
        const matchingPassword = await bcrypt.compare(password, user.password_hash);
        if (!matchingPassword) {
            return res.status(401).json({ "Error": "Username or password is incorrect" });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const token = jwt.sign({user_id: user.user_id}, SECRET_KEY, { expiresIn: '7d' });

        return res.status(200).json({ "token": token, "expiresAt": expiresAt });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send("Server error");
    }
});

const passwordCheck = async (req, res, next) => {

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
        return res.status(400).json({ "Error": "Invalid password" });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /\p{P}|\p{S}/u.test(password);
    const hasNum = /[0-9]/.test(password);

    if (password.length > 20 || password.length < 8 || !hasLower || !hasNum 
        || !hasUpper || !hasSpecial) {
        return res.status(400).json({ "Error": 
            "Password must be 8-20 characters and have at least one uppercase, \
            lowercase, numeric, and special character" });
    }
    next();
}

app.post("/users", passwordCheck, async (req, res) => {

    const { username, email, password } = req.body;

    if (!username || !email) {
        return res.status(400).json({ "Error":
            "All of username, password, email must be specified" });
    }
    else if (typeof username !== 'string' || typeof email !== 'string') {
        return res.status(400).json({ "Error": "All inputs must be strings" });
    }
    else if (username.length > 20 || email.length > 252) {
        return res.status(400).json({ "Error": "Username or email too long" });
    }
    else if (username.length < 3) {
        return res.status(400).json({ "Error": "Username must be at least 3 characters" });
    }
    else if (!username.match(/^[a-zA-Z0-9]+$/)) {
        return res.status(400).json({ "Error": "Username must be alphanumeric" });
    }
    else if (!email.match(/^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]+$/)) {
        return res.status(400).json({ "Error": "Invalid email format" });
    }

    try {
        const checkUser = await pool.query(
            "SELECT * FROM Users WHERE username = $1", [username]);
        const userFound = checkUser.rows[0]; // username is unique, so max 1 row
    
        if (userFound) {
            return res.status(409).json({ "Error": "Username already exists" });
        }
    
        const checkEmail = await pool.query(
            "SELECT * FROM Users WHERE email = $1", [email]);
        const emailFound = checkEmail.rows[0]; // email is unique, so max 1 row
    
        if (emailFound) {
            return res.status(409).json({ "Error": "Account with email already exists" });
        }
    
        const password_hash = await bcrypt.hash(password, 10);
    
        const createUser = await pool.query(
            "INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3) \
            RETURNING user_id, username, email, created_at", 
            [username, email, password_hash]);
    
        return res.status(201).json(createUser.rows[0]);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.get("/users/me", jwtAuth, async (req, res) => {

    try {
        const { user_id, username, email, created_at } = req.user;
        const user = { user_id, username, email, created_at }; // get user info
    
        return res.status(200).json(user);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.get("/users/me/flashcards", jwtAuth, async (req, res) => {

    try {
        const user = req.user;

        const limit = (isNaN(parseInt(req.query.limit)) || parseInt(req.query.limit) < 1) ? 10 : parseInt(req.query.limit);
        const page = parseInt(req.query.page);
        const offset = (isNaN(page) || page < 1) ? 0 : (page - 1) * limit;

        const setName = req.query.name || null; // optional, to search my flashcards

        let queryString = "SELECT * \
            FROM FCSets WHERE owner_id = $1";
        let queryParams = [user.user_id];
        
        if (setName) {
            queryString += " AND title ILIKE $2";
            queryParams.push(`%${setName}%`);
            // order by exact match, then starts with, then last_updated
            queryString += " ORDER BY title = $3 DESC, title = $4 DESC, last_updated DESC"
            queryParams.push(setName, `${setName}%`);
        }
        else {
            queryString += ` ORDER BY last_updated DESC`;
        }

        queryString += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
        queryParams.push(limit, offset);

        // Find my flashcard sets
        const sets = await pool.query(queryString, queryParams);
        const flashcards = sets.rows;

        const countResult = await pool.query(
            "SELECT COUNT(*) FROM FCSets WHERE owner_id = $1" + (setName ? " AND title ILIKE $2" : ""),
            setName ? [user.user_id, `%${setName}%`] : [user.user_id]
        );
        const total = parseInt(countResult.rows[0].count);
    
        return res.status(200).json({flashcardSets: flashcards, count: total});
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.get("/users/:userId", jwtAuth, async (req, res) => {

    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ "Error": `Invalid user id "${userId}"`});
        }

        const getUser = await pool.query(
            "SELECT user_id, username, created_at \
            FROM Users WHERE user_id = $1", [userId]
        );
        const userInfo = getUser.rows[0];
        if (!userInfo) {
            return res.status(404).json({ "Error": "User not found"});
        }

        const limit = (isNaN(parseInt(req.query.limit)) || parseInt(req.query.limit) < 1) ? 10 : parseInt(req.query.limit);
        const page = parseInt(req.query.page);
        const offset = (isNaN(page) || page < 1) ? 0 : (page - 1) * limit;

        // Find the user's public flashcard sets
        const getCards = await pool.query(
            "SELECT * \
            FROM FCSets WHERE owner_id = $1 AND permissions = $2 \
            LIMIT $3 OFFSET $4", 
            [userId, "pub", limit, offset]);
        const flashcards = getCards.rows;

        const countResult = await pool.query(
            "SELECT COUNT(*) \
            FROM FCSets WHERE owner_id = $1 AND permissions = $2", 
            [userId, "pub"]);
        const total = countResult.rows[0].count;

        return res.status(200).json({...userInfo, flashcardSets: {flashcards, count: total}});
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.patch("/users/me", jwtAuth, async (req, res) => {

    try {
        const user = req.user;
        const { username, email } = req.body;
    
        let updatedFields = {}; // the object to be returned
        updatedFields.user_id = user.user_id;
    
        if (!username && !email) {
            return res.status(400).json({ "Error": "Must specify at least one value" });
        }
    
        if (username) {
            if (typeof username !== 'string') {
                return res.status(400).json({ "Error": "Invalid username type" });
            }
            else if (username.length > 20 || username.length < 3) {
                return res.status(400).json({ "Error": "Username must be 3-20 characters" });
            }
    
            const checkUsername = await pool.query(
                "SELECT * FROM Users WHERE username = $1", [username]);
            const userFound = checkUsername.rows[0]; // max 1 row
            if (userFound) {
                return res.status(400).json({ "Error": "Username is taken" });
            }
    
            const changeName = await pool.query("UPDATE Users SET username = $1 \
                WHERE user_id = $2 RETURNING username", 
                [username, user.user_id]
            );
            updatedFields.username = changeName.rows[0].username;
        }
        if (email) {
            if (typeof email !== 'string') {
                return res.status(400).json({ "Error": "Invalid email type" });
            }
            else if (email.length > 252) {
                return res.status(400).json({ "Error": "Email too long" });
            }
            else if (!email.match(/^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]+$/)) {
                return res.status(400).json({ "Error": "Invalid email format" });
            }
    
            const checkEmail = await pool.query(
                "SELECT * FROM Users WHERE email = $1", [email]);
            const emailFound = checkEmail.rows[0]; // max 1 row
            if (emailFound) {
                return res.status(400).json({ "Error": "Account with email already exists" });
            }
    
            const changeEmail = await pool.query("UPDATE Users SET email = $1 \
                WHERE user_id = $2 RETURNING email", 
                [email, user.user_id]
            );
            updatedFields.email = changeEmail.rows[0].email;
        }
    
        return res.status(200).json(updatedFields);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.patch("/users/me/password", jwtAuth, passwordCheck, async (req, res) => {

    try {
        const user = req.user;
        const old = req.body.old;
        const newPass = req.body.password;
    
        if (typeof old !== 'string' || typeof newPass !== 'string') {
            return res.status(400).json({ "Error": "Both passwords must be strings" });
        }
    
        const matchingPassword = await bcrypt.compare(old, user.password_hash);
        if (!matchingPassword) {
            return res.status(403).json({ "Error": "Old password is incorrect" });
        }
    
        const newHash = await bcrypt.hash(newPass, 10);
        await pool.query("UPDATE Users SET password_hash = $1 WHERE user_id = $2",
            [newHash, user.user_id]
        );
    
        return res.status(200).send();
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.get("/flashcards", jwtAuth, async(req, res) => {

    try {
        const { name, numCards } = req.query;
        const limit = (isNaN(parseInt(req.query.limit)) || parseInt(req.query.limit) < 1) ? 10 : parseInt(req.query.limit);
        const page = parseInt(req.query.page);
        const offset = (isNaN(page) || page < 1) ? 0 : (page - 1) * limit;

        let queryString = "SELECT f.set_id, f.title, f.created_at, f.last_updated, f.num_cards, u.username \
            FROM FCSets f INNER JOIN Users u ON u.user_id = f.owner_id \
            WHERE f.title ILIKE $1 AND f.permissions = $2";
        let queryParams = [`%${name}%`, "pub"];
        let cardFilter = ""; // to be used in pagination

        if (numCards) {
            if (numCards !== "lessThanNineteen" && numCards !== "twentyToFourtyNine" 
                && numCards !== "fiftyOrMore") {
                return res.status(400).json({ "Error": "Invalid num cards" });
            }
            else if (numCards === "fiftyOrMore") {
                queryString += " AND f.num_cards > 49";
                cardFilter = "AND num_cards > 49";
            }
            else if (numCards === "twentyToFourtyNine") {
                queryString += " AND f.num_cards < 50 AND f.num_cards > 19";
                cardFilter = "AND num_cards < 50 AND num_cards > 19";
            }
            else {
                queryString += " AND f.num_cards < 20";
                cardFilter = "AND num_cards < 20";
            }
        }
        // order by exact match, then starts with, then last_updated
        queryString += " ORDER BY f.title = $3 DESC, f.title = $4 DESC, f.last_updated DESC";
        queryParams.push(name, `${name}%`);
        
        queryString += " LIMIT $5 OFFSET $6";
        queryParams.push(limit, offset);

        const result = await pool.query(queryString, queryParams);
        const flashcardSets = result.rows;

        const countResult = await pool.query(
            `SELECT COUNT(*) \
            FROM FCSets WHERE title ILIKE $1 AND permissions = $2 ${cardFilter}`, 
            [`%${name}%`, "pub"]);
        const total = countResult.rows[0].count;

        return res.status(200).json({flashcardSets, count: total});

    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.post("/flashcards", jwtAuth, async (req, res) => {

    try {
        const { title, permissions, flashcards } = req.body;
        const user = req.user;
        let numCards = 0;

        if (typeof title !== 'string') {
            return res.status(400).json({ "Error": "Title must be a string" });
        }
        else if (title.length > 100) {
            return res.status(400).json({ "Error": "Title must be 100 characters or less" });
        }
        if (permissions !== 'pub' && permissions !== 'pri') {
            return res.status(400).json({ "Error": "Invalid permissions string" });
        }
        if (flashcards) {
            if (!Array.isArray(flashcards)) {
                return res.status(400).json({ "Error": "Flashcards must be an array" });
            }
            else if (flashcards.some(f => f.term === undefined 
                || f.definition === undefined || !f.term.trim() 
                || !f.definition.trim())) {
                return res.status(400).json({ "Error": "Each flashcard must have a term and definition" });
            }
            numCards = flashcards.length;
        }

        const createSet = await pool.query(
            "INSERT INTO FCSets (title, permissions, owner_id, num_cards) \
             VALUES ($1, $2, $3, $4) RETURNING *", 
             [title, permissions, user.user_id, numCards]
        );
        const insertPromises = flashcards.map(card =>
            pool.query(
                "INSERT INTO Flashcards (term, definition, set_id) \
                 VALUES ($1, $2, $3)",
                 [card.term, card.definition, createSet.rows[0].set_id]
            )
        );
        await Promise.all(insertPromises);

        return res.status(201).json(createSet.rows[0]);
        
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.post("/flashcards/:setId", jwtAuth, ownerAuth, async (req, res) => {

    try {
        const user = req.user;
        const setId = parseInt(req.params.setId); // pre-verified in ownerAuth
        const { term, definition } = req.body;

        if (typeof term !== 'string' || typeof definition !== 'string') {
            return res.status(400).json({ "Error": "Term and definition must be strings" });
        }
        else if (term.length > 2000 || definition.length > 2000) {
            return res.status(400).json({ "Error": "Term and definition cannot \
                be longer than 2000 characters" });
        }

        const createCard = await pool.query(
            "INSERT INTO Flashcards (term, definition, set_id) \
            VALUES ($1, $2, $3) RETURNING *", [term, definition, setId]
        );

        // update num_cards in the set and last updated
        await pool.query(
            "UPDATE FCSets SET num_cards = num_cards + 1, last_updated = NOW() \
            WHERE set_id = $1", 
            [setId]
        );

        return res.status(201).json(createCard.rows[0]);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");
    }
});

app.patch("/flashcards/:setId", jwtAuth, ownerAuth, async (req, res) => {

    try {
        const user = req.user;
        const setId = parseInt(req.params.setId); // pre-verified in ownerAuth
        const { title, permissions } = req.body;

        let updatedFields = {setId, owner: user.username}; // the object to be returned

        if (!title && !permissions) {
            return res.status(400).json({ "Error": "Must specify at least one value" });
        }
        if (title) {
            if (typeof title !== 'string' || title.length > 100) {
                return res.status(400).json({ "Error": "Title must be a string \
                    shorter than 100 characters in length" });
            }
            const changeTitle = await pool.query(
                "UPDATE FCSets SET title = $1 WHERE set_id = $2 RETURNING title",
                [title, setId]
            );
            updatedFields.title = changeTitle.rows[0].title;
        }
        if (permissions) {
            if (permissions !== 'pub' && permissions !== 'pri') {
                return res.status(400).json({ "Error": `Permissions must be either pub or pri` });
            }
            const changePerms = await pool.query(
                "UPDATE FCSets SET permissions = $1 WHERE set_id = $2 \
                RETURNING permissions",
                [permissions, setId]
            );
            updatedFields.permissions = changePerms.rows[0].permissions;
        }
        const setUpdate = await pool.query(
            "UPDATE FCSets SET last_updated = NOW() WHERE set_id = $1 \
            RETURNING last_updated", [setId]
        );
        updatedFields.lastUpdated = setUpdate.rows[0].permissions;

        return res.status(200).json(updatedFields);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");  
    }
});

app.delete("/flashcards/:setId", jwtAuth, ownerAuth, async (req, res) => {

    try {
        const setId = parseInt(req.params.setId); // pre-verified in ownerAuth

        await pool.query("DELETE FROM FCSets WHERE set_id = $1", [setId]);

        return res.status(204).send();
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error"); 
    }
});

app.get("/flashcards/:setId", jwtAuth, ownerOrPublic, async (req, res) => {

    try {
        const setId = parseInt(req.params.setId);

        const getSet = await pool.query(
            "SELECT f.title, f.created_at, f.last_updated, f.permissions, f.num_cards, u.username \
            FROM FCSets f INNER JOIN Users u ON f.owner_id = u.user_id \
            WHERE set_id = $1", [setId]);
        const flashcardSet = getSet.rows[0];

        // for filtering and searching specific flashcards in the set
        const { search, orderBy } = req.query;
        let { limit } = req.query;
        let offset = 0;
        if (limit !== "max") {
            limit = (isNaN(parseInt(req.query.limit)) || parseInt(req.query.limit) < 1) ? 10 : parseInt(req.query.limit);
            const page = parseInt(req.query.page);
            offset = (isNaN(page) || page < 1) ? 0 : (page - 1) * limit;
        }
        
        let queryString = "SELECT flashcard_id, term, definition \
            FROM Flashcards WHERE set_id = $1";
        let queryParams = [setId];

        if (search) {
            if (typeof search !== 'string') {
                return res.status(400).json({ "Error": "Search must be a string" });
            }
            queryString += " AND (term ILIKE $2 OR definition ILIKE $2)";
            queryParams.push(`%${search}%`);
        }
        if (!orderBy || orderBy === 'def') {
            queryString += " ORDER BY flashcard_id ASC";
        }
        else if (orderBy === 'alpha') {
            queryString += " ORDER BY term ASC, flashcard_id ASC";
        }
        else {
            return res.status(400).json({ "Error": "Order-by must be either \
                alphabetical (alpha) or default (def)" });
        }

        if (limit !== "max") {
            queryString += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(req.query.limit, offset);
        }

        const getCards = await pool.query(queryString, queryParams);
        const flashcards = getCards.rows;

        let countQuery = "SELECT COUNT(*) FROM Flashcards WHERE set_id = $1";
        let countParams = [setId];

        if (search) {
            countQuery += " AND (term ILIKE $2 OR definition ILIKE $2)";
            countParams.push(`%${search}%`);
        }

        const getCount = await pool.query(countQuery, countParams);
        const total = parseInt(getCount.rows[0].count);

        return res.status(200).json({...flashcardSet, flashcards: {cards: flashcards, count: total}});

    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");  
    }
});

app.get("/flashcards/:setId/:cardId", jwtAuth, ownerOrPublic, async (req, res) => {

    try {
        const setId = parseInt(req.params.setId);
        const cardId = parseInt(req.params.cardId);

        if (isNaN(cardId)) {
            return res.status(400).json({ "Error": `Invalid card id "${req.params.cardId}"`});
        }
        
        const cardResult = await pool.query(
            "SELECT * FROM Flashcards WHERE flashcard_id = $1 AND set_id = $2", 
            [cardId, setId]
        );
        const flashcard = cardResult.rows[0];
        if (!flashcard) {
            return res.status(404).json({ "Error": `Flashcard ${cardId} in set ${setId} not found`});
        }

        return res.status(200).json({term: flashcard.term, definition: flashcard.definition});
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error");  
    }
});

app.patch("/flashcards/:setId/:cardId", jwtAuth, ownerAuth, async (req, res) => {

    try {
        const setId = parseInt(req.params.setId);
        const cardId = parseInt(req.params.cardId);
        const { term, definition } = req.body;

        if (isNaN(cardId)) {
            return res.status(400).json({ "Error": `Invalid card id "${req.params.cardId}"`});
        }
        
        const cardResult = await pool.query(
            "SELECT * FROM Flashcards WHERE flashcard_id = $1 AND set_id = $2", 
            [cardId, setId]
        );
        const flashcard = cardResult.rows[0];
        if (!flashcard) {
            return res.status(404).json({ "Error": `Flashcard ${cardId} in set ${setId} not found`});
        }

        let updatedFields = {}

        if (!term && !definition) {
            return res.status(400).json({ "Error": "Must specify at least one value" });
        }
        if (term) {
            if (typeof term !== 'string' || term.length > 2000) {
                return res.status(400).json({ "Error": "Term must be a string at most 2000 characters in length" });
            }
            const updateTerm = await pool.query(
                "UPDATE Flashcards SET term = $1 WHERE flashcard_id = $2 AND \
                set_id = $3 RETURNING term", [term, cardId, setId]
            );
            updatedFields.term = updateTerm.rows[0].term;
        }
        if (definition) {
            if (typeof definition !== 'string' || definition.length > 2000) {
                return res.status(400).json({ "Error": "Definition must be a string at most 2000 characters in length" });
            }
            const updateDefinition = await pool.query(
                "UPDATE Flashcards SET definition = $1 WHERE flashcard_id = $2 AND \
                set_id = $3 RETURNING definition", [definition, cardId, setId]
            );
            updatedFields.definition = updateDefinition.rows[0].definition;
        }
        return res.status(200).json({...updatedFields, flashcard_id: cardId});

    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error"); 
    }
});

app.delete("/flashcards/:setId/:cardId", jwtAuth, ownerAuth, async (req, res) => {

    try {
        const setId = parseInt(req.params.setId);
        const cardId = parseInt(req.params.cardId);

        if (isNaN(cardId)) {
            return res.status(400).json({ "Error": `Invalid card id "${req.params.cardId}"`});
        }
        
        const cardResult = await pool.query(
            "SELECT * FROM Flashcards WHERE flashcard_id = $1 AND set_id = $2", 
            [cardId, setId]
        );
        if (cardResult.rowCount === 0) {
            return res.status(404).json({ "Error": `Flashcard ${cardId} in set ${setId} not found`});
        }

        await pool.query("DELETE FROM Flashcards WHERE set_id = $1 AND flashcard_id = $2", 
            [setId, cardId]
        );
        // update num_cards in the set
        await pool.query(
            "UPDATE FCSets SET num_cards = num_cards - 1 WHERE set_id = $1", 
            [setId]
        );
        // set last_updated
        await pool.query(
            "UPDATE FCSets SET last_updated = NOW() WHERE set_id = $1", 
            [setId]
        );
        return res.status(204).send();

    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Server error"); 
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});