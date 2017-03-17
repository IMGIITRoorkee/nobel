const express = require('express');
const app = express();

const http = require('http').Server(app);
const socketIo = require('socket.io')(http, {
    'pingInterval': 2000,
    'pingTimeout': 5000
});

const biginteger = require('./biginteger.js');
const BigInteger = biginteger.BigInteger;
const constants = require('./constants.js');
const open = require('open');
const request = require('request');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(express.static('client-side-static'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var imgIsOn = false;
var usersDict = {}; // Cheap database alternative ;p

function getName(firstCode, secondCode) {
    var encrypted1 = BigInteger.parse(firstCode);
    var encrypted2 = BigInteger.parse(secondCode);
    var encrypted1String = encrypted1.toString();
    var n = BigInteger.parse(constants.N); // Requires constants
    var d = BigInteger.parse(constants.D); // Requires constants
    var decrypted1 = encrypted1.modPow(d, n);
    var decrypted2 = encrypted2.modPow(d, n);
    var decrypted1String = decrypted1.toString();
    var decrypted2String = decrypted2.toString();
    var i = 2;
    var name = '';
    do {
        var a = parseInt(decrypted1String.substring(0, i));
        name = name + String.fromCharCode(a);
    } while ((decrypted1String = decrypted1String.substring(i, decrypted1String.length)) != '');
    return {
        'name': name,
        'passesTest': encrypted1String === decrypted2String
    };
}

function getMembersList() {
    var membersList = '';
    for (var key in usersDict) {
        membersList += usersDict[key] + ', ';
    }
    membersList = membersList.substring(0, membersList.length - 2);
    if (membersList.indexOf(',') === -1) {
        console.log('The only member is ' + membersList);
    } else {
        console.log('Members are ' + membersList);
    }
    return membersList;
}

app.get('/', function (req, res) {
    console.log('GET request on /');
    res.sendFile(__dirname + '/views/standard404.html');
}

app.get('/:firstCode/:secondCode', function (req, res) {
    console.log('GET request on /:firstCode/:secondCode');

    try {
        var nameObject = getName(req.params.firstCode, req.params.secondCode);
        var decryptedName = nameObject['name'];
        if (nameObject['passesTest']) {
            if (decryptedName === constants.LAB_END_NAME) {
                console.log('Username is ' + constants.LAB_END_NAME);
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
                res.sendFile(__dirname + '/views/index.html');
            }
            else {
                request({
                    uri: constants.NAME_URL, // Requires constants
                    headers: {
                        'Cookie': 'CHANNELI_SESSID=' + req.cookies.CHANNELI_SESSID
                    }
                }, function (error, response) {
                    var sessionName = JSON.parse(response.body).name;
                    console.log('Name obtained from CHANNELI_SESSID is ' + sessionName);
                    console.log('Name obtained from decrypting URL is ' + decryptedName);
                    if (sessionName === decryptedName) {
                        console.log('True IMGian, sending to chat');
                        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                        res.setHeader("Pragma", "no-cache");
                        res.setHeader("Expires", "0");
                        res.sendFile(__dirname + '/views/index.html');
                    } else {
                        console.log('404: Session ID verification failed, possible URL copying');
                        res.sendFile(__dirname + '/views/standard404.html');
                    }
                });
            }
        }
        else {
            console.log('404: Decyption failed, possible outsider');
            res.sendFile(__dirname + '/views/standard404.html');
        }
    }
    catch (exception) {
        console.log('404: Exception occurred and was caught');
        console.log(exception);
        res.sendFile(__dirname + '/views/standard404.html');
    }
});

app.post('/name', function (req, res) {
    console.log('POST request on /name');

    var url = req.body.url;
    var urlParts = url.split('/');
    var firstCode = urlParts[3];
    var secondCode = urlParts[4];

    var nameObject = getName(firstCode, secondCode);
    var name = nameObject['name'];
    if (nameObject['passesTest']) {
        console.log('Name decrypted to ' + name);
    } else {
        console.log('Name failed decryption, sending false');
        name = false;
    }
    res.send({
        'name': name
    });
});

app.get('/members', function (req, res) {
    console.log('GET request on /members');

    res.send(getMembersList());
});

socketIo.use(function (socket, next) {
    var name = socket.handshake.query.name;
    console.log('Name given in socket handshake is ' + name);
    usersDict[socket.id] = name;
    if (name === constants.LAB_END_NAME) {
        imgIsOn = true;
    }
    return next();
});

socketIo.on('connection', function (socket) {
    if (usersDict[socket.id] !== constants.LAB_END_NAME && !imgIsOn) {
        console.log('Open the lab view on .157');
        open(constants.LAB_END_URL); // Requires constants

        console.log('Play music');
        open(__dirname + '/server-side-static/notification-audio.mp3');
    }

    socketIo.emit('chat_message', usersDict[socket.id] + ' has joined the conversation');
    socketIo.emit('members_update', getMembersList());

    socket.on('chat_message', function (msg) {
        socketIo.emit('chat_message', msg);
    });

    socket.on('disconnect', function () {
        var droppedUser = usersDict[socket.id];
        console.log("Just dropped " + droppedUser);
        if (droppedUser === constants.LAB_END_NAME) {
            imgIsOn = false;
        }
        delete usersDict[socket.id];
        socketIo.emit('chat_message', droppedUser + ' has left the conversation');
        socketIo.emit('members_update', getMembersList());
    });
});

http.listen(3000, function () {
    console.log('Server started. Listening for requests on port 3000!');
});
