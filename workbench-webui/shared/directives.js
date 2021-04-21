/* global angular:false Terminal:false */

angular.module('ndslabs-directives', [])

.directive('terminal', [ '$log', '$window', '$timeout', '$location', 'AuthInfo', 'ApiUri', 'NdsLabsApi', 'DashboardAppPath', 'HomePathSuffix',
        function($log, $window, $timeout, $location, AuthInfo, ApiUri, NdsLabsApi, DashboardAppPath, HomePathSuffix) {
  "use strict";

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
                cols: 100,
                rows: 30,
                screenKeys: true
            });
            
            // TODO: Ingress LB may not currently support WebSockets
            // See https://github.com/kubernetes/kubernetes/issues/24745
            // See https://github.com/nginxinc/kubernetes-ingress/issues/10
            var target = ApiUri.ws + "?namespace=" + AuthInfo.get().namespace + "&ssid=" + scope.service;
            var ws = new WebSocket(target);

            ws.onclose = function() {
                $log.debug('Disconnected: ' + target);
                
                //term.destroy();
                term.write('Session has been terminated. You may now close this tab.');
                
                $location.path(DashboardAppPath + HomePathSuffix);
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
                    NdsLabsApi.getRefreshToken().then(function() { 
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
    };
}]);
