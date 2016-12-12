/**
 * Module dependencies.
 */
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var twilio = require('twilio');
var dbConn = require("./app_modules/cloudant.js");
var admin = require("./app_modules/admindb.js");
var multer  = require('multer');
var Excel = require('exceljs');
var http = require('http');
var nodemailer = require('nodemailer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname	)
  }
});
var upload = multer({ storage: storage });
var app = express();

// all environments
app.set('port', process.env.PORT || 8081);
app.set('view engine', 'pug');
app.use(session({
  secret: '1qwe34rsc87yh',
  resave: false,
  saveUninitialized: true
}));
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

dbConn.initDBConnection();

function requireSession(req,res,next){
	console.log(req.session.email);
	if(req.session.email){
		next();
	} else {
		res.render('index');
	}
}
//filtro para validar si existe sesión
app.all('/parm/*',requireSession);

//TODAS LAS LLAMADAS GET
app.get('/',function(req,res){
	res.render('index');
});

app.get('/parm/reclutamiento',function(req,res){
	res.render('reclutamiento');
});

app.get('/parm/inicio', function(req,res){
	res.render('inicio');
});

app.post('/login',function(req,res){
	var user = {
		"email" : req.body.email,
		"password" : req.body.password
	};
	console.log("en el login:" + req.body.email);
	admin.loginUserBd(req,res,user);
})

app.get('/logout',function(){

});

//TODAS LAS LLAMADAS POST

app.post('/parm/upload', upload.single('reclutas'), function (req, res) {
	//console.log(req.file);
	//res.send();
	var workbook = new Excel.Workbook();
	workbook.xlsx.readFile('./uploads/' + req.file.originalname).then(function() {
    	var worksheet = workbook.getWorksheet(1);
    	worksheet.eachRow(function(row, rowNumber){
    		if(rowNumber != 1) {
    			var puesto = row.values[2];
	    		var nombres = row.values[3];
	    		var apellidoPaterno = row.values[4];
	    		var apellidoMaterno = row.values[5];
	    		var celular = row.values[6];
	    		var correo;
	    		if(typeof row.values[7] === 'object'){
	    			correo = row.values[7].text;
	    		} else {
	    			correo = row.values[7];
	    		}
	    		enviarCorreo(correo);
    		} else {
    			console.log("Cabeceras: " + row.values);
    		}
    	});
    });
    res.end();
})

// Twilio Credentials 
var accountSid = 'AC1cbe766e2bfd55280fb89c25ba0664a9';
var authToken = '2b32e0ac4085065806a7577201f81878';
var client = new twilio.RestClient(accountSid, authToken);

function generarLlamada(numeroCelular){
	client.calls.create({
	to:'+51' + numeroCelular,
	from: "+5117008768",
	url:"https://handler.twilio.com/twiml/EH188352b7f9b7ca5e1bd0f121df95043d"
	}, function(err, call) {
		if(err) {
			console.log(err);
		}
		console.log(call.sid);
	});
}

function enviarSms(numeroCelular){
	var options = {
		host: 'servicio.smsmasivos.com.ar',
		path: '/'
	};
	var httpreq = request.request(options,function(httpres){
		var str = '';
		response.on('data', function (chunk) {
	    	str += chunk;
	 	});

	 	response.on('end', function () {
	 		console.log(str);
	 	});
	});
	httpreq.end();
}

function enviarCorreo(email){
	// create reusable transporter object using the default SMTP transport 
	var transporter = nodemailer.createTransport('smtps://parmperu%40gmail.com:parmperu241803@smtp.gmail.com');
	 
	// setup e-mail data with unicode symbols 
	var mailOptions = {
	    from: '"PARM PERU" <parmperu@gmail.com>', // sender address 
	    to: email, // list of receivers 
	    subject: 'Reclutamiento de Personal', // Subject line 
	    text: 'Se envia correo de reclutamiento de personal desde parm peru.', // plaintext body 
	    html: '<b>e envia correo de reclutamiento de personal desde parm peru.</b>' // html body 
	};
	 
	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        return console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	});
}

app.listen(app.get("port"), "0.0.0.0", function() {
	console.log("NodeJS Server iniciado en el puerto " + app.get("port"));
	/*client.calls.create({
	to:'+51946198461',
	from: "+5117008768",
	url:"https://handler.twilio.com/twiml/EH188352b7f9b7ca5e1bd0f121df95043d"
	}, function(err, call) {
		if(err) {
			console.log(err);
		}
		console.log(call.sid);
	});
	client.calls.create({
	to:'+51947246300',
	from: "+5117008768",
	url:"https://handler.twilio.com/twiml/EH188352b7f9b7ca5e1bd0f121df95043d"
	}, function(err, call) {
		if(err) {
			console.log(err);
		}
		console.log(call.sid);
	});
	client.calls.create({
	to:'+51999178092',
	from: "+5117008768",
	url:"https://handler.twilio.com/twiml/EH188352b7f9b7ca5e1bd0f121df95043d"
	}, function(err, call) {
		if(err) {
			console.log(err);
		}
		console.log(call.sid);
	});*/
});