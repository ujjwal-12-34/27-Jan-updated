// const express = require('express');
const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
// const url = env.url;
const session = require('express-session');
const passport = require('passport');
const uuidv4 = require('uuid/v4');
const url = "mongodb://localhost:27017/";
const ObjectId = require('mongodb').ObjectId;
let rooms = [];
const url1 = require('url');
// const exphbs=require('express-handlebars');
// uuidv4();

const MongoClient = require('mongodb').MongoClient;

app.use(passport.initialize());
app.use(passport.session());
initializePassport = require('./passport-config')
initializePassport(
    passport,
    getUserByEmail,
    getUserById
);

// const exphbs=require('express-handlebars');
//
// let hbs = exphbs.create({
//     helpers: {
//         test: function () { console.log('test'); }
//     }
// });


// app.engine('hbs',hbs.engine )
// app.set('view engine', 'hbs');
// app.set('views', __dirname + '/views');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'test123',
    resave: false,
    saveUninitialized :false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));


let client;
async function connectToDb()
{
    MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, db) {
        let dbo = db.db('PartB');
        // let a  = dbo.collection('Users').find().toArray();
        // console.log('a',a);
        client = dbo;
        // console.log('client12', client);
    });
}

connectToDb();


app.get('/', checkAuthenticated, async function (req, res) {
    let user = await getUserById(req.session.passport.user);
    if(req.isAuthenticated()){
        // res.render('index', {User: user[0], });
        // res.render('index.t');
        // res.sendFile(path.join(__dirname, 'main.html'));
        console.log(path.join(__dirname, 'public', 'main.html'));
        res.sendFile(path.join(__dirname, 'public', 'main.html'));
    }
    else
        res.redirect('/login');
});



app.get('/signup', checkNotAuthenticated, function(req, res){
    // console.log('signup');
    res.sendFile(path.join(__dirname, 'signup.html'));
});


app.get('/login', checkNotAuthenticated, function(req, res){
    // console.log('login');
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.post('/login', passport.authenticate('local',{
    successRedirect : '/',
    failureRedirect : '/login',
    // failureFlash : true
}));


app.get('/getRooms', checkAuthenticated, async function(req, res) {
    let user = await getUserById(req.session.passport.user);
    res.json(user[0].rooms);
});

app.get('/joinRoom', checkAuthenticated, async function(req,res){
    let user = await getUserById(req.session.passport.user);
    console.log(user);
    // let roomId = req.body.roomName;

    let url_parts = url1.parse(req.url, true);
    let query = url_parts.query;
    let roomId = query.roomName;
    console.log('roomID', roomId);
    // let uniqueRoomId = ObjectId(roomId);
    // let query = "";
    let room = await getAllRooms("Rooms", {id:roomId});
    console.log('room',room[0]);
    if(room){
        user[0].rooms.push(room[0].id);
        user[0].rooms = user[0].rooms.filter(onlyUnique); //remove unique
        console.log(user[0]);
        updateCol("Users", user[0]._id, {rooms:user[0].rooms});
        room[0].users.push(user[0]._id);
        updateCol("Rooms", user[0]._id, {rooms:user[0].rooms});
    }
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

async function getAllRooms(col, query)
{
    try {
        //console.log('client', client);
        let collection = client.collection(col);
        //console.log(collection);
        let res = await collection.find(query).toArray();
        // console.log('res',res);
        return res;
    }
    catch (err) {
        console.log(err);
    }
}

app.post('/createRoom', checkAuthenticated, async function(req,res){
    let room = {};
    room.users  = [];
    room.id = uuidv4();
    room.users.push(req.session.passport.user);
    // console.log('userID', req.session.passport.user);
    let user = await getUserById(req.session.passport.user);
    console.log('>>>>>', user[0]);
    user[0].rooms.push(room.id);

    updateCol("Users", user[0]._id, {rooms:user[0].rooms});
    let a = await addRoom(room);
    // console.log('>>',user[0]);
    // rooms.push()

    res.sendFile(path.join(__dirname, 'public', 'main.html'));
    // res.end();
});

async function updateCol(col, id,query){
    try{
        // console.log('new',newRooms);
        let myQuery = {id: id};
        console.log('col ',col, ' id ', id, ' query ', query);
        // console.log('client', client);
        let collection = await client.collection(col);
        if(col =="Users") {
            let uniqueId = ObjectId(id);
            myQuery = {_id: uniqueId};
        }

        let newValues = { $set: query };
        console.log('values',newValues);
        collection.update(myQuery,newValues, function(err, res){
            if(err) throw err;
        });

        // console.log(a);
    }
    catch (err) {
        console.log(err);
    }
}

async function addRoom(room){
    try {
        let collection = await client.collection("Rooms");

        await collection.insertOne(room, function(err, res){
            if (err) throw err;
            console.log("Room added");
        });
    }
    catch (err) {
        console.log(err);
    }
}


app.post('/register', async function(req, res){
    //console.log(req.body);
    let user = {};
    user.email = req.body.email;
    user.password = req.body.password;
    user.password2 = req.body.password2;

    // console.log(user);
    let userExists = await checkUser(user);
    // console.log('user Exists',userExists);
    if(userExists.length==0){
        if(user.password != user.password2)
        {
            res.send("password do not match, Please try again");
        }
        else
        {
            let salt = bcrypt.genSaltSync(10);
            //console.log(salt);

            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) throw err;
                let Account = {email: user.email, password:hash, rooms:[]};
                //console.log(Account);
                addUser(Account);
            });
            res.redirect('/login');
            //res.send("success");
        }
    } else {
        //console.log('userExists', userExists);
        res.redirect('/register');
        //res.send("username or password already exists!!!!!");
    }
});

function checkUser(user){
    console.log('check if user aleady exits');
    let users = getFromDb('Users', {email:user.email});
    return users;
}


async function getUserByEmail(email)
{
    let Account = await getFromDb('Users', {email:email});
    return Account;
}

async function getUserById(id)
{
    let uniqueId = ObjectId(id);
    // console.log(uniqueId);
    let Account = await getFromDb('Users', {_id:uniqueId});
    return Account;
}

function addUser(user){
    console.log('adding the user');
    MongoClient.connect(url,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
        function (err, db) {
            if (err) throw err;
            let dbo = db.db("PartB");
            // console.log(user, 'user');
            dbo.collection("Users").insertOne(user, function(err, res){
                if (err) throw err;
                console.log("user added");
                db.close();
            })
        });
}

async function getFromDb(col , query){

    try {
        //console.log('client', client);
        let collection = client.collection(col);
        //console.log(collection);
        let res = await collection.find(query).toArray();
        // console.log('res',res);
        return res;
    }
    catch (err) {
        console.log(err);
    }
}

// let Account = {email: "mail", password:"pass", rooms:[]};
// addUser(Account);

function checkAuthenticated(req, res, next){
    console.log('checkAuth',req.isAuthenticated());
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('./login');
}

function checkNotAuthenticated(req, res, next){
    console.log('authenticated?', req.isAuthenticated());
    if(req.isAuthenticated())
    {

        return res.redirect('/');
    }
    next()
}


// app.listen(3000);


let server = app.listen(3000, () => {
    console.log('server is running', server.address().port);
});
const io = new SocketIO(server);
io.on('connection', function(socket){
    socket.on('chat', function(data){
        io.sockets.in(socket.room).emit('updateChat',data);
        // console.log('msg recieved', data);
    });
    socket.on('switchRoom',function(newRoom){
       socket.leave(socket.room);
       socket.join(newRoom);
       socket.room = newRoom;
    });
    console.log('a user connected');
    io.sockets.emit('broadcast','connected!');
    io.sockets.emit('event', 'some clients connected!');
    // socket.on('join', handlejoin);
});
