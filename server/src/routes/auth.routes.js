const express = require('express');
const { register, login, refresh, logout, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
