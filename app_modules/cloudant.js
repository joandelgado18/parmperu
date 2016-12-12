var dbCredentials = {
	dbName : 'proyectorhdb'
};
function initDBConnection() {
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		for(var vcapService in vcapServices){
			if(vcapService.match(/cloudant/i)){
				dbCredentials.host = vcapServices[vcapService][0].credentials.host;
				dbCredentials.port = vcapServices[vcapService][0].credentials.port;
				dbCredentials.user = vcapServices[vcapService][0].credentials.username;
				dbCredentials.password = vcapServices[vcapService][0].credentials.password;
				dbCredentials.url = vcapServices[vcapService][0].credentials.url;
				
				cloudant = require('cloudant')(dbCredentials.url);
				
				// check if DB exists if not create
				cloudant.db.create(dbCredentials.dbName, function (err, res) {
					if (err) { console.log('No se pudo crear la base de datos: ', err); }
				});
				
				db = cloudant.use(dbCredentials.dbName);
				break;
			}
		}
		if(db==null){
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');
		dbCredentials.host = "afb7f96a-5b1d-4e2e-9249-e73ddb11d191-bluemix.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "afb7f96a-5b1d-4e2e-9249-e73ddb11d191-bluemix";
		dbCredentials.password = "afd66fbcab8400e4763a125d68802909bc7d9c5098c4d75e964fbe7c140f9cba";
		dbCredentials.url = "https://afb7f96a-5b1d-4e2e-9249-e73ddb11d191-bluemix:afd66fbcab8400e4763a125d68802909bc7d9c5098c4d75e964fbe7c140f9cba@afb7f96a-5b1d-4e2e-9249-e73ddb11d191-bluemix.cloudant.com";
		
		cloudant = require('cloudant')(dbCredentials.url);
		
		// check if DB exists if not create
        cloudant.db.create(dbCredentials.dbName, function (err, res) {
        	if (err) { console.log('No se pudo crear la base de datos: ', err); }
        });
            
        db = cloudant.use(dbCredentials.dbName);
	}
}

module.exports.initDBConnection = initDBConnection;