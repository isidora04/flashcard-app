const express = require('express');
const users = require('./controllers/users');
const sets = require('./controllers/sets');
const flashcards = require('./controllers/flashcards');
const profile = require('./controllers/profile');
const { jwtAuth } = require("./middleware/auth");
const { passwordCheck } = require('./middleware/passwordCheck');
const { ownerAuth } = require('./middleware/ownerAuth');
const { ownerOrPublic } = require('./middleware/ownerOrPublic'); 


const router = express.Router();
router.post('/users', passwordCheck, users.registerUser);
router.get('/users/:userId', jwtAuth, users.getUser);

router.get('/users/me', jwtAuth, profile.getProfile);
router.patch('/users/me', jwtAuth, profile.editProfile);
router.patch('/users/me/password', jwtAuth, passwordCheck, profile.changePassword);

router.get('/flashcards', jwtAuth, sets.findSets);
router.post('/flashcards', jwtAuth, sets.createSet);
router.post('/flashcards/:setId', jwtAuth, ownerAuth, sets.createCard);
router.patch('/flashcards/:setId', jwtAuth, ownerAuth, sets.editSet);
router.delete('/flashcards/:setId', jwtAuth, ownerAuth, sets.deleteSet);
router.get('/flashcards/:setId', jwtAuth, ownerOrPublic, sets.retrieveSet);

router.get('/flashcards/:setId/:cardId', jwtAuth, ownerOrPublic, flashcards.retrieveCard);
router.patch('/flashcards/:setId/:cardId', jwtAuth, ownerAuth, flashcards.editCard);
router.delete('/flashcards/:setId/:cardId', jwtAuth, ownerAuth, flashcards.deleteCard);

module.exports = router;