var user;
var socket;

var hidden, visibilityChange, shown, doNotHidden;
if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
}

doNotHidden = function() {
    init();
    shown = true;
};

if(!document[hidden]) {
    doNotHidden();
}

if(document.addEventListener) {
    document.addEventListener(visibilityChange, function() {
        if(!document[hidden] && !shown) {
            doNotHidden();
        }
    });
}

$('form').submit(submitForm);

function init() {
    $.ajax({
        type: 'POST',
        url: window.location.origin + '/name',
        dataType: 'json',
        data: {
            'url': window.location.href
        },
        success: function (responseData) {
            user = responseData.name;
            if (!user) {
                return;
            }

            $.ajax({
                type: 'GET',
                url: window.location.origin + '/members',
                success: function (responseData) {
                    if (responseData.indexOf(',') === -1) {
                        $('#members-area').html('<i class="user icon"></i><strong>The only member is ' + responseData + '</strong>&nbsp;&nbsp;<a href="https://channeli.in/logout" id="logout" class="ui blue button">Logout of Channel i</a>');
                    } else {
                        $('#members-area').html('<i class="users icon"></i><strong>Members are ' + responseData + '</strong>&nbsp;&nbsp;<a href="https://channeli.in/logout" id="logout" class="ui blue button">Logout of Channel i</a>');
                    }
                    if (user === 'IMGLAB') {
                        $('#logout').delete();
                    }
                }
            });

            socket = io(window.location.origin, {
                query: 'name=' + user
            });

            socket.on('chat_message', function (msg) {
                var audio = new Audio('http://nobel.channeli.in/bell.mp3');
                audio.play();
                $('#messages').append($('<li>').html('' + msg + ''));
                var messageArea = document.getElementById('message-area');
                messageArea.scrollTop = messageArea.scrollHeight;
            });

            socket.on('members_update', function(members) {
                if (members.indexOf(',') === -1) {
                    $('#members-area').html('<i class="user icon"></i><strong>The only member is ' + members + '</strong>&nbsp;&nbsp;<a href="https://channeli.in/logout" id="logout" class="ui blue button">Logout of Channel i</a>');
                } else {
                    $('#members-area').html('<i class="users icon"></i><strong>Members are ' + members + '</strong>&nbsp;&nbsp;<a href="https://channeli.in/logout" id="logout" class="ui blue button">Logout of Channel i</a>');
                }
                if (user === 'IMGLAB') {
                    $('#logout').delete();
                }
            });
        }
    });
}

function submitForm() {
    var $m = $('#m');
    socket.emit('chat_message', user + ': ' + $m.val());
    $m.val('');
    return false;
}