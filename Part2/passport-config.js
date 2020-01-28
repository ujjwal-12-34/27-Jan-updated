const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

function initialize(passport,getUserByEmail, getUserById){
    //console.log('func call');
    const authenticateUser = async (email, password, done) =>{
        const userArr = await getUserByEmail(email); //returns an array of users with single value
        const user = userArr[0];
        //console.log('user', user);
        if(user == null){
            console.log('user not found');
            return done(null, false);
        }
        try{
            if(await bcrypt.compare(password, user.password)){
                // console.log('user', user);
                return done(null, user);
            } else {
                console.log('incorrect pass');
                return done(null, false);
            }
        }
        catch (e) {
            return done(e)
        }
    };
    console.log('there?');
    passport.use(new LocalStrategy({ usernameField: 'username'}, authenticateUser));
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser((id, done) =>{
        done(null, getUserById(id))
    })
}

module.exports = initialize;

// async function getFromDb(col){
//     try {
//         let collection = client.collection('users');
//         let res = await collection.find({$or:[{email:user.username}, {username:user.username}]}).toArray();
//         return res;
//     }
//     catch (err) {
//         console.log(err);
//     }
// }