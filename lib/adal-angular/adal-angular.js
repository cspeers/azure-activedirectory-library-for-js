/// <reference path="../../typings/angularjs/angular.d.ts" />
var adal = require("../adal/adal/adal");
var AdalModule;
(function (AdalModule_1) {
    var AuthenticationContext = adal.AuthenticationContext;
    /**
    * @description module dependency injection for commonjs
    *
    * @param config {Config} The Authentication Context configuration to be used
    */
    function inject(config) {
        return new AuthenticationContext(config);
    }
    var AdalAuthenticationService = (function () {
        function AdalAuthenticationService(authContext, oauthData, $q) {
            // public methods will be here that are accessible from Controller
            this.config = authContext.config;
            this.userInfo = oauthData;
            this.login = function () {
                authContext.login();
            };
            this.loginInProgress = function () {
                return authContext.loginInProgress();
            };
            this.logOut = function () {
                authContext.logOut();
                //call signout related method
            };
            this.getCachedToken = function (resource) {
                return authContext.getCachedToken(resource);
            };
            this.userInfo = oauthData;
            this.acquireToken = function (resource) {
                // automated token request call
                var deferred = $q.defer();
                authContext.acquireToken(resource, function (error, tokenOut) {
                    if (error) {
                        authContext.error("Error when acquiring token for resource: " + resource, error);
                        deferred.reject(error);
                    }
                    else {
                        deferred.resolve(tokenOut);
                    }
                });
                return deferred.promise;
            };
            this.getUser = function () {
                var deferred = $q.defer();
                authContext.getUser(function (error, user) {
                    if (error) {
                        authContext.error("Error when getting user", error);
                        deferred.reject(error);
                    }
                    else {
                        deferred.resolve(user);
                    }
                });
                return deferred.promise;
            };
            this.getResourceForEndpoint = function (endpoint) {
                return authContext.getResourceForEndpoint(endpoint);
            };
            this.clearCache = function () {
                authContext.clearCache();
            };
            this.clearCacheForResource = function (resource) {
                authContext.clearCacheForResource(resource);
            };
            this.info = function (message) {
                authContext.info(message);
            };
            this.verbose = function (message) {
                authContext.verbose(message);
            };
        }
        return AdalAuthenticationService;
    })();
    var AdalServiceProvider = (function () {
        function AdalServiceProvider() {
            var _adal = null;
            var _oauthData = { isAuthenticated: false, userName: "", loginError: "", profile: null };
            var updateDataFromCache = function (resource) {
                // only cache lookup here to not interrupt with events
                var token = _adal.getCachedToken(resource);
                _oauthData.isAuthenticated = token !== null && token.length > 0;
                var user = _adal.getCachedUser() || { userName: "", profile: null };
                _oauthData.userName = user.userName;
                _oauthData.profile = user.profile;
                _oauthData.loginError = _adal.getLoginError();
            };
            this.init = function (configOptions, httpProvider) {
                if (configOptions) {
                    // redirect and logout_redirect are set to current location by default
                    var existingHash = window.location.hash;
                    var pathDefault = window.location.href;
                    if (existingHash) {
                        pathDefault = pathDefault.replace(existingHash, "");
                    }
                    configOptions.redirectUri = configOptions.redirectUri || pathDefault;
                    configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;
                    if (httpProvider && httpProvider.interceptors) {
                        httpProvider.interceptors.push("ProtectedResourceInterceptor");
                    }
                    // create instance with given config
                    _adal = new AuthenticationContext(configOptions);
                }
                else {
                    throw new Error("You must set configOptions, when calling init");
                }
                // loginresource is used to set authenticated status
                updateDataFromCache(_adal.config.loginResource);
            };
            // special function that exposes methods in Angular controller
            // $rootScope, $window, $q, $location, $timeout are injected by Angular
            this.$get = [
                "$rootScope", "$window", "$q", "$location", "$timeout",
                function ($rootScope, $window, $q, $location, $timeout) {
                    var locationChangeHandler = function () {
                        var hash = $window.location.hash;
                        if (_adal.isCallback(hash)) {
                            // callback can come from login or iframe request
                            var requestInfo = _adal.getRequestInfo(hash);
                            _adal.saveTokenFromHash(requestInfo);
                            if ($location.$$html5) {
                                $window.location.assign($window.location.origin + $window.location.pathname);
                            }
                            else {
                                $window.location.hash = "";
                            }
                            if (requestInfo.requestType !== _adal.REQUEST_TYPE.LOGIN) {
                                _adal.callback = $window.parent.AuthenticationContext().callback;
                                if (requestInfo.requestType === _adal.REQUEST_TYPE.RENEW_TOKEN) {
                                    _adal.callback = $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                                }
                            }
                            // Return to callback if it is send from iframe
                            if (requestInfo.stateMatch) {
                                if (typeof _adal.callback === "function") {
                                    // Call within the same context without full page redirect keeps the callback
                                    if (requestInfo.requestType === _adal.REQUEST_TYPE.RENEW_TOKEN) {
                                        // Idtoken or Accestoken can be renewed
                                        if (requestInfo.parameters["access_token"]) {
                                            _adal.callback(_adal.getItem(_adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["access_token"]);
                                            return;
                                        }
                                        else if (requestInfo.parameters["id_token"]) {
                                            _adal.callback(_adal.getItem(_adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                                            return;
                                        }
                                    }
                                }
                                else {
                                    // normal full login redirect happened on the page
                                    updateDataFromCache(_adal.config.loginResource);
                                    if (_oauthData.userName) {
                                        //IDtoken is added as token for the app
                                        $timeout(function () {
                                            updateDataFromCache(_adal.config.loginResource);
                                            $rootScope.userInfo = _oauthData;
                                            // redirect to login requested page
                                            var loginStartPage = _adal.getItem(_adal.CONSTANTS.STORAGE.START_PAGE);
                                            if (loginStartPage) {
                                                // Check to see if any params were stored
                                                var paramsJSON = _adal.getItem(_adal.CONSTANTS.STORAGE.START_PAGE_PARAMS);
                                                if (paramsJSON) {
                                                    // If params were stored redirect to the page and then 
                                                    // initialize the params
                                                    var loginStartPageParams = JSON.parse(paramsJSON);
                                                    $location.url(loginStartPage).search(loginStartPageParams);
                                                }
                                                else {
                                                    $location.url(loginStartPage);
                                                }
                                            }
                                        }, 1);
                                        $rootScope.$broadcast("adal:loginSuccess");
                                    }
                                    else {
                                        $rootScope.$broadcast("adal:loginFailure", _adal.getItem(_adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                                    }
                                }
                            }
                        }
                        else {
                            // No callback. App resumes after closing or moving to new page.
                            // Check token and username
                            updateDataFromCache(_adal.config.loginResource);
                            if (!_adal.renewActive && !_oauthData.isAuthenticated && _oauthData.userName) {
                                if (!_adal.getItem(_adal.CONSTANTS.STORAGE.FAILED_RENEW)) {
                                    // Idtoken is expired or not present
                                    _adal.acquireToken(_adal.config.loginResource, function (error, tokenOut) {
                                        if (error) {
                                            $rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                                        }
                                        else {
                                            if (tokenOut) {
                                                _oauthData.isAuthenticated = true;
                                            }
                                        }
                                    });
                                }
                            }
                        }
                        $timeout(function () {
                            updateDataFromCache(_adal.config.loginResource);
                            $rootScope.userInfo = _oauthData;
                        }, 1);
                    };
                    var loginHandler = function () {
                        _adal.info("Login event for:" + $location.$$url);
                        if (_adal.config && _adal.config.localLoginUrl) {
                            $location.path(_adal.config.localLoginUrl);
                        }
                        else {
                            // directly start login flow
                            _adal.saveItem(_adal.CONSTANTS.STORAGE.START_PAGE, $location.$$url);
                            _adal.info("Start login at:" + window.location.href);
                            $rootScope.$broadcast("adal:loginRedirect");
                            _adal.login();
                        }
                    };
                    function isADLoginRequired(route, global) {
                        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                    }
                    var routeChangeHandler = function (e, nextRoute) {
                        if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, _adal.config)) {
                            if (!_oauthData.isAuthenticated) {
                                _adal.info("Route change event for:" + $location.$$url);
                                loginHandler();
                            }
                        }
                    };
                    var stateChangeHandler = function (e, toState, toParams, fromState, fromParams) {
                        if (toState && isADLoginRequired(toState, _adal.config)) {
                            if (!_oauthData.isAuthenticated) {
                                // $location.$$url is set as the page we are coming from
                                // Update it so we can store the actual location we want to
                                // redirect to upon returning
                                $location.$$url = toState.url;
                                // Parameters are not stored in the url on stateChange so
                                // we store them
                                _adal.saveItem(_adal.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));
                                _adal.info("State change event for:" + $location.$$url);
                                loginHandler();
                            }
                        }
                    };
                    // Route change event tracking to receive fragment and also auto renew tokens
                    $rootScope.$on("$routeChangeStart", routeChangeHandler);
                    $rootScope.$on("$stateChangeStart", stateChangeHandler);
                    $rootScope.$on("$locationChangeStart", locationChangeHandler);
                    updateDataFromCache(_adal.config.loginResource);
                    $rootScope.userInfo = _oauthData;
                    var authService = new AdalAuthenticationService(_adal, _oauthData, $q);
                    return authService;
                }
            ];
        }
        return AdalServiceProvider;
    })();
    var AdalHttpInterceptor = (function () {
        function AdalHttpInterceptor(authService, $q, $rootScope) {
            this.request = function (config) {
                return config;
            };
            this.response = function (rejection) {
                if (rejection && rejection.status === 401) {
                    var resource = authService.getResourceForEndpoint(rejection.config.url);
                    authService.clearCacheForResource(resource);
                    $rootScope.$broadcast('adal:notAuthorized', rejection, resource);
                }
                return $q.reject(rejection);
            };
        }
        return AdalHttpInterceptor;
    })();
    var AdalModule = angular.module("AdalAngular", []);
    AdalModule.provider("adalAuthenticationService", [function () {
            return new AdalServiceProvider();
        }]);
    AdalModule.factory('ProtectedResourceInterceptor', [
        'adalAuthenticationService', '$q', '$rootScope',
        function (authService, $q, $rootScope) {
            return new AdalHttpInterceptor(authService, $q, $rootScope);
        }
    ]);
})(AdalModule || (AdalModule = {}));
