const router = require('express').Router()
let listaUsuarios = require('../login.json')
const fs = require('fs')
const path = require('path')

router.post('/changePassword',(req,res)=>{
    let {password} = req.body
    let index = listaUsuarios.findIndex(c => c.logged == 1);
    listaUsuarios[index].password = password
   
    let rutaBD = '../login.json'
    const filePathBD = path.join(__dirname, rutaBD);
    fs.writeFileSync(filePathBD, JSON.stringify(listaUsuarios));

    res.render('home')
})


module.exports = router;