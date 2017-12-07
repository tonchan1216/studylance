var express = require('express');
var router = express.Router();
var util = require('util');

//Database
var pg = require('pg');
var con = "postgres://jrvenknemncwiw:e30025c1205881535893b0a93dd41a2b6e4da3e17f425066f31484f2c566489f@ec2-54-243-39-245.compute-1.amazonaws.com:5432/d9dkdotlj74l6o";
con = con + '?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory';
//rid: room ID(ランダム文字列)生成
function rid_gen(){
	// 生成する文字列の長さ
	var l = 10;

	// 生成する文字列に含める文字セット
	var c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLNMOPQRSTUVWXYZ0123456789";
	var cl = c.length;
	var r = "";
	for(var i=0; i<l; i++){
	  r += c[Math.floor(Math.random()*cl)];
	}
	return r;
}

/* GET home page. */
router.get('/', function(req, res) {

	pg.connect(con, function(err, client) {
		var query_select = client.query('select sum(member_num) from rooms;');
		var user_num;
		query_select.on('row', function(row) {
			user_num = row.sum;
		});

		query_select.on('end', function(row,err) {
			res.render('index', { 
				title: 'Social Session Service!',
				user_num: user_num
			});
		});

		query_select.on('error', function(error) {
			res.send('Error:' + error);
		});
	});


});

router.get('/checkin/', function(req, res){
	var rid;
	var creater;

	pg.connect(con, function(err, client) {
		var query_select = client.query('select * from rooms where member_num < 5 order by member_num DESC;');
		var rows = [];
		query_select.on('row', function(row) {
			rows.push(row);
		});

		query_select.on('end', function(row,err) {
			if (rows.length > 0) {
				rid = rows[0].rid;
				creater = false;
			}else{
				rid = rid_gen();
				creater = true;
			}

	    res.json({
	    	message: 'success',
	    	rid: rid,
	    	creater: creater
	    });
		});

		query_select.on('error', function(error) {
	    res.json({
	    	message: error
	    });
		});
	});
});

router.get('/room/:rid', function(req, res) {
	var rid = req.params.rid;
	var creater = req.query.creater;

	pg.connect(con, function(err, client) {
		if (creater == 'true') {
			query_string = util.format("INSERT INTO rooms VALUES (1, '%s');", rid);
			var query_insert = client.query(query_string);

			query_insert.on('error', function(error) {
				console.log(error);
			});
		}else{
			query_string = util.format("UPDATE rooms SET member_num=member_num+1 where rid = '%s';", rid);
			var query_increment = client.query(query_string);

			query_increment.on('error', function(error) {
				console.log(error);
			});
		}
	});

	res.render('room', {
		title: 'Welcome',
		room_id: rid
	});
});

router.delete('/room/:rid', function(req, res) {
	var rid = req.params.rid;

	pg.connect(con, function(err, client) {
		var query_string = util.format("SELECT * FROM rooms where rid = '%s';", rid);
		var query_select = client.query(query_string);
		var rows = [];
		query_select.on('row', function(row) {
			rows.push(row);
		});

		query_select.on('end', function(row,err) {
			if (rows[0].member_num == 1) {
				query_string = util.format("DELETE FROM rooms WHERE rid = '%s';", rid);
				var query_delete = client.query(query_string);

				query_delete.on('end', function(row,err) {
					res.send('delete success');
				});

				query_delete.on('error', function(error) {
					res.send('delete Error:' + error);
				});
			}else{
				query_string = util.format("UPDATE rooms SET member_num=member_num-1 where rid = '%s';",rid);
				var query_decrement = client.query(query_string);

				query_decrement.on('end', function(row,err) {
					res.send('decrement success');
				});

				query_decrement.on('error', function(error) {
					res.send('decrement Error:' + error);
				});
			}
		});

		query_select.on('error', function(error) {
			res.send('select Error:' + error);
		});
	});

});

module.exports = router;
