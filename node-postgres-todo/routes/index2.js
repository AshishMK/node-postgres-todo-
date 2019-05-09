
var telesign = require('telesign').setup({
  customerId: '1E168A98-6604-466D-812A-36A691BE045A',
  apiKey: 'mOehrIarTb0w4ae/+CHIG/rTZRHb+DsdzkROZEZrZFuFu+IvyHGzyfzae6VgJ9A7OUzm592p5xcb0PL9wVTAKA=='
});


var Pool = require('pg-pool');
var pool= new Pool({
 database: 'actor',
  user: 'actor',
  password: 'actor',
  port: 5432,
  ssl: false,
  max: 40, // set pool max size to 20
  min: 4, // set min pool size to 4
  idleTimeoutMillis: 2000, // close idle clients after 1 second
  connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
});
var UPLOAD_PATHM = "./uploads_status/";

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var express = require('express');
var router = express.Router();
const path = require('path');
const connectionString = process.env.DATABASE_URL || 'postgres://actor:actor@localhost:5432/dbname'
var plivo = require('plivo');
let client = new plivo.Client('MAODQ1NTI5NDY4NTY4ZJ', 'YTAxZGUxNzI5NzJkZmVmMjg0MjVhOTdjYTlkMjY2');

//let client = new plivo.Client('AODQ1NTI5NDY4NTY4ZJ', 'OWQ0OTQ4NDRlNzFiODRmYWEzZWRhM2Q3MDk0Y2E2');


var UPLOAD_PATH = "./uploads/";
const fs = require('fs');


var multer = require('multer');
var fileUploadCompleted = false;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
var app = express();
const fileUpload = require('express-fileupload');
app.use(fileUpload());
module.exports = router;


router.get('/getOTPOD/:phone/:name',function (req, res, next)  {
const data = req.params.phone;
const name=req.params.name;
var num = Math.floor(Math.random() * 90000) + 10000;
var options = {
  phoneNumber: ''+data, // required
ucid: 'BACF' ,
  verifyCode: 12345, // optional, defaults to random value generated by TeleSign
  template: 'Your One Destination code is '+num // optional, must include a $$CODE$$ placeholder $
};


telesign.verify.sms(options, function(err, response) {
  // err: failed request or error in TeleSign response
 // response: JSON response from TeleSign
if(err){
//  done();
   console.log("bbbbbsetstt  "+err);

  return res.status(500).json({success: false, data: err});
}
else{
pool.query('insert into OD_User (phone,name,code) values($1,$2,$3) returning *', [data,name,num], function (error, resp) {
//  console.log(res.rows[0].name) // brianc
if(error){
//  done();
   console.log("bbbbbsetstt  update");
pool.query("update OD_User set code=$1 where phone=$2 returning *", [num,data], function (errup, respup){
//  console.log(res.rows[0].name) // brianc
if(errup){


  return res.status(500).json({success: false, data: errup});
}
else
  return res.json({success:true, uid:respup.rows[0].id});

});
  //return res.status(500).json({success: false, data: error});
}
else
  return res.json({success:true, uid:resp.rows[0].id});

});
}
  //return res.json({success:true, data:response});
//console.log("err"+err+" "+response);
});

});


app.post('/updateTripOD', function(req,res) {

var trip_id = req.body.trip_id;

pool.query("update OD_Requests set status=2  where  trip_id =11 returning *;", function (errup, respup){

if(errup){


  return res.status(500).json({success: false, data: errup});
}
else
 { return res.json({success:true, uid:respup.rows});
}
});

});

app.post('/deleteCommentOD', function(req,res) {
var cmnt_id = req.body.cmnt_id;
pool.query('delete from OD_Comments where id =$1  returning *',[cmnt_id] ,function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else{
  return res.json({success:true, data:resp.rows[0]});
}
});
});

router.get('/getCommentByUser/:uid', function(req,res) {
var uid = req.params.uid;
pool.query('select distinct(trip_id),* from OD_Comments where creater_id =$1 order by id desc;',[uid] ,function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else{
  return res.json({success:true, data:resp.rows});
}
});
});

app.post('/getTripOD', function(req,res) {

const uid = req.body.uid;
const trip_id = req.body.trip_id;
pool.query('Select * from ( Select * from (Select * from (select * from OD_Trip  left join  (select name,phone,pic, id creater_id from OD_User ) d on d.creater_id =   OD_Trip.uid ) mk  left join (select trip_id,status from OD_Requests  where uid = $1)  hk on hk.trip_id = mk.id ) al left join (select count(trip_id),  trip_id ntrip_id from OD_Requests group by trip_id) kk on al.id = kk.ntrip_id) rx  left join (select count(trip_id) count_accept,  trip_id ltrip_id from OD_Requests where status =1 group by trip_id) iop on rx.id =iop.ltrip_id where rx.id =$2', [uid,trip_id], function (err, resp) {

if(err){
return res.status(500).json({success: false, data: err});
}
else{
  return res.json({success:true, data:resp.rows[0]});
}
});
});

app.post('/addCommentOD', function(req,res) {
const title = req.body.title;
const uid = req.body.uid;
const trip_id = req.body.trip_id;
const name = req.body.name;
const phone = req.body.phone;
const comment = req.body.comment;
const cmnt_time= req.body.cmnt_time;
const creater_id= req.body.creater_id;

pool.query('insert into OD_Comments (uid,trip_id,name,phone,comment,cmnt_time,creater_id,title) values($1,$2,$3,$4,$5,$6,$7,$8) returning *', [uid,trip_id,name,phone,comment,cmnt_time,creater_id,title], function (err, resp) {

if(err){
return res.status(500).json({success: false, data: err});
}
else{
  return res.json({success:true, data:resp.rows[0]});
}
});
});

router.get('/getTripCommentsOD/:trip_uid', function(req,res) {
var trip_uid= req.params.trip_uid;
pool.query('select * from OD_Comments where trip_id = $1 order by id desc',[trip_uid],function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
 { return res.json({success:true, data:resp.rows});
}
});
});

app.post('/deleteTripOD', function(req,res) {

var trip_id = req.body.trip_id;
pool.query('update OD_Trip set deleted = true where id =$1 returning *;',[trip_id] ,function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else{
 pool.query("update OD_Requests set status=2  where  trip_id =$1 returning *;",[trip_id], function (errup, respup){

if(errup){


  return res.status(500).json({success: false, data: errup});
}
else
 { return res.json({success:true, uid:respup.rowCount});
}
});
}
});

});


app.post('/deleteRequestOD', function(req,res) {
var uid = req.body.uid;
var trip_id = req.body.trip_id;
pool.query('delete from OD_Requests where trip_id =$1 and uid=$2  returning *',[trip_id,uid] ,function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows[0].id});

});
});



app.post('/createTripOD', function(req,res) {

const title = req.body.title;
const description = req.body.description;
const latStart = req.body.latStart;
const longStart = req.body.longStart;
const latEnd = req.body.latEnd;
const longEnd= req.body.longEnd;
const pals = req.body.pals;
const startsDate = req.body.startsDate;
const endDate = req.body.endDate;
const uid = req.body.uid;

pool.query('insert into OD_Trip (title,description,latStart ,longStart ,latEnd ,longEnd ,pals ,startsDate ,endDate,uid) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *', [title,description,latStart,longStart,latEnd,longEnd,pals,startsDate,endDate,uid], function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else{
  console.log("vvgh "+resp.rows[0].id);
pool.query('insert into OD_Requests (uid,trip_id ,creater_id,status ) values($1,$2,$1,1) returning *', [uid,resp.rows[0].id], function (errorup, respup) {
if(errorup){
console.log("error "+errorup)
return res.status(500).json({success: false, data: errorup});
}
else {
  return res.json({success:true, data:resp.rows[0]});
}
});

}
});
});


router.get('/getTripRequestTripOD/:uid', function(req,res) {
var uid = req.params.uid;
pool.query('select * from OD_Requests  left join  (select name,phone,pic, id cr_id from OD_User ) d on d.cr_id =   OD_Requests.uid  where trip_id =$1 order by id desc;' ,[uid],function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows});

});
});

router.get('/getTripRequestOD/:uid', function(req,res) {
var uid = req.params.uid;
pool.query('select  * from(select * from OD_Requests left join  (select name,phone,pic, id cr_id from OD_User ) d on d.cr_id =   OD_Requests.uid where creater_id =$1) rx  left join (select id tp_id,startsdate,enddate,title from OD_Trip ) k on rx.trip_id=k.tp_id order by id desc;' ,[uid],function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows});

});
});

router.get('/getTripsMyOD/:uid', function(req,res) {
var uid = req.params.uid;
pool.query('Select * from (Select * from (Select * from (select * from OD_Trip left join  (select name,phone,pic, id creater_id from OD_User ) d on d.creater_id =   OD_Trip.uid ) mk  right join (select trip_id,status from OD_Requests  where uid = $1)  hk on hk.trip_id = mk.id ) al left join (select count(trip_id),  trip_id ntrip_id from OD_Requests group by trip_id) kk on al.id = kk.ntrip_id) rx  left join (select count(trip_id) count_accept,  trip_id ltrip_id from OD_Requests where status =1 group by trip_id) iop on rx.id =iop.ltrip_id;' ,[uid],function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows});

});
});

router.get('/getTripsOD/:uid/:lat/:lng', function(req,res) {
var uid = req.params.uid;
var lat = req.params.lat;
var lng = req.params.lng;
console.log(lat)
pool.query('SELECT *, (3959 * acos(cos(radians($2)) * cos(radians(latstart)) * cos(radians(longstart) - radians($3)) + sin(radians($2)) * sin(radians(latstart)))) AS distance FROM(Select * from (Select * from (Select * from (select * from OD_Trip left join  (select name,phone,pic, id creater_id from OD_User ) d on d.creater_id =   OD_Trip.uid ) mk  left join (select trip_id,status from OD_Requests  where uid = $1)  hk on hk.trip_id = mk.id ) al left join (select count(trip_id),  trip_id ntrip_id from OD_Requests group by trip_id) kk on al.id = kk.ntrip_id) rx  left join (select count(trip_id) count_accept,  trip_id ltrip_id from OD_Requests where status =1 group by trip_id) iop on rx.id =iop.ltrip_id ) geograph where geograph.startsdate > (select extract(epoch from current_timestamp) * 1000) order by distance;',[uid,lat,lng],function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows});

});
});

app.post('/verifyOTPOD', function(req,res) {
console.log("bbb"+req.body.otp)
const phone = req.body.phone;
const otp = req.body.otp;
pool.query('select count(*) from OD_User where phone = $1 and code = $2', [phone,otp], function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, uid:resp.rows[0].count});

});
});


app.post('/RequestsOD', function(req,res) {
console.log(req.body);
const uid = req.body.uid;
const trip_id = req.body.trip_id;
const creater_id = req.body.creater_id;
const status = req.body.status;
//console.log(req.body)
if (status ==0 ){
console.log(req.body)
pool.query('insert into OD_Requests (uid,trip_id ,creater_id,status ) values($1,$2,$3,$4) returning *', [uid,trip_id,creater_id,status], function (error, resp) {
if(error){
return res.status(500).json({success: false, data: error});
}
else {
  return res.json({success:true, uid:resp.rows[0].status});
}
});
}
else{
var update = true;
if (status == 1 ){
pool.query('select id from OD_Requests where trip_id = $1 and status =1', [trip_id], function (errorSel, respSel) {
if(errorSel){
return res.status(500).json({success: false, data: errorSel});
}
else {

console.log(respSel.rows.length)
pool.query("select pals from OD_Trip where id = $1", [trip_id], function (errTrip, resTrip){
if(errTrip){
return res.status(500).json({success: false, data: errTrip});
}
else {

if(respSel.rows.length >= resTrip.rows[0].pals){
update = false;
  return res.json({success:false,  data: 'Seats are full, can not accept more requests'});
}
else{
console.log ("updating 1");
pool.query("update OD_Requests set status=$1 where uid=$2 and trip_id =$3 returning *", [status,uid,trip_id], function (errup, respup){

if(errup){


  return res.status(500).json({success: false, data: errup});
}
else
 { return res.json({success:true, uid:respup.rows[0].status});
}
});
}
}

});
}
});

}
else  {
console.log("updating 2");
//Var st = respSel.rows[0].status
pool.query("update OD_Requests set status=$1 where uid=$2 and trip_id =$3 returning *", [status,uid,trip_id], function (errup, respup){

if(errup){


  return res.status(500).json({success: false, data: errup});
}
else
 { return res.json({success:true, uid:respup.rows[0].status});
}
});
}
}
});




router.get('/call_m/:todo_id',function (req, res, next)  {
const data = req.params.todo_id;

var params = {
    'to': data,    // The phone numer to which the call will be placed
    'from' : '1111111111', // The phone number to be used as the caller id

    // answer_url is the URL invoked by Plivo when the outbound call is answered
    // and contains instructions telling Plivo what to do with the call
    'answer_url' : "https://s3.amazonaws.com/static.plivo.com/answer.xml",
    'answer_method' : "GET", // The method used to call the answer_url

    // Example for asynchronous request
    // callback_url is the URL to which the API response is sent.
    // 'callback_url' : "http://myvoiceapp.com/callback/",
    // 'callback_method' : "GET" // The method used to notify the callback_url.
};
});


router.get('/call/:todo_id',function (req, res, next)  {
const data = req.params.todo_id;

    client.calls.create(
        "+918630620566", // from
        data, // to
 "http://s3.amazonaws.com/static.plivo.com/answer.xml", // answer url
        {
            answerMethod: "GET",
        },        
    ).then(function (response) {
        console.log(response);
    }, function (err) {
        console.error(err);
    });


});

app.post('/runQuery', function(req,res) {
var param = req.body.query;
pool.query(''+param+'' ,function (err, resp) {

if(err){
  return res.status(500).json({success: false, data: err});
}
else
  return res.json({success:true, data:resp.rows});

});
});


router.get('/num/:todo_id',function (req, res, next)  {
const data = req.params.todo_id;
//const name=req.body.name;
var num = Math.floor(Math.random() * 90000) + 10000;

var params = {
    'src': '1111111111', // Sender's phone number with country code
    'dst' : data, // Receiver's phone Number with country code
    'text' : "verify code is: "+num, // Your SMS Text Message - English
    //'text' : "こんにちは、元気ですか？", // Your SMS Text Message - Japanese
    //'text' : "Ce est texte généré aléatoirement", // Your SMS Text Message - French
    'url' : "http://example.com/report/", // The URL to which with the status of the message is sent
    'method' : "GET" // The method used to call the url
};

client.messages.create(
  '1111111111',
  data,
  num
).then(function(message_created) {
  console.log(message_created)
    return res.status(200).json({success: true, data: num});


});
});

app.get('/list_files', function(req, res) {

var files = fs.readdirSync(UPLOAD_PATH);
files.sort(function(a, b) {
               return fs.statSync(UPLOAD_PATH+ b).mtime.getTime() - 
                      fs.statSync(UPLOAD_PATH+ a).mtime.getTime();
           });

res.json({success: files});

});
app.get('/list_file', function(req, res) {
fs.readdirSync(UPLOAD_PATH).forEach(file => {
  console.log(file);
res.json({success: file});

})

});
app.get('/pic/:fil', function(req, res) {
//printRequestHeaders(req);
var fullPath = path.resolve(UPLOAD_PATH,req.params.fil);

console.log("tunnu  parameter n------_ " +req.params.fil);
  res.download(fullPath);
//res.end("Android Upload Service Demo node.js server running!"+path);
});

app.get('/pic_st/:fil', function(req, res) {
//printRequestHeaders(req);
var fullPath = path.resolve(UPLOAD_PATHM,req.params.fil);

console.log("tunnu  parameter n------_ " +req.params.fil);
  res.download(fullPath);
//res.end("Android Upload Service Demo node.js server running!"+path);
});



app.get('/delete_pic/:fil', function(req, res) {
//printRequestHeaders(req);
var filePath = path.resolve(UPLOAD_PATH,req.params.fil);

fs.unlinkSync(filePath);
//res.end("Android Upload Service Demo node.js server running!"+path);
 res.send('File deleted!');

});

app.post('/set_status_views', function(req, res) {

var name=req.body.name;
var uid=req.body.uid;
var phone=req.body.phone;
var vid=req.body.vid;
var status_id=req.body.status_id;
console.log("started ccccc");

pool.query('insert into what_status_views (uid,status_id,name,phone,vid,created_at) values($1,$2,$3,$4,$5,now())', [uid,status_id,name,phone,vid], function (err, resp) {
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbbsetstt  "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp});

});

});

app.post('/delete_status', function(req, res) {

var status_id=req.body.status_id;
console.log("started ccccc");

pool.query('delete from what_status where _id=$1', [status_id], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp});

});

});

app.post('/set_status_text', function(req, res) {

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  var uid=req.body.uid;
var text1=req.body.text1;
//var isPublic=req.body.isPublic;
pool.query('insert into what_status (uid,text1,created_at) values($1,$2,now())', [uid,text1], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp});

});


});
app.post('/set_status', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded ff .');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
 console.log("***************"+req.body.type);
var pt=req.body.type+"_" + Date.now()+sampleFile.name;
var uid=req.body.uid;
//var isPublic=req.body.isPublic;

var text2=req.body.text2;
var path=UPLOAD_PATHM+pt;
 // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(path, function(err) {

    if (err)
return res.status(500).json({success: false, data: err});

if(req.body.type==='vid_'){
var proc = ffmpeg(path)
  // setu

  .on('end', function() {
    console.log('screenshots were saved');
 insrtData(res ,pt,text2,uid);

  })
  .on('error', function(err) {
    console.log('an error happened: ' + err.message);
return res.status(500).json({success: false, data: err});

  })
  // take 2 screenshots at predefined timemarks and size
.takeScreenshots({ count: 1, timemarks: [ '00:00:02.000' ], size: '150x100',filename:[pt] }, UPLOAD_PATHM);
}
else{
 insrtData(res ,pt,text2,uid);
}

//  res.send('File uploaded!');

  });
});
function  insrtData(res ,pt,text2,uid){
  console.log('an error happened: iiii');

pool.query('insert into what_status (uid,media,text2,created_at) values($1,$2,$3,now())', [uid,pt,text2], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp});

});


}



router.get('/get_status_views/:uid', function(req, res) {
 const results = [];
const results2 = [];
var uid=req.params.uid;



pool.query("select *  from what_status_views where uid =$1 and created_at >now() - interval '24 hours'  order by created_at desc", [uid], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
//results.push(res.rows[0]);
  return res.json({success:true, data:resp.rows});

});
});
router.get('/get_status_pool/:uid', function(req, res) {
 const results = [];
const results2 = [];
var uid=req.params.uid;
pool.query("select *  from what_status where uid =$1 and created_at >now() - interval '24 hours'  order by created_at desc", [uid], function (err, resp) {
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});

//      console.log("bbbbb "+err);

}

// results.push(resp.rows);

  return res.json({success: false, data: resp.rows});

});
});






router.get('/get_status/:uid', function(req, res) {
 const results = [];
const results2 = [];
const results3=[];
var uid=req.params.uid;
 

pool.query("select * from (select *  from what_status where created_at >now() - interval '24 hours'  ) d join (select *  from user_contacts where owner_user_id =$1 and is_deleted='f' ) m on d.uid=m.contact_user_id  order by created_at desc;", [uid], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
   results.push(resp.rows);



pool.query("select *  from what_status where uid =$1 and created_at >now() - interval '24 hours'  order by created_at desc", [uid], function (err, resp2){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
  results2.push(resp2.rows);

   return res.json({success: false,me:resp2.rows, data: resp.rows});

});
});
});




app.post('/uploadm', function(req, res) {
  if (!req.files)
    return res.status(400).send('No files were uploaded ff .');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
 console.log("***************"+req.body.type);

var path=UPLOAD_PATH+"/"+req.body.type+"_" + Date.now()+sampleFile.name;
if(req.body.type==='you_'){
 
path=UPLOAD_PATH+"/"+req.body.type+sampleFile.name;
}
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(path, function(err) {

    if (err)
      return res.status(500).send('sss');

var files = fs.readdirSync(UPLOAD_PATH);
files.sort(function(a, b) {
               return fs.statSync(UPLOAD_PATH+ b).mtime.getTime() -
                      fs.statSync(UPLOAD_PATH+ a).mtime.getTime();
           });
if(files.length>5){
for (var i = 5, len = files.length; i < len; i++) {
  fs.unlinkSync(UPLOAD_PATH+"/"+files[i]); 
}}
    res.send('File uploaded!');
  });
});

app.post('/upload', function(req, res) {
  console.log(req.files.foo); // the uploaded file object
});



router.get('/get_users', function(req, res, next) {
  const results = [];

pool.query("select 1, count(*) as c1 from users union all SELECT 2,count (*)as c2 FROM history_messages union all select 3,count(*) as c3 from files where name like '%.jpg' or name like '%.png' or name like '%.jpeg' or name like '%.gif' or name like '%.jps' or name like '%.jp2' or name like '%.tiff' or name like '%.psd' or name like '%.webp' or name like '%.ico' or name like '%.pcx' or name like '%.tga' or name like '%.raw' union all select 4,count(*) as c4 from files where name like '%.mp4' or name like '%.mpeg-4' or name like '%.flv' or name like '%.m4v' or name like '%.webm' or name like '%.avi' or name like '%.3gp' or name like '%.avi' union all select 5,count(*) as c5 from files where name like '%.mp3' or name like '%.opus' or name like '%.m4a'  or name like '%.aac' or name like '%.flac' or name like '%.alac' or name like '%.m3u' or name like '%.wma' or name like '%.ogg' or name like '%.3gpp' or name like '%.amr' or name like '%.wav' union all select 6,count(*) as c6 from history_messages where message_content_header ='2' union all select 7,count(*) as c7 from files ORDER BY 1;", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
  //  results.push(resp.rows);

   return res.json(resp.rows);

//  return res.json({success:true, data:resp});

});

});

router.get('/get_last_users', function(req, res, next) {
  const results = [];

pool.query("select * from (select * from user_phones ) d join (select * from users where is_bot=false and country_code='IN' order by created_at desc limit 100) m on m.id=d.user_id order by created_at desc;", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

 //results.push(resp.rows);

   return res.json(resp.rows);
  
//eturn res.json({success:true, data:resp});

});

}); 





router.get('/find_users_by_name/:name', function(req, res, next) {
  const results = [];
var name=req.params.name;


pool.query("select * from(select * from users where name ilike '%"+name+"') d join (select * from user_phones)m on d.id=m.user_id ", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

// results.push(resp.rows);

   return res.json(resp.rows);

//  return res.json({success:true, data:resp});

});
});

router.get('/find_users_by_phone/:phone', function(req, res, next) {
  const results = [];
var name=req.params.phone;
pool.query("select * from(select * from users ) d join (select * from user_phones where CAST(number AS TEXT) ilike '%"+name+"%')m on d.id=m.user_id ", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

// results.push(resp.rows);

   return res.json(resp.rows);

//  return res.json({success:true, data:resp});

});
 });

router.get('/get_suggestion_users', function(req, res, next) {
  const results = [];
pool.query("select * from (select * from user_phones ) d join (select * from users where is_bot=false and country_code='IN' order by created_at desc limit 500) m on m.id=d.user_id order by created_at desc;", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
 console.log(" get_suggestion_users response ",resp.rows.length);

 results.push(resp.rows);

   return res.json(resp.rows);


});
});


router.get('/get_user_code/:phone', function(req, res, next) {
  const results = [];
var ph=req.params.phone;
pool.query("select xmin, transaction_hash  from auth_phone_transactions where phone_number='"+ph+"' and  is_checked=false", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
var theShit=0;
var t_id="";
var rm=0;
    if(resp.rows.length > 0) {
   for (var i = 0; i < resp.rows.length; i++) {
var tmp=parseInt(resp.rows[i].xmin);
console.log(resp.rows[i].xmin+" "+theShit);
        if( tmp > theShit){
rm=i;
//console.log(i+"\n");

theShit=tmp;
}

}
t_id=resp.rows[rm].transaction_hash;
console.log(t_id);
pool.query("select * from auth_codes where transaction_hash ='"+t_id+"'", function (err, resp2){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  //results.push(resp2.rows);

   return res.json(resp2.rows);


});

}else{
     return res.status(500).json({success: false, data: "false"});

}


});

});


router.get('/get_users_time/:todo_id', function(req, res, next) {
  const results = [];
const t=req.params.todo_id*24;
const tim=""+t+" hours";
console.log("count: "+ tim);
var cc=0;



pool.query("SELECT count(*) FROM history_messages WHERE message_content_header ='3'  and date > now()- interval '"+tim+"'", function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});b
}

  if(result.rows.length > 0) {
       // res.render('index.njk', { recordResult: result.rows});

cc=resp.rows[0].count;

pool.query("select 1, count(*) as c1 from users WHERE created_at > now()- interval '"+tim+"' union all SELECT 2,count(*) as c2 FROM history_messages WHERE date > now()- interval '"+tim+"'   union all select 3,count(*) as c3 from (select * from files order by id desc limit "+cc+") as tbl where name like '%.jpg'  or name like '%.png' or name like '%.jpeg' or name like '%.gif' or name like '%.jps' or name like '%.jp2' or name like '%.tiff' or name like '%.psd' or name like '%.webp' or name like '%.ico' or name like '%.pcx' or name like '%.tga' or name like '%.raw'  union all select 4,count(*) as c4 from  (select * from files  order by id desc limit "+cc+") as tbl  where name like '%.mp4' or name like '%.mpeg-4' or name like '%.flv' or name like '%.m4v' or name like '%.webm' or name like '%.avi' or name like '%.3gp'  or name like '%.avi' union all select 5,count(*) as c5 from  (select * from files order by id desc limit "+cc+") as tbl  where  name like '%.mp3' or name like '%.opus' or name like '%.m4a'  or name like '%.aac' or name like '%.flac' or name like '%.alac' or name like '%.m3u' or name like  '%.wma' or name like '%.ogg' or name like '%.3gpp' or name like '%.amr' or name like '%.wav' union all select 6,count(*) as c6 from history_messages where message_content_header ='2' and date > now()- interval '"+tim+"' union all select 7, count(*) FROM history_messages WHERE message_content_header ='3'  and date > now()- interval '"+tim+"' ORDER BY 1;", function (err, resp2){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

      results.push(resp2.rows);
    // After all data is returned, close connection and return results
   
      return res.json(resp2.rows);


});
}
else{
 
      return res.json(results);

}
});
});



var multerFiles = multer({
    dest: UPLOAD_PATH,
    rename: function (fieldname, filename) {
        return filename;
    },
    onParseEnd: function(req, next) {
        printRequestParameters(req);
        next();
    },
    onFileUploadStart: function (file) {
        console.log("Started file upload\n parameter name: " +
                    file.fieldname + "\n file name: " +
                    file.originalname + "\n mime type: " + file.mimetype);
    },
    onFileUploadComplete: function (file) {
        var fullPath = path.resolve(UPLOAD_PATH, file.originalname);
        console.log("Completed file upload\n parameter name: " +
                    file.fieldname + "\n file name: " +
                    file.originalname + "\n mime type: " + file.mimetype +
                    "\n in: " + fullPath);
        fileUploadCompleted = true;
    }
});

var multipartUploadHandler = function(req, res) {
    if (fileUploadCompleted) {
        fileUploadCompleted = false;
        res.header('transfer-encoding', ''); // disable chunked transfer encoding
        res.end("Upload Ok!");
    }
};
//app.post('/upload/multipart', router.multipartReqInterceptor, router.multerFiles, router.multipartUploadHandler);
// handle multipart uploads 

app.post('/upload/multiparht', function(req,res)
{}); 

//app.post('/upload/multipart', multipartReqInterceptor, multerFiles, multipartUploadHandler);


var multipartReqInterceptor = function(req, res, next) {
    console.log("\n\nHTTP/Multipart Upload Request from: " + req.ip);
//    printRequestHeaders(req);
//    next();
};

var server = app.listen(3040, function() {
   console.log("Web server started. Listeningdddddddd on all interfaces on port " +
              server.address().port);
    console.log("\nThe following endpoints are available for upload testing:\n");
//    printAvailableEndpoints();
//    console.log("Basic auth credentials are: " + JSON.stringify(basicAuthUser));
});


    var Storage = multer.diskStorage({

     destination: function(req, file, callback) {

         callback(null, "./images/");

     },

     filename: function(req, file, callback) {

         callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);

     }

 });
var uploads = multer({dest: './uploads/'});
 var uwpload = multer({

     storage: Storage

 }).array("imgUploader", 3);



app.post('/get_requests', function(req, res) {

var rid=req.body.rid;

pool.query('select * from suggestions where r_phone=$1 and is_blocked=false order by created_at desc',[rid], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
return res.json({success: true, data: resp.rows});
});
});




app.post('/update_request', function(req, res) {

var sid=req.body.sid;

var rid=req.body.rid;
pool.query("update suggestions set is_blocked=true where r_phone=$1 and s_phone=$2", [rid,sid], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp});

});
});

app.post('/send_request', function(req, res) {
var sid=req.body.sid;
var rid=req.body.rid;
var s_name=req.body.s_name;


pool.query('select * from suggestions where s_phone =$1 and r_phone=$2', [sid,rid], function (err, resp){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}
if(resp.rows.length>0)
return res.json({success:true,msg:'Request already sent'});


pool.query('insert into suggestions (s_phone,r_phone,s_name,created_at) values($1,$2,$3,now())', [sid,rid,s_name], function (err, resp2){
//  console.log(res.rows[0].name) // brianc
if(err){
//  done();
   console.log("bbbbb "+err);

  return res.status(500).json({success: false, data: err});
}

  return res.json({success:true, data:resp2});

});
});
})
