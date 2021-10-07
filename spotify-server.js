const express = require('express')
var request = require('request'); // "Request" library

const app = express()
const port = 3000

var allowCrossDomain = function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
}

app.use(allowCrossDomain);

const http = require('http').Server(app);
const io = require('socket.io')(http,
    {
        cors: {
            origin: '*',
        }
    }
);

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

var client_id = 'f510c562c1da4459b8aef7eb37b9950f'; // Your client id
var client_secret = '43f7c765cc444ac4be932dd2e55876f1'; // Your secret
var redirect_uri = 'http://localhost:4200/room-admin'; // Your redirect uri

let rooms = {}

io.on("connection", socket => {

    socket.on("newRoom", (admin) => {
        if (admin && rooms != {}) {
            rooms = {
                ACCESS_TOKEN: admin.access_token,
                USER_ADMIN: admin.user,
                FILE_ATTENTE: []
            }
        }
    });

    socket.on("addPlaylist", (datas) => {
        if (rooms) {
            rooms.FILE_ATTENTE = datas.PLAYLIST
            io.emit("sendPlaylistBack", rooms.FILE_ATTENTE);
        } 
    });

    socket.on("getPlaylist", () => {
        if (rooms) {
            io.emit("sendPlaylistBack",rooms.FILE_ATTENTE)
        } else {
            console.error("Bad ID")
            io.send("errorIdRoom")
        }
    });

    socket.on("newUser", () => {
        io.emit("getAccessToken", rooms.ACCESS_TOKEN)
    })

    socket.on("addSong", (song) => {
        rooms.FILE_ATTENTE.unshift({track: song})
        io.emit("sendPlaylistBack", rooms.FILE_ATTENTE);
    })

    socket.on("remove", () => {
        rooms.FILE_ATTENTE.shift()
        io.emit("sendPlaylistBack", rooms.FILE_ATTENTE);
    })

    socket.on("removeSong", (pos) => {
        rooms.FILE_ATTENTE.splice(pos, 1)
        io.emit("sendPlaylistBack", rooms.FILE_ATTENTE);
    })
});

app.get('/login-spotify', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        var promiseResult = {
            access_token: null,
            refresh_token: null,
            body: null
        }
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: req.query.CODE,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
        
        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                promiseResult.access_token = access_token
                promiseResult.refresh_token = refresh_token

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    promiseResult.body = body;
                    resolve(promiseResult)
                });
            };
        })
    })
    res.json(resultat)
})

app.get('/refresh_token', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        promiseResult = {
            access_token: null,
            body: null
        }
        var refresh_token = req.query.TOKEN;
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                promiseResult.access_token = body.access_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': 'Bearer ' + body.access_token
                    },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    promiseResult.body = body;
                    resolve(promiseResult)
                });
            }
        });
    })
    res.json(resultat)
});





app.get('/playlists', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        var options = {
            url: 'https://api.spotify.com/v1/me/playlists',
            headers: {
                'Authorization': 'Bearer ' + req.query.TOKEN
            },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
            resolve(body)
        });
    })
    res.json(resultat)
})

app.get('/data-url', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        var options = {
            url: req.query.URL,
            headers: {
                'Authorization': 'Bearer ' + req.query.TOKEN
            },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
            resolve(body)
        });
    })
    res.json(resultat)
})

app.get('/search', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        var options = {
            url: 'https://api.spotify.com/v1/search',
            qs: {
                q:req.query.VALUE,
                type: 'track',
                limit: 5
            },
            headers: {
                'Authorization': 'Bearer ' + req.query.TOKEN
            },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function (error, response, body) {
            resolve(body)
        });
    })
    res.json(resultat)
})

app.get('/play', async (req, res) => {
    const resultat = await new Promise((resolve, reject) => {
        var options = {
            url: 'https://api.spotify.com/v1/me/player/play',
            data: {
                context_uri:req.query.URI,
            },
            headers: {
                'Authorization': 'Bearer ' + req.query.TOKEN
            },
            json: true
        };

        // use the access token to access the Spotify Web API
        request.put(options, function (error, response, body) {
            resolve(body)
        });
    })
    res.json(resultat)
})

http.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});