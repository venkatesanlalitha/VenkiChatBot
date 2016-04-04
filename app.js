var express=require('express'),
    app=express(),
    http=require('http').createServer(app),
    io=require('socket.io').listen(http);

users = {};

var port = 4000;

http.listen(port);

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
        io.sockets.emit('new message', {msg:data,nick:socket.nickname});
    });
    
    socket.on('disconnect',function(data) {
        if(!socket.nickname) return;
        delete users[socket.nickname];
        io.sockets.emit('usernames',Object.keys(users));
    });
    
});