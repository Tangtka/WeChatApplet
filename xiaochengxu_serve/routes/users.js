var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/xiaochengxu');
mongoose.connection.on("connected", function () {
    console.log("MongoDB connected success.连接")
});
mongoose.connection.on("error", function () {
    console.log("MongoDB connected fail.出错")
});
mongoose.connection.on("disconnected", function () {
    console.log("MongoDB connected disconnected.断开")
});
var Schema = mongoose.Schema;
var UsersModel = new Schema({
    userId: String,
    wxUsrInfo: { type: Object, default: null},
    sessionKey: String,
    openId: String,
    status:Number
});
var Users = mongoose.model('users',UsersModel);

var request = require('request');


/* GET users listing. */
router.post('/', function (req, res, next) {
    var appid='wx6fddb86515e3b298',
        secret='affe781fc054c0a6497b65b7dc9a914c',
        js_code=req.body.code,
        session_key='',
        openid='';
    request('https://api.weixin.qq.com/sns/jscode2session?appid='+appid+'&secret='+secret+'&js_code='+js_code+'&grant_type=authorization_code', function (error, response, body) {
        if(error){
            res.json({
                message:error,
                status:response && response.statusCode,
                data:{},
            })
        }
        var wxbody = JSON.parse(body);
        session_key = wxbody.session_key;
        openid = wxbody.openid;

        //判断是否存在，不存在就注册，存在直接返回用户信息
        Users.findOne({ openId: openid }, function (err, data) {
            if(err){
                res.json({
                    message:error,
                    status:0,
                    data:{},
                })
            }
            if(data){
                //存在
                res.json({
                    message:'存在该用户',
                    status:1,
                    data:data,
                })
            }else{
                // 不存在
                var params = {
                    userId:'tk'+new Date().getTime(),
                    wxUsrInfo:null,
                    sessionKey:session_key,
                    openId:openid,
                    status:1
                };
                Users.create(params, function (userErr, user) {
                    if(userErr){
                        res.json({
                            message:userErr,
                            status:0,
                            data:'添加用户出错',
                        })
                    }
                    if(user){
                        res.json({
                            message:'添加成功',
                            status:1,
                            data:user,
                        })
                    }
                });
            }

        });
    });

});

router.post('/edit', function (req, res, next) {
    var userInfo = req.body.userInfo,userId = req.body.userId;
    Users.findOne({ userId: userId }, function (err, user) {
        if(err){
            res.json({
                message:err,
                status:0,
                data:{},
            })
        }
        if(user){
            user.wxUsrInfo = JSON.parse(userInfo);

            user.save(user,function (saveErr,saevUser) {
                if(saveErr){
                    res.json({
                        message:saveErr,
                        status:0,
                        data:{},
                    })
                }

                if (saevUser){
                    res.json({
                        message:'更新成功',
                        status:1,
                        data:saevUser,
                    })
                }
            })

        }else{
            res.json({
                message:'查询不到该用户',
                status:0,
                data:{},
            })
        }
    })
});


module.exports = router;
