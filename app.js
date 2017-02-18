'use strict';
var express = require("express");
var session = require('express-session');
var bodyParser = require("body-parser");
var clientedb = require("./app_modules/cliente.js");
var usuariodb = require("./app_modules/usuario.js");
var nodemailer = require('nodemailer');
var multer  = require('multer');
var Excel = require('exceljs');
var twilio = require('twilio');

var app = express();

//ALL ENVIRONMENT VARIABLES
app.set("port", process.env.PORT || 80);
app.set("view engine", "pug");

//APPLICATION CONFIGURATIONS
app.use(express.static(__dirname + "/public"));
app.use(session({
  secret: '1qwe34rsc87yh',
  resave: false,
  saveUninitialized: true
}));
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
  	var datetimestamp = Date.now();
    cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
  }
});
var upload = multer({ storage: storage });

// -- FILTROS --
// Filtro de sesion
app.all("/parmsecure/*",function(req,res,next){
	if(req.session.usuario){
		next();
	} else {
		res.redirect('/');
	}
});

// Filtro de administración
app.all("/parmsecure/admin/*",function(req,res,next){
	if(req.session.usuario.ROL == 2){
		next();
	} else {
		res.redirect('/parmsecure/index');
	}
});

// -- RUTEOS DE USUARIOS NORMALES --
app.get("/",function(req,res){
	res.render("login");
});

app.get("/nuevoregistro",function(req, res){
	res.render("registro");
});

app.get("/olvidocontrasena",function(req, res){
	res.render("olvidocontrasena");
});

app.get("/activarcuenta", function(req,res){
	var ruc = req.query.ruc;
	var codigo = req.query.cod;
	try {
		usuariodb.activarCuenta(ruc,codigo);
		res.render("activacioncuentaok");
	} catch (err) {
		console.log(err);
		res.render("activacioncuentaerror");
	}
});

app.get("/parmsecure/index", function(req,res){
	res.render("index");
});

app.get("/parmsecure/reclutamiento", function(req,res){
	res.render("reclutamiento");
});

app.get("/parmsecure/actividad", function(req, res){
	res.render("actividad");
});

app.get("/parmsecure/perfil", function(req, res){
	res.render("perfil");
});

app.get("/parmsecure/cerrarsesion",function(req,res){
	if(req.session.usuario) {
		req.session.destroy();
		res.render("login",{info:"Gracias por usar PARM, vuelve pronto!"});
	} else {
		res.render("login");
	}
});

app.get("/parmsecure/reclutar",function(req, res){
	var file = req.session.ultimacarga;
	workbook.xlsx.readFile('./uploads/' + file).then(function() {
    	var worksheet = workbook.getWorksheet(1);
    	worksheet.eachRow(function(row, rowNumber){
    		if(rowNumber != 1) {
    			var puesto = row.values[3];
    			var nombres = row.values[4];
    			var celular = row.values[7];
    			var correotmp;
	    		if(typeof row.values[8] === 'object'){
	    			correotmp = row.values[8].text;
	    		} else {
	    			correotmp = row.values[8];
	    		}
    			/*
	    		enviarSms(celular);
	    		var htmlbody = "<h2>Reclutamiento de personal</h2>" + 
	    		"<p>Estimado " + nombres + ",</p>" +
	    		"<p>La empresa " + req.session.usuario.RAZON_SOCIAL + " lo invita a una convocatoria para el puesto de " + puesto + ".</p>" +
	    		"<p></p>";
	    		enviarCorreo(correotmp,"Convocatoria de personal",correotmp);
	    		generarLlamada(celular);
	    		*/
    		}
    	});
    	res.send("ok");
    });
});

app.get("/resetearcontrasena",function(req, res){
	var ruc = req.query.ruc;
	var codigoReseteo = rq.query.cod;
	var contrasenaTemmporal = codigoAleatorio("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",8);

	try{
		usuariodb.resetearContrasena(ruc,contrasenaTemmporal,codigoReseteo);

		var cliente = clientedb.buscarClienteXRuc(ruc);

		var htmlbody = "<3>Estimado Cliente,</h3>" + 
		"<p>Hemos reseteado la contraseña de su cuenta a una temporal.</p>" +
		"<p>La contraseña temporal es: <strong>" + contrasenaTemmporal + "</strong></p>" +
		"<p>Si usted no la solicitó por favor omitir este mensaje.</p>";

		enviarCorreo(cliente.CORREO, "Solicitud de reseteo de contraseña", htmlbody);

		res.render("reseteocontrasenaok");
	}catch(err){
		console.log(err);
		res.render("reseteocontrasenaerror");
	}
});

// -- RUTEOS DE ADMINISTRADOR --
app.get("/parmsecure/admin/solicitudes", function(req,res){
	res.render("solicitudes");
});

// -- POSTS --
// Estados:
//	1: Registrado pero no activado
//	2: Código de confirmación enviado
//	3: Registrado y activado
// Roles:
//	1: Usuario común
//	2: Administrador
app.post("/registro",function(req, res){
	var cliente = {
		ruc:req.body.ruc,
		razonsocial:req.body.razonsocial,
		direccion:req.body.direccion,
		email:req.body.email,
		telefono:req.body.telefono
	}
	var contacto1 = {
		nombres:req.body.contacto1nombres,
		apellidos:req.body.contacto1apellidos,
		email:req.body.contacto1email,
		telefono:req.body.contacto1telefono
	}
	var usuario = {
		ruc:req.body.ruc,
		contrasena:req.body.contrasena,
		rol:1,
		estado:1
	}

	try{
		clientedb.registrarCliente(cliente);
		usuariodb.registrarUsuario(usuario);

		var htmlAdmin = "<h3>Registro de nuevo cliente</h3><p>Se recibió una nueva solicitud de registro del cliente <b>" + cliente.razonsocial + "</b> identificado con ruc <b>" + cliente.ruc + "</b>.</p>" +
		"<p>Por favor ingresar a la sección de solicitudes de PARM para aprobar o rechazar la solicitud.</p>"+
		"<hr></hr>"+
		"<p>Area de sistemas de PARM</p>";
		enviarCorreo("parmperu@gmail.com","Confirmación de registro de nuevo cliente.",htmlAdmin);

		var htmlCliente = "<!DOCTYPE html>"+
		"<html>" +
		"<head>" +
		"<meta charset='utf-8'>" +
		"</head>" +
		"<body style='font-family: Calibri'>" +
		"<h3>Hola " + cliente.razonsocial + ",</h3>" +
		"<p>Estás recibiendo este correo porque recientemente te has registrado en la plataforma PARM con esta dirección de correo electrónico.<br>" +
		"Estamos validando tu registro, espera nuestro correo de confirmación para que procedas con la activación de la cuenta.</p>" +
		"<p>¡Gracias por confiar en la plataforma PARM!</p>" +
		"</body>" +
		"</html>";
		enviarCorreo(cliente.email,"Registro de cuenta PARM", htmlCliente);

		res.render("registrook",{email:cliente.email});
	}catch(err){
		console.log(err);
		res.render("registroerror");
	}
});

app.post("/iniciarsesion",function(req,res){
	var ruc = req.body.ruc;
	var contrasena = req.body.contrasena;

	var queryuser = usuariodb.autentificacionUsuario(ruc, contrasena);

	if(queryuser.length == 1) {
		var queryusuario = queryuser[0];
		if(queryusuario.ESTADO == '3'){
			req.session.usuario = queryuser[0];
			res.redirect("/parmsecure/index");
		} else {
			res.render("login",{alert:"La cuenta aún no ha sido activada."});
		}
		
	} else {
		res.render("login",{error:"Los datos ingresados no son correctos."});
	}
});

app.post("/solicitarreseteo", function (req, res) {
	var ruc = req.body.ruc;

	try{
		var codigoReseteo = codigoAleatorio("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",16);

		var cliente = clientedb.buscarClienteXRuc(ruc);
		usuariodb.solicitarReseteoContrasena(ruc, codigoReseteo);
		//usuariodb.resetearContrasena(ruc,codigoAleatorio);

		var htmlbody = "<3>Estimado Cliente,</h3>" + 
		"<p>Hemos recibido una solicitud de reseteo de contraseña, si usted la solicitó, por favor haga click en el siguiente enlace:</p>" +
		"<p><a href='http://www.parmperu.com.pe/resetearcontrasena?ruc='" + ruc + "'&cod='" + codigoReseteo + "'></a></p>" +
		"<p>Si usted no la solicitó por favor omitir este mensaje.</p>";

		console.log(cliente.CORREO);

		enviarCorreo(cliente.CORREO, "Solicitud de reseteo de contraseña", htmlbody);

		console.log("todo bien");

		res.render("reseteocontrasenamsg",{
			ok:"¡La solicitud de reseteo de contraseña fue exitoso!",
			info:"Le hemos enviado un enlace a su dirección de correo electrónico para proceder con el siguiente paso de reseteo de contraseña."
		});

	} catch(err) {
		console.log("todo mal");
		console.log(err);
		res.render("reseteocontrasenamsg",{
			error:"¡Ups! Ocurrió un error durante el proceso de reseteo de su contraseña",
			info:"Por favor vuelve a intentarlo nuevamente."
		});
	}
});

app.post('/parmsecure/upload', upload.single('reclutas'), function (req, res) {
	var workbook = new Excel.Workbook();
	var jsonArray = [];
	req.session.ultimacarga = req.file.filename;
	workbook.xlsx.readFile('./uploads/' + req.file.filename).then(function() {
    	var worksheet = workbook.getWorksheet(1);
    	worksheet.eachRow(function(row, rowNumber){
    		if(rowNumber != 1) {
    			var correotmp;
	    		if(typeof row.values[8] === 'object'){
	    			correotmp = row.values[8].text;
	    		} else {
	    			correotmp = row.values[8];
	    		}

    			var json = {
    				nro:row.values[1],
    				colaborador:row.values[2],
    				puesto:row.values[3],
    				nombres:row.values[4],
    				apellidoPaterno:row.values[5],
    				apellidoMaterno:row.values[6],
    				celular:row.values[7],
    				correo:correotmp
    			}
    			jsonArray.push(json);
	    		//enviarSms(celular);
	    		//enviarCorreo(correo);
	    		//generarLlamada(celular);
    		}
    	});
    	res.render("reclutamiento",{reclutascargados:JSON.stringify(jsonArray)});
    });
});

// -- AJAX CALLS --
app.get("/parmsecure/admin/listarsolicitudespendientes",function(req,res){
	var solicitudes = clientedb.solicitudesPendientes();
	res.setHeader("content-type","text/json");
	res.send(solicitudes);
});

app.get("/parmsecure/admin/confirmarsolicitud",function(req, res){
	var seleccion = req.query.seleccion;
	var htmlbody = "<h3>Código de confirmación</h3>"+
	"<p>Estimado cliente, el presente correo contiene el enlace para la confirmación de su cuenta. Hacer click en el siguiente enlace para activar su cuenta.</p>";
	for (var i = seleccion.length - 1; i >= 0; i--) {
		var codigo = codigoAleatorio("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",16);
		usuariodb.actualizarCodigoConfirmacion(seleccion[i].ruc,codigo);
		htmlbody += "<p><a href='http://www.parmperu.com.pe/activarcuenta?ruc=" + seleccion[i].ruc + "&cod=" + codigo + "'>Activar tu cuenta</a></p>"
		enviarCorreo(seleccion[i].correo,"Código de confirmación PARM", htmlbody);
	}
	res.send("ok");
});

// -- ADICIONAL FUNCTIONS --
function enviarCorreo(email, asunto, htmlbody){
	var smtpConfig = {
	    host: 'smtp.gmail.com',
	    port: 465,
	    secure: true, // use SSL 
	    auth: {
	        user: 'parmperu@gmail.com',
	        pass: 'parmperu241803'
	    }
	};
	// create reusable transporter object using the default SMTP transport 
	var transporter = nodemailer.createTransport(smtpConfig);
	 
	// setup e-mail data with unicode symbols 
	var mailOptions = {
	    from: '"PARM PERU" <parmperu@gmail.com>', // sender address 
	    to: email, // list of receivers 
	    subject: asunto, // Subject line 
	    html: htmlbody // html body 
	};
	 
	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        return console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	    transporter.close();
	});
}

function codigoAleatorio(chars, lon){
	var codigo = "";
	for (var x=0; x < lon; x++)	{
		var ale = Math.floor(Math.random()*chars.length);
		codigo += chars.substr(ale, 1);
	}
	return codigo;
}

app.listen(app.get("port"), "0.0.0.0", function() {
	console.log("PARM Nodejs Server iniciado en el puerto " + app.get("port"));
});