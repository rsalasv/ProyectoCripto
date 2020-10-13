const router = require('express').Router()
let listaUsuarios = require('../login.json')


router.post('/usuarios',(req,res)=>{
    res.render('home',{
        title:"Home",
        condition:false,
        arregloUsuarios:listaUsuarios
    })
})

module.exports = router;