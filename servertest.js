if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
   }

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false}))

const initializePassport = require('./passport-config')
initializePassport(
    passport, 
    email => user.find(user => user.email === email),
    id => user.find(user => user.id === id)
)

const users = [] // Derzeit speichern im Array, nicht persistent

//DB Code
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const url = 'mongodb://127.0.0.1:27017/users'
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose', url))

const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: String,
    password: String
})
const user = mongoose.model('User', userSchema)

// DB Code Ende

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, 
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', {name: req.user.name})
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs', { user: new User()})
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = new User ({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        try{
            const newUser = await user.save()
            res.redirect('/login')
        }catch{
            res.redirect('/register', {
                user: user,
                errorMessage: 'Registrierung fehlgeschlagen' 
            })
        } 
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

app.listen(3002)
