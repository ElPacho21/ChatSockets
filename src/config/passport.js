const passport = require('passport')
const dotenv = require('dotenv').config();

// Strategies
const local = require('passport-local')
const jwt = require('passport-jwt')

const { logger } = require('../utils/logger');
const { hashPassword, isValidPassword } = require('../utils/bcrypt')
const cookieExtractor = require('../utils/cookieExtractor')

const LocalStrategy = local.Strategy
const JWTStrategy = jwt.Strategy

const privateKey = process.env.JWT_SECRET;

const initializePassport = () => {
    passport.use('register',
        new LocalStrategy({
            passReqToCallback: true,
            usernameField: 'email'
        },
        async (req, username, password, done) => {
            try {
                const { firstName, lastName, userName, password } = req.body;
                const user = await userDao.findOne({ userName })
                if (user) {
                    logger('error', 'User already exists')
                    return done(null, false)
                }

                const newUserInfo = {
                    firstName,
                    lastName,
                    userName,
                    password: hashPassword(password)
                }

                const newUser = await userDao.insertOne(newUserInfo)
                done(null, newUser)
            } catch (error) {
                done(error.message)
            }
        })
    )

    passport.use('login', 
        new LocalStrategy({
            usernameField: 'userName'
        }, async (userName, password, done) => {
            try {
                let user = await userDao.findOne({ userName }) 
                if(!user){
                    logger('error', 'User not found')
                    return done(null, false, {message: 'User not found'})
                }
                if(!isValidPassword(password, user)){
                    logger('error', 'Incorrect password')
                    return done(null, false, {message: 'Incorrect password'})
                }
                done(null, user)
            } catch (error) {
                return done(error)
            }
        })
    )

    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: jwt.ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: privateKey
    }, async (jwt_payload, done) => {
        try {
            done(null, jwt_payload)
        } catch (error) {
            console.error(error)
        }
 
    }))

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser( async (id, done) => {
        const user = userDao.findById(id)
        done(null, user)
    })
}

module.exports = initializePassport