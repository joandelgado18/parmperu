function initDBconnection() {
	var db2;
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices['dashDB']){
			db2 = vcapServices['dashDB'][0].credentials;
		}
	} else{
		//console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		db2 = {
			db: "PARMDB",
	        hostname: "localhost",
	        port: 50000,
	        username: "db2admin",
	        password: "db2admin"
		};
	}
	return "DRIVER={DB2};DATABASE=" + db2.db + ";UID=" + db2.username + ";PWD=" + db2.password + ";HOSTNAME=" + db2.hostname + ";port=" + db2.port;
}

module.exports.initDBconnection = initDBconnection;