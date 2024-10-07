const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./babackend-64023-firebase-adminsdk-2n89e-3ee4f568ae.json");

const app = express();
const port = 3000;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();  

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function generateGuid() {
  return Math.random().toString(26).substring(2, 15) + Math.random().toString(26).substring(2, 15);
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
      output += char;
    }
  }

  return output;
}

app.post("/registration", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send({ email, register: false, reason: "Email or password is missing" });
  }

  const col = firestore.collection('user');
  
  const snapshots = await col.where('email', '==', email).get();
  
  if (!snapshots.empty) {
    return res.send({ email, register: false, reason: "User already exists" });
  }

  const newUser = {
    email,
    password: caesarCipher(password),  
    uid: generateGuid(),
  };

  await col.doc(newUser.uid).set(newUser);
  res.send({ email: newUser.email, register: true, reason: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const col = firestore.collection('user');

  const snapshots = await col.where('email', '==', email).get();
  
  if (snapshots.empty) {
    return res.send({ email, login: false, reason: "User not found" });
  }

  const user = snapshots.docs[0].data();

  // Validate password
  if (user.password === caesarCipher(password)) {
    return res.send({ email: user.email, login: true, reason: null });
  } else {
    return res.send({ email: user.email, login: false, reason: "Incorrect password" });
  }
});

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
