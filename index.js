const express = require('express');
const http = require('http');
const socket = require('socket.io');

const port = process.env.PORT || 8080

var app = express();
const server = http.createServer(app)
const io = socket(server)
var joined = true;

app.use(express.static(__dirname + "/"));

var games = Array(100);
for (let i = 0; i < 100; i++) {
    games[i] = {players: []};
}


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});



io.on('connection', function (socket) {
    // console.log(players);
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1)
    var room
    function getOtherPlayer(){
        return games[room]?.players.filter((x)=>x.id!=playerId)?.[0]
    }

    console.log(playerId + ' connected');

    socket.on('joined', function (roomId) {
        console.log(games[roomId]);
        console.log(games[roomId].players.length)
        if (games[roomId].players.length < 2) {
            games[roomId].players.push({id: playerId, socket: socket});
            room = roomId
        }
        else{
            socket.emit('full', roomId)
            return;
        }
        
        let players = games[roomId].players
        

        if (players.length % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players:players.length, color, roomId })
        // players--;

        
    });

    socket.on('move', function (msg) {
        getOtherPlayer()?.socket.emit('move', msg)
        // console.log(msg);
    });

    socket.on('play', function (msg) {
        getOtherPlayer()?.socket.emit('play', msg);
        console.log("ready " + msg);
    });
    
    socket.on('disconnect', function () {
        console.log(playerId + ' disconnected');
        getOtherPlayer()?.socket.emit('disconnected', {})
        if(room){
            games[room].players = []
            room=undefined
        }
    }); 
    socket.on('gameOver', function (msg) {
        getOtherPlayer()?.socket.emit('gameOver', msg);
    });
    socket.on('pieceCount', function (msg){
        console.log(msg)
        getOtherPlayer()?.socket.emit('pieceCount', msg);
    })

    
});

server.listen(port);
console.log('Connected');