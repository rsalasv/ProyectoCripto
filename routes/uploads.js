const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const globby = require('globby')
const fs = require('fs')
const axios = require('axios')
const crypto = require('crypto');
const zlib = require('zlib');

let fileName='';

const { Transform } = require('stream');
class AppendInitVect extends Transform {
  constructor(initVect, opts) {
    super(opts);
    this.initVect = initVect;
    this.appended = false;
  }

  _transform(chunk, encoding, cb) {
    if (!this.appended) {
      this.push(this.initVect);
      this.appended = true;
    }
    this.push(chunk);
    cb();
  }
}

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/img'),
        filename: (req, file, cb) => { 
            cb(null, file.originalname); //file.originalname
        } 
})

const fileFilter = (req, file, cb)=>{ 
    //if (file.mimetype.match(/.(jpeg|png|gif)$/)) 
    fileName = file.originalname
    //console.log(file.mimetype)
    if (file.mimetype === 'text/plain') {
        cb(null, true);
    } else{
        cb(null, false); // false, ignore other files
    }
}

const uploadFile = multer({ 
    storage,
    limits: {fileSize: 1000000},
    fileFilter 
})

router.get('/upload', async (req,res)=>{
    const paths = await globby(['**/public/img/*']);
    // console.log(paths);
    const pathsNew = paths.map(function(x){
        return x.replace("public/",'')
    })
    res.send(pathsNew)
    // res.send('En upload')
})

router.post('/upload', uploadFile.single('file'), async (req, res) => {
    //  console.log(req.file);
    res.redirect(303, '/archivoCertificado');
});

router.get('/archivoCertificado',(req,res)=>{
    
    let rutaArchivo = '../public/img/' + fileName
    let filePath = path.join(__dirname, rutaArchivo);
    
    //Sign
    let private_key = fs.readFileSync('./privateKey.pem', 'utf-8')
    let doc = fs.readFileSync(filePath)
    let signer = crypto.createSign('RSA-SHA256');
    signer.write(doc);
    signer.end();
    let signature = signer.sign(private_key, 'base64')
    console.log('Digital Signature: ', signature)

    //Verify
    fs.writeFileSync('./signature.txt', signature)
    let public_key = fs.readFileSync('./publicKey.pem', 'utf-8')
    signature = fs.readFileSync('./signature.txt', 'utf-8');
    let verifier = crypto.createVerify('RSA-SHA256');
    verifier.write(doc);
    verifier.end();
    let result = verifier.verify(public_key, signature, 'base64');
    console.log('Digital Signature Verification : ' + result);

    try{
        if(fs.statSync(filePath).isFile()){
            res.download(filePath)
        }
    }catch(e){
        console.log("Archivo no existente")
    }
})

router.post('/uploadEnc', uploadFile.single('file'), async (req, res) => {
    //  console.log(req.file);
    res.redirect(303, '/archivoEncriptado');
});

router.get('/archivoEncriptado', (req, res)=>{
    function getCipherKey(password) {
        console.log(randStrGenerator(32));
        return crypto.createHash('sha256').update(password).digest();
    }

    let rutaArchivo = '../public/img/' + fileName
    let filePath = path.join(__dirname, rutaArchivo);
    let randStrGenerator = function(length, randomStr=""){
        randomStr += Math.random().toString(32).substr(2,length)
        if(randomStr.length > length) return randomStr.slice(0,length)
        return randStrGenerator(length, randomStr)
      }
      
    let password = randStrGenerator(32);

    let initVect = crypto.randomBytes(16);  
    const CIPHER_KEY = getCipherKey(password);
    let readStream = fs.createReadStream(filePath);
    const gzip = zlib.createGzip();
    const cipher = crypto.createCipheriv('aes256', CIPHER_KEY, initVect);
    const appendInitVect = new AppendInitVect(initVect);
    let writeStream = fs.createWriteStream(path.join(filePath + ".enc"));
    readStream.pipe(gzip).pipe(cipher).pipe(appendInitVect).pipe(writeStream);
    
    const readInitVect = fs.createReadStream(filePath, { end: 15 });

    setTimeout(function () {
        console.log("waitin'")
        }, 5000);

    readInitVect.on('data', (chunk) => {
        console.log(chunk)
        initVect = initVect;
    });

    readInitVect.on('close', () => {
        let cipherKey = getCipherKey(password);
        //console.log("entra")
        readStream = fs.createReadStream(filePath +'.enc', { start: 16 });
        const decipher = crypto.createDecipheriv('aes256', cipherKey, initVect);
        const unzip = zlib.createUnzip();
        writeStream = fs.createWriteStream(filePath + '.unenc');

        readStream.pipe(decipher).pipe(unzip).pipe(writeStream);
    });
    console.log("terminado")
})

router.post('/archivosSubidos',(req,res)=>{

    let archivosArreglo;
    axios('https://localhost:3000/upload')
        .then(response => {
            
            archivosArreglo = response.data.map(archivo => {return {nombre: archivo}})            

            res.render('home',{
                title: "Home",
                condition:false,
                pathsNew : archivosArreglo
            })

        })
});

module.exports = router;