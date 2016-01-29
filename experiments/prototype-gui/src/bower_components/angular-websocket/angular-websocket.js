angular
.module('ngWebsocket', [])
.service('WebSocketConnection', [ '$interval', '$rootScope',
  function($interval, $rootScope) {
    return function(relUri, onMessage) {
        // Internal state
        var i_ws = null;
        var i_timer = null;
        
        // Open a new WebSocket connection
        var i_connect = function() {
            if (!ws.socketUrl) {
              throw new Error("WebSocket URL is not set.");
            }

            // Wire up events
            i_ws = new WebSocket(ws.socketUrl);
            i_ws.onopen = events.i_on_ws_open.bind($rootScope);
            i_ws.onerror = events.i_on_ws_error.bind($rootScope);
            i_ws.onmessage = events.i_on_ws_message.bind($rootScope);
            i_ws.onclose = events.i_on_ws_close.bind($rootScope);
        };

        // Internal event methods
        var events = {
            i_on_ws_open: function(event) {
                $rootScope.$broadcast("open");
                i_timer = $interval(function() {
                    i_ws.send('{"ping":""}');
                }, 30000);
            },
            i_on_ws_error: function(event) {
                $rootScope.$broadcast("error", {data: event});
            },
            i_on_ws_close: function(event) {
                if (i_timer) {
                    $interval.cancel(i_timer);
                    i_timer = null;
                }
                console.log("Disconnected!");
                console.log(event);
                $rootScope.$broadcast("close", { code: event.code, reason: event.reason});
            },
            i_on_ws_message: function(event) {
                var data = JSON.parse(event.data);
                if (!data.hasOwnProperty("pong")) {
                    onMessage(data);
                    $rootScope.$broadcast("message", data);
                }
            }
        };
        
        var l = window.location;
        var uri = {
            protocol: l.protocol.replace('http', 'ws'),
            hostname: '//' + l.hostname + (((l.port != 80) && (l.port != 443)) ? ":" + l.port : ""),
            basePath: l.pathname,
            relPath: relUri,
            get: function() {
                return uri.protocol + uri.hostname + uri.basePath + uri.relPath;
            }
        };
        
        // Returned public fields / methods
        var ws = {
            socketUrl: uri.get(),
            message: null,
            close: function(reason) {
                if (i_ws) {
                    i_ws.close(reason);
                    i_ws = null;
                }
            },
            reconnect: function() {
                ws.close("reconnect");
                i_connect();
            },
            send: function(message) {
                if (i_ws) {
                  i_ws.send(JSON.stringify(message));
                } else {
                  throw new Error("WebSocket is not connected.");
                }
            },
            ping: function() {
                i_ws.send('{"ping":""}');
            }
        };
        
        return ws;
    };
  }]);