'use strict';
var ibmdb = require("ibm_db");
var dbConn = require("./db2.js");

var connString = dbConn.initDBconnection();

var options = { connectTimeout : 20 }; // time out de 20 segundos para todas las conexiones sincronas

var qListarClientes = "SELECT * FROM PARM.TBL_CLIENTE";
function listarClientes(){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qListarClientes);
	conn.closeSync();
	return resultado;
}

var qRegistrarCliente = "INSERT INTO PARM.TBL_CLIENTE(RUC,RAZON_SOCIAL,DIRECCION,TELEFONO,CORREO) VALUES";
function registrarCliente(cliente){
	var conn = ibmdb.openSync(connString, options);
	var result = conn.querySync(qRegistrarCliente+"('" + cliente.ruc + "','" + cliente.razonsocial + "','" + cliente.direccion + "','" + cliente.telefono + "','" + cliente.email + "')");
	conn.closeSync();
}

var qSolicitudesPendientes = "SELECT TC.RUC,TC.RAZON_SOCIAL,TC.CORREO,TC.TELEFONO,TU.ESTADO FROM PARM.TBL_USUARIO TU LEFT JOIN PARM.TBL_CLIENTE TC ON TU.RUC=TC.RUC WHERE ESTADO<3;"
function solicitudesPendientes(){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qSolicitudesPendientes);
	conn.closeSync();
	return resultado;
}

var qBuscarClienteXRuc = "SELECT * FROM PARM.TBL_CLIENTE WHERE RUC=";
function buscarClienteXRuc(ruc){
	var conn = ibmdb.openSync(connString, options);
	var resultado = conn.querySync(qBuscarClienteXRuc + "'" + ruc + "'");
	conn.closeSync();
	return resultado;
}

module.exports.listarClientes = listarClientes;
module.exports.registrarCliente = registrarCliente;
module.exports.solicitudesPendientes = solicitudesPendientes;
module.exports.buscarClienteXRuc = buscarClienteXRuc;