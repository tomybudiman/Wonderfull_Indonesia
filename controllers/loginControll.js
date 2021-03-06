const FB=require("fb");
const jwt=require("jsonwebtoken");
const jwtSecret=process.env.JWT_SECRET;
const ObjectId=require('mongodb').ObjectID;
const User=require("../models/userModel");
const nodemailer=require("nodemailer");

const sendEmail=(username,useremail)=>{
    const transporter=nodemailer.createTransport({
        host:"smtp.gmail.com",
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:"testemailajah@gmail.com",
            pass:"testemail12345"
        }
    });
    const mailContent={
        from:"noreply_indonesia@gmail.com",
        to:useremail,
        subject:"Terimakasih!",
        text:`Terimakasih ${username} telah mendaftar sebagai beta user dengan email ${useremail}`
    };
    transporter.sendMail(mailContent,(err)=>{
        if(err){
            console.log("Email gagal terkirim!");
        }
    });
}

module.exports={
    login:(req,res)=>{
        FB.setAccessToken(req.body.accessToken);
        FB.api(req.body.userID,{fields:["id","name","email","picture"]},(response)=>{
            if(!response || response.error){
                res.send({status:false});
            }else{
                // res.send({status:true,token:"loginToken"});
                User.count({email:response.email}).then((result)=>{
                    if(result === 0){ // Jika user telah ditemukan dalam database
                        const user=new User({
                            fb_id:response.id,
                            email:response.email,
                            name:response.name,
                            profile:response.picture.data.url
                        }).save((err,stats)=>{
                            const loginToken=jwt.sign({id:stats._id},jwtSecret);
                            res.send({status:true,token:loginToken});
                        });
                        sendEmail(response.name,response.email);
                    }else{
                        User.findOne({email:response.email},(err,data)=>{
                            const loginToken=jwt.sign({id:data._id},jwtSecret);
                            res.send({status:true,token:loginToken});
                        });
                    }
                }).catch((err)=>{
                    res.send({status:false});
                });
            }
        });
    },
    getuser:(req,res)=>{
        const userId=jwt.verify(req.body.token,jwtSecret);
        User.findOne({"_id":ObjectId(userId.id)},(err,data)=>{
            if(err || data === null){
                res.send({status:false});
            }else{
                res.send({status:true,user:data});
            }
        });
    }
};
