/* global angular:false */

angular.module('ndslabs-directives', [])

.directive('terminal', [ '$log', '$window', '$location', 'AuthInfo', 'ApiHost', 'ApiPort', 
        function($log, $window, $location, AuthInfo, ApiHost, ApiPort) {
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
            term.on('data', function(data) { ws.send(data) });
            term.on('title', function(title) { $window.document.title = title; });
                    
            term.open(elem.find("div")[0]);
            $log.debug('Connected: ' + target);
        }
    }
}]);