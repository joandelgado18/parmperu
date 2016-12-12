var queryUserByEmail = {
  "selector": {
    "_id": {
      "$gt": 0
    },
    "$and":[
      {"email":""},
      {"password":""}
    ]
  }
};

function loginUserBd(req,res,user){
	queryUserByEmail.selector.$and[0].email = user.email;
	queryUserByEmail.selector.$and[1].password = user.password;
	db.find(queryUserByEmail,function(err, data) {
		if(!err) {
      console.log(data);
      var name = data.docs[0].name.split(' ')[0];
      var lastname = data.docs[0].lastname.split(' ')[0];
      req.session.email = data.docs[0].email;
      req.session.name = name + " " + lastname;
      res.render('inicio');
		} else {
			console.log(err);
			res.render('index');
		}
	});
}

module.exports.loginUserBd = loginUserBd;