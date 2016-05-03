/* global angular:false */

angular.module('ndslabs-directives', [])

.directive('terminal', [ '$log', '$window', '$timeout', '$location', 'AuthInfo', 'ApiHost', 'ApiPort', 'NdsLabsApi',
        function($log, $window, $timeout, $location, AuthInfo, ApiHost, ApiPort, NdsLabsApi) {
    return {
        restrict: 'E',
        scope: {
            service: '='
        },
        template: '<span><div class="terminal"></div></span>',
        link: function(scope, elem, attrs) {
            if (!scope.service) {
                $log.error('No service id specified - aborting terminal connection.');
                return;
            }
            
            var term = new Terminal({
                cols: 80,
                rows: 24,
                screenKeys: true
            });
            
            var target = "ws://" + ApiHost + ":" + ApiPort + "/console?namespace=" + AuthInfo.get().namespace + "&ssid=" + scope.service;
            var ws = new WebSocket(target);

            ws.onclose = function() {
                $log.debug('Disconnected: ' + target);
                
                //term.destroy();
                term.write('Session has been terminated. You may now close this tab.');
                
                $location.path('/home');
                $window.close();
            };
        
            ws.onmessage = function (msg) { term.write(msg.data); };
            term.on('title', function(title) { $window.document.title = title; });
            
            var timeoutMs = 300;
            var timeout = null;
            term.on('data', function(data) { 
                if (timeout !== null) {
                    $timeout.cancel(timeout);
                    timeout = null;
                }
                
                ws.send(data);
                
                // Debounce the token check ~300ms
                timeout = $timeout(function() {
                    NdsLabsApi.getRefresh_token().then(function() { 
                        $log.debug('Token refreshed!'); 
                    }, function() {
                        ws.close();
                        $log.debug('Token expired! Disconnected: ' + target); 
                    });
                }, timeoutMs);
            });
            
            term.open(elem.find("div")[0]);
            $log.debug('Connected: ' + target);
        }
    }
}]);