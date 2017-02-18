'use strict';
var ibmdb = require("ibm_db");
var dbConn = require("./db2.js");

var connString = dbConn.initDBconnection();

var options = { connectTimeout : 20 }; // time out de 20 segundos para todas las conexiones sincronas

var qListarUsuarios = "SELECT * FROM PARM.TBL_USUARIO";
function listarUsuarios(){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qListarUsuarios);
	conn.closeSync();
	return resultado;
}

var qRegistrarUsuario = "INSERT INTO PARM.TBL_USUARIO(RUC,CONTRASENA,ROL,ESTADO,FECHA_HORA_REGISTRO,FECHA_HORA_ACTUALIZACION) VALUES";
function registrarUsuario(usuario){
	var conn = ibmdb.openSync(connString, options);
	var result = conn.querySync(qRegistrarUsuario+"('" + usuario.ruc + "','" + usuario.contrasena + "','" + usuario.rol + "','" + usuario.estado + "',CURRENT TIMESTAMP, CURRENT TIMESTAMP)");
	conn.closeSync();
}

var qAutentificarUsuario = "SELECT TC.RUC,TC.RAZON_SOCIAL,TU.ROL,TU.ESTADO FROM PARM.TBL_USUARIO TU LEFT JOIN PARM.TBL_CLIENTE TC ON TU.RUC=TC.RUC WHERE ";
function autentificacionUsuario(ruc, contrasena){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qAutentificarUsuario+"TU.RUC='" + ruc + "' AND TU.CONTRASENA='" + contrasena + "'");
	conn.closeSync();
	return resultado;
}

var qActualizarCodigoConfirmacion = "UPDATE PARM.TBL_USUARIO SET ESTADO='2',";
function actualizarCodigoConfirmacion(ruc,codigoconfirmacion){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qActualizarCodigoConfirmacion+"CODIGO_CONFIRMACION='" + codigoconfirmacion + "' WHERE RUC='" + ruc + "'");
	conn.closeSync();
}

var qActivarCuenta = "UPDATE PARM.TBL_USUARIO SET ESTADO='3' WHERE "
function activarCuenta(ruc,codigoconfirmacion){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qActivarCuenta + "RUC='" + ruc + "' AND CODIGO_CONFIRMACION='" + codigoconfirmacion + "'");
	conn.closeSync();
}

var qSolicitarReseteoContrasena = "UPDATE PARM.TBL_USUARIO ";
function solicitarReseteoContrasena(ruc, codigoreseteo){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qSolicitarReseteoContrasena + "SET CODIGO_RESETEO='" + codigoreseteo + "' WHERE RUC='" + ruc + "'");
	conn.closeSync();
}

var qResetearContrasena = "UPDATE PARM.TBL_USUARIO ";
function resetearContrasena(ruc,contrasena,codigoreseteo){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qResetearContrasena + "SET CONTRASENA='" + contrasena + "' WHERE RUC='" + ruc + "' AND CODIGO_RESETEO='" + codigoreseteo + "'");
	conn.closeSync();
}

module.exports.listarUsuarios = listarUsuarios;
module.exports.registrarUsuario = registrarUsuario;
module.exports.autentificacionUsuario = autentificacionUsuario;
module.exports.actualizarCodigoConfirmacion = actualizarCodigoConfirmacion;
module.exports.activarCuenta = activarCuenta;
module.exports.resetearContrasena = resetearContrasena;
module.exports.solicitarReseteoContrasena = solicitarReseteoContrasena;