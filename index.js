const express = require("express");
var bodyParser = require('body-parser');
var serviceAccount = require("./auth-samm-firebase-adminsdk-kk62o-84fffbb742.json");
var admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
function generateGuid() {
    return Math.random().toString(26).substring(2, 15) +Math.random().toString(26).substring(2, 15);
}
function caesarCipher(input) {
    const shift = 13;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const shiftedAlphabet = alphabet.slice(shift) + alphabet.slice(0, shift);
    const lowerAlphabet = alphabet.toLowerCase();
    const shiftedLowerAlphabet = lowerAlphabet.slice(shift) + lowerAlphabet.slice(0, shift);

    let output = '';

    for (let char of input) {
        if (alphabet.includes(char)) {
            const index = alphabet.indexOf(char);
            output += shiftedAlphabet[index];
        } else if (lowerAlphabet.includes(char)) {
            const index = lowerAlphabet.indexOf(char);
            output += shiftedLowerAlphabet[index];
        } else {
            output += char; // Non-alphabet characters are unchanged
        }
    }

    return output;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const auth = getAuth();
const firestore = getFirestore();
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.get("/",(req,res) => {
    res.send("hello server ")
})
app.get("/registration",(req,res) => {
    res.send("this is regis servers")
})
app.get("/searchuser",(req,res) => {res.send({"working":true})})
app.post("/searchuser",(req,res) => {
    auth.getUserByEmail(req.body.email).then(i => {
        console.log(i)
    }).catch(err => {
        console.log(err)
    })
    
})
app.post("/registration",(req,res) => {
    const data = {
        "username":req.body.username,
        "password":req.body.password
    }
    const uuid = generateGuid();
    auth.createUser({
        "uid":uuid,
        "email":req.body.username,
        "password":req.body.password,
    }).then(async i => {
        const user_data = i
        const docRef = firestore.collection('user').doc(uuid)
        await docRef.set({
            "uid":uuid,
            "email":req.body.username,
            "password":caesarCipher(req.body.password),
            "emailverify":false
        })
        auth.generateEmailVerificationLink(req.body.username).then(ij => {
            console.log(ij);
        }).catch(err => {
            console.log(err);
        })
    }).catch(err => {
        console.log(err)
    })
    console.log(data); 
    res.send(data); 
})

app.post("/login",async (req,res) => {
    const col = firestore.collection('user')
    const snapshots = await col.where('email','==',req.body.username).get().then(doc => doc.empty || doc)
    console.log(snapshots)
    snapshots.forEach(doc => {
        console.log(doc)
        const snapshot = doc.data()
        console.log(snapshot)
        if(snapshot){
            if(snapshot.password === caesarCipher(req.body.password)){
                res.send({"email":snapshot.email,"login":true,reason:null})
            }else{
                res.send({"email":snapshot.email,"login":false,reason:"wrong password"})
            }
        }else{
            res.send({"email":req.body.username,"login":false,reason:"wrong email user not found"})
        }
    })
})
app.listen(port , () => {
    console.log(`app is running on port ${port}`);
})
