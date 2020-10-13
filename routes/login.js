const router = require('express').Router()
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')

let listaUsuarios = require('../login.json')
let multifactorAuth = require('../multiAuth.json')
let dialog = require('dialog')

let randStrGenerator = function(length, randomStr=""){
  randomStr += Math.random().toString(32).substr(2,length)
  if(randomStr.length > length) return randomStr.slice(0,length)
  return randStrGenerator(length, randomStr)
}

//console.log(randStrGenerator(32));

router.route('/googleQr')
    .post((req,res) => {
       // console.log(req.body)
      let {user, password} = req.body;

      if(listaUsuarios.find(c => c.usuario == user && c.password == password)){
        let secret = speakeasy.generateSecret({
          name: randStrGenerator
        })
        
        qrcode.toDataURL(secret.otpauth_url, function(err, data){
          if(err) throw err;
          else{
            multifactorAuth[0].secret = secret.ascii
            let rutaSecret = '../multiAuth.json'
            const filePathSecret = path.join(__dirname, rutaSecret);
            fs.writeFileSync(filePathSecret, JSON.stringify(multifactorAuth));

            let index = listaUsuarios.findIndex(c => c.usuario == user && c.password == password)
            listaUsuarios[index].auth = true;

            let rutaBD = '../login.json'
            const filePathBD = path.join(__dirname, rutaBD);
            fs.writeFileSync(filePathBD, JSON.stringify(listaUsuarios));

            res.render('auth2',{
              title:"Auth 2",
              condition: false,
              qrcode : [{url:data}]
            });
          }
        })
        //res.render('home');
      }else{
        dialog.err("usuario o pass equivocados","Login incorrecto");
        res.render('login');
      }
    })
module.exports = router;