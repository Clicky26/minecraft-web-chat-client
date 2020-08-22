const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var waitUntil = require('wait-until');

const options = require('./minecraft.json');
const mineflayer = require('mineflayer');
const Minecraft = mineflayer.createBot(options);
bindEvents(Minecraft);

app.get('/', function(req, res) {
    res.render('index.ejs');
});

function bindEvents(Minecraft) {
    Minecraft.on('chat', (username, message) => {
        if(username != Minecraft.username) {
            io.emit('chat_message', '<strong>' + username + '</strong>: ' + message);
        }
    });
  
    Minecraft.on('end', end => {
        io.emit('chat_message', '<i> I was just disconnected from the server!</i>');
        waitUntil(10000, 9999, function condition() {
          try {
            console.log("Bot ended, attempting to reconnect...");
                Minecraft = mineflayer.createBot(options);
                bindEvents(Minecraft);
                return true;
            } catch (error) {
                console.log("Error: " + error);
                return false;
            }
        }, function done(result) {
            console.log("Connection attempt result was: " + result);
        });
    });
  
    Minecraft.on('death', end => {
        io.emit('chat_message', '<i> I just died!</i>');
    });
  
    Minecraft.on('playerJoined', (player) => {
        io.emit('chat_message', String(player.username) + '<i> joined the game</i>');
    });
  
    Minecraft.on('playerLeft', (player) => {
        io.emit('chat_message', String(player.username) + '<i> left the game</i>');
    });
}

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the web chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the web chat..</i>');
    })

    socket.on('chat_message', function(message) {
        Minecraft.chat(`<${socket.username}> ${message}`)
        io.emit('chat_message', '(Web User) <strong>' + socket.username + '</strong>: ' + message);
        console.log(socket.username, message);
    });

});

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});