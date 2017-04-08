var config = require('config')
var aiTypeValue = config.get('ChatBot.Connection.aiType');
var clientIdValue = config.get('ChatBot.Connection.clientId');
var portNo = config.get('ChatBot.Connection.portno');
var apiai = require(aiTypeValue);
var app1 = apiai(clientIdValue);
var express=require('express'),
    app=express(),
    http=require('http').createServer(app),
    io=require('socket.io').listen(http);

users = {};

var port = portNo;

http.listen(port);

console.log("entered");

app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');

app.get('/', function(req,res) {
    res.render('index');
});

io.sockets.on('connection', function(socket){
    console.log("Got connected for first instance");
    
    socket.on('new user',function(data,callback){
        if (data in users) {
            console.log("username already exists");
            callback(false);
        }
        else{
            console.log("username available");
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            io.sockets.emit('usernames',Object.keys(users));
        }
    });
    
    socket.on('send message', function(data,callback) {
        console.log("User Sending message");
        var request = app1.textRequest(data, {sessionId: socket.nickname});
        request.on('response', function(response) {
            var responseText = "";
            if(response.result.fulfillment.messages.length == 1) {
                responseText = response.result.fulfillment.messages[0].speech;
            }
            else if(response.result.fulfillment.messages.length == 2) {
                responseText = response.result.fulfillment.messages[0].speech;
                //response.result.fulfillment.messages[1].replies.length
                for(var iIndex = 0;iIndex < response.result.fulfillment.messages[1].replies.length;iIndex++) {
                    respText = response.result.fulfillment.messages[1].replies[iIndex]
                    responseText = responseText + " ::: " + respText;
                }
            }
            io.sockets.emit('new message', {msg:responseText,nick:"VenkiBot"});
        });
        request.on('error', function(error) {
            console.log(error);
        });
        request.end()
        io.sockets.emit('new message', {msg:data,nick:socket.nickname});
    });
    
    socket.on('disconnect',function(data) {
        if(!socket.nickname) return;
        delete users[socket.nickname];
        io.sockets.emit('usernames',Object.keys(users));
    });
    
});