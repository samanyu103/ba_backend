const express = require("express");
var bodyParser = require('body-parser');
const app = express();
const port = 3001;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.get("/",(req,res) => {
    res.send("hello server ")
})
app.get("/registration",(req,res) => {
    res.send("this is regis servers")
})
app.post("/registration",(req,res) => {
    const data = {
        "username":req.body.username,
        "password":req.body.password
    }
    console.log(data);
    res.send(data); 
})
app.listen(port , () => {
    console.log(`app is running on port ${port}`);
})