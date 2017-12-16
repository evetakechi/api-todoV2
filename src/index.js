import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';
import apicache from 'apicache';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://todo-db-f1335.firebaseio.com"
});
const ref = admin.database().ref().child('todo-listV2');

const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.server = http.createServer(app).listen(8888);
app.use(express.static(__dirname + '/view'));
console.log("Server running at port:8888");

app.get('/', (req,res) => {
  res.render('index.html');
})

const accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLog}));

let cache = apicache.middleware
const success = (req, res) => res.statusCode === 200
const cacheSuccesses = cache('5 minutes', success)



app.get('/alltodo', cacheSuccesses ,async (req, res) => {
  const dataTodo = await ref.once('value');
  res.send(dataTodo.val());
});

app.post ('/todo/create', async (req, res) => {
  //console.log(req.body);
  let param = req.body;
  await ref.push(param);
  res.send({code: 1 , message:"Success"});
  
});

app.delete('/todo/delete/:id', async (req, res) => {
  //console.log(req.params.id);
  const key = req.params.id;
  await ref.child(`/${key}`).remove();
  res.send({code: 1 , message:"Success"});
  
});

app.post ('/todo/toggle', async (req, res) => {
  console.log(req.body);
  let param = req.body;
  await ref.child(`/${param.id}`).update({ todoStatus: param.toggle });
  res.send({code: 1 , message: "Success"});
  
});

