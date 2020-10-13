const router = require('express').Router()
const speakeasy = require('speakeasy')
const fs = require('fs')
const path = require('path')
const dialog = require('dialog')

let listaUsuarios = require('../login.json')
let multifactorAuth = require('../multiAuth.json')

router.post('/authCode',(req,res)=>{
    let {token} = req.body
    let verified = speakeasy.totp.verify({
        secret: multifactorAuth[0].secret,
        encoding: 'ascii',
        token: token
    })

    let i = listaUsuarios.findIndex(c => c.auth == true);
    if(verified){

        
        let today = new Date();
        let date = today.getFullYear()+"/"+(today.getMonth()+1)+"/"+today.getDate() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

        listaUsuarios[i].login += 1;
        listaUsuarios[i].ultimoLogin = date;
        listaUsuarios[i].logged = true;

        res.render('home')
    }
    
    else{ 
        
        dialog.err("Token Incorrecto");
        res.render('auth2')
    }

    listaUsuarios[i].auth = false;
    let jsonRoute = '../login.json'
    const filePathBD = path.join(__dirname, jsonRoute);
    fs.writeFileSync(filePathBD, JSON.stringify(listaUsuarios));
})

module.exports = router;