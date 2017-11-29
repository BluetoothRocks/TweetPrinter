const TwitterStream = require('twitter-stream-api');
const WebSocket = require('ws');


/* Create WebSocket server */

const wss = new WebSocket.Server({ port: 8888 });

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};


/* Stream tweets from the Twitter API */

var keys = {
    consumer_key : "",
    consumer_secret : "",
    token : "",
    token_secret : ""
};

var Twitter = new TwitterStream(keys, false);

Twitter.on('data', function (obj) {
    wss.broadcast(obj.toString());
});

Twitter.stream('statuses/filter', {
    track: 'javascript'
});
