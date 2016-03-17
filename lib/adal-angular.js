///<reference path="../typings/main.d.ts"/>
"use strict";
/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */
/* tslint:disable:* */
if (typeof module !== "undefined" && module.exports) {
    module.exports.inject = function (config) {
        return new $Adal(config);
    };
}
var AuthenticationServiceProviderFactory = (function () {
    function AuthenticationServiceProviderFactory() {
    }
    AuthenticationServiceProviderFactory.Create = function () {
        var adalContext = null;
        var oAuthData = {
            userName: "",
            isAuthenticated: false,
            loginError: "",
            profile: null
        };
        var updateDataFromCache = function (resource) {
            console.log("adal-angular:Updating data from cache for resource:" + resource);
            // only cache lookup here to not interrupt with events
            var token = adalContext.getCachedToken(resource);
            if (token) {
                oAuthData.isAuthenticated = token !== null && token.length > 0;
                var user = adalContext.getCachedUser() || { userName: "" };
                oAuthData.userName = user.userName;
                oAuthData.profile = user.profile;
                oAuthData.loginError = adalContext.getLoginError();
            }
        };
        return {
            $get: [
                "$rootScope", "$window", "$q", "$location", "$timeout",
                function ($rootScope, $window, $q, $location, $timeout) {
                    console.log("adal-angular:adalAuthenticationService.$get() -> BEGIN");
                    var locationChangeHandler = function () {
                        var hash = $window.location.hash;
                        if (adalContext.isCallback(hash)) {
                            // callback can come from login or iframe request
                            var requestInfo = adalContext.getRequestInfo(hash);
                            adalContext.saveTokenFromHash(requestInfo);
                            if ($location.$$html5) {
                                $window.location.assign($window.location.origin + $window.location.pathname);
                            }
                            else {
                                $window.location.hash = "";
                            }
                            if (requestInfo.requestType !== adalContext.REQUEST_TYPE.LOGIN) {
                                adalContext.callback = $window.parent.AuthenticationContext.callback;
                                if (requestInfo.requestType === adalContext.REQUEST_TYPE.RENEW_TOKEN) {
                                    adalContext.callback = $window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                                }
                            }
                            // Return to callback if it is send from iframe
                            if (requestInfo.stateMatch) {
                                if (typeof adalContext.callback === "function") {
                                    // Call within the same context without full page redirect keeps the callback
                                    if (requestInfo.requestType === adalContext.REQUEST_TYPE.RENEW_TOKEN) {
                                        // Idtoken or Accestoken can be renewed
                                        if (requestInfo.parameters["access_token"]) {
                                            adalContext.callback(adalContext.getItem(adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["access_token"]);
                                            return;
                                        }
                                        else if (requestInfo.parameters["id_token"]) {
                                            adalContext.callback(adalContext.getItem(adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                                            return;
                                        }
                                    }
                                }
                                else {
                                    // normal full login redirect happened on the page
                                    updateDataFromCache(adalContext.config.loginResource);
                                    if (oAuthData.userName) {
                                        //IDtoken is added as token for the app
                                        $timeout(function () {
                                            updateDataFromCache(adalContext.config.loginResource);
                                            $rootScope.userInfo = oAuthData;
                                            // redirect to login requested page
                                            var loginStartPage = adalContext.getItem(adalContext.CONSTANTS.STORAGE.START_PAGE);
                                            if (loginStartPage) {
                                                // Check to see if any params were stored
                                                var paramsJSON = adalContext.getItem(adalContext.CONSTANTS.STORAGE.START_PAGE_PARAMS);
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
                                        $rootScope.$broadcast("adal:loginFailure", adalContext.getItem(adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                                    }
                                }
                            }
                        }
                        else {
                            // No callback. App resumes after closing or moving to new page.
                            // Check token and username
                            updateDataFromCache(adalContext.config.loginResource);
                            if (!adalContext.renewActive && !oAuthData.isAuthenticated && oAuthData.userName) {
                                if (!adalContext.getItem(adalContext.CONSTANTS.STORAGE.FAILED_RENEW)) {
                                    // Idtoken is expired or not present
                                    adalContext.acquireToken(adalContext.config.loginResource, function (error, tokenOut) {
                                        if (error) {
                                            $rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                                        }
                                        else {
                                            if (tokenOut) {
                                                oAuthData.isAuthenticated = true;
                                            }
                                        }
                                    });
                                }
                            }
                        }
                        $timeout(function () {
                            updateDataFromCache(adalContext.config.loginResource);
                            $rootScope.userInfo = oAuthData;
                        }, 1);
                    };
                    var loginHandler = function () {
                        adalContext.info("Login event for:" + $location.$$url);
                        if (adalContext.config && adalContext.config.localLoginUrl) {
                            $location.path(adalContext.config.localLoginUrl);
                        }
                        else {
                            // directly start login flow
                            adalContext.saveItem(adalContext.CONSTANTS.STORAGE.START_PAGE, $location.$$url);
                            adalContext.info("Start login at:" + window.location.href);
                            $rootScope.$broadcast("adal:loginRedirect");
                            adalContext.login();
                        }
                    };
                    var isADLoginRequired = function (route, global) {
                        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                    };
                    var routeChangeHandler = function (e, nextRoute) {
                        if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, adalContext.config)) {
                            if (!oAuthData.isAuthenticated) {
                                adalContext.info("Route change event for:" + $location.$$url);
                                loginHandler();
                            }
                        }
                    };
                    var stateChangeHandler = function (e, toState, toParams, fromState, fromParams) {
                        if (toState && isADLoginRequired(toState, adalContext.config)) {
                            if (!oAuthData.isAuthenticated) {
                                // $location.$$url is set as the page we are coming from
                                // Update it so we can store the actual location we want to
                                // redirect to upon returning
                                $location.$$url = toState.url;
                                // Parameters are not stored in the url on stateChange so
                                // we store them
                                adalContext.saveItem(adalContext.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));
                                adalContext.info("State change event for:" + $location.$$url);
                                loginHandler();
                            }
                        }
                    };
                    $rootScope.$on("$routeChangeStart", routeChangeHandler);
                    $rootScope.$on("$stateChangeStart", stateChangeHandler);
                    $rootScope.$on("$locationChangeStart", locationChangeHandler);
                    //Update the token cache
                    updateDataFromCache(adalContext.config.loginResource);
                    $rootScope.userInfo = oAuthData;
                    console.log("adal-angular:adalAuthenticationService.$get -> END");
                    return {
                        config: adalContext.config,
                        login: function () { return adalContext.login(); },
                        loginInProgress: function () { return adalContext.loginInProgress(); },
                        logOut: function () { return adalContext.logOut(); },
                        getCachedToken: function (resource) { return adalContext.getCachedToken(resource); },
                        acquireToken: function (resource) {
                            // automated token request call
                            var deferred = $q.defer();
                            adalContext.acquireToken(resource, function (error, tokenOut) {
                                if (error) {
                                    adalContext.error("Error when acquiring token for resource: " + resource, error);
                                    deferred.reject(error);
                                }
                                else {
                                    deferred.resolve(tokenOut);
                                }
                            });
                            return deferred.promise;
                        },
                        getUser: function () {
                            var deferred = $q.defer();
                            adalContext.getUser(function (error, user) {
                                if (error) {
                                    adalContext.error("Error when getting user", error);
                                    deferred.reject(error);
                                }
                                else {
                                    deferred.resolve(user);
                                }
                            });
                            return deferred.promise;
                        },
                        getResourceForEndpoint: function (endpoint) { return adalContext.getResourceForEndpoint(endpoint); },
                        clearCache: function () { return adalContext.clearCache(); },
                        clearCacheForResource: function (resource) { return adalContext.clearCacheForResource(resource); },
                        info: function (message) { return adalContext.info(message); },
                        verbose: function (message) { return adalContext.verbose(message); }
                    };
                }
            ],
            init: function (configOptions, httpProvider) {
                console.log("adal-angular:AuthenticationServiceProvider.init() - BEGIN");
                if (configOptions) {
                    // redirect and logout_redirect are set to current location by default
                    var existingHash = window.location.hash;
                    var pathDefault = window.location.href;
                    console.log("adal-angular:Existing [window] location:" + pathDefault + " hash:" + existingHash);
                    if (existingHash) {
                        pathDefault = pathDefault.replace(existingHash, "");
                    }
                    configOptions.redirectUri = configOptions.redirectUri || pathDefault;
                    configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;
                    if (httpProvider && httpProvider.interceptors) {
                        console.log("adal-angular:pushed ProtectedResourceInterceptor");
                        httpProvider.interceptors.push("ProtectedResourceInterceptor");
                    }
                    console.log("adal-angular:Initializing the Authentication Context");
                    // create instance with given config
                    adalContext = new $Adal(configOptions);
                }
                else {
                    throw new Error("You must set configOptions, when calling init");
                }
                updateDataFromCache(adalContext.config.loginResource);
                console.log("adal-angular:AuthenticationServiceProvider.init() - END");
            }
        };
    };
    return AuthenticationServiceProviderFactory;
}());
var AuthenticationInterceptorFactory = (function () {
    function AuthenticationInterceptorFactory() {
    }
    AuthenticationInterceptorFactory.Create = function (authService, $q, $rootScope) {
        console.log("adal-angular:intializing ProtectedResourceInterceptor...");
        return {
            request: function (config) {
                // This interceptor needs to load service, but dependency definition causes circular reference error.
                // Loading with injector is suggested at github. https://github.com/angular/angular.js/issues/2367
                config.headers = config.headers || { Authorization: null };
                var resource = authService.getResourceForEndpoint(config.url);
                if (resource === null) {
                    return config;
                }
                var tokenStored = authService.getCachedToken(resource);
                var isEndpoint = false;
                if (tokenStored) {
                    authService.info("Token is avaliable for this url " + config.url);
                    // check endpoint mapping if provided
                    config.headers.Authorization = "Bearer " + tokenStored;
                    return config;
                }
                else {
                    if (authService.config) {
                        //see if we can map this to something in the endpoint collection
                        for (var endpointUrl in authService.config.endpoints) {
                            if (authService.config.endpoints.hasOwnProperty(endpointUrl)) {
                                if (config.url.indexOf(endpointUrl) > -1) {
                                    isEndpoint = true;
                                }
                            }
                        }
                    }
                    // Cancel request if login is starting
                    if (authService.loginInProgress()) {
                        authService.info("login has already started.");
                        return $q.reject();
                    }
                    else if (authService.config && isEndpoint) {
                        // external endpoints
                        // delayed request to return after iframe completes
                        var delayedRequest_1 = $q.defer();
                        authService.acquireToken(resource).then(function (token) {
                            authService.verbose("Token is avaliable");
                            config.headers.Authorization = "Bearer " + token;
                            delayedRequest_1.resolve(config);
                        }, function (err) {
                            delayedRequest_1.reject(err);
                        });
                        return delayedRequest_1.promise;
                    }
                }
                return config;
            },
            responseError: function (rejection) {
                console.log("adal-angular:AuthenticationInterceptor.responseError");
                authService.info("Getting error in the response");
                if (rejection && rejection.status === 401) {
                    var resource = authService.getResourceForEndpoint(rejection.config.url);
                    authService.clearCacheForResource(resource);
                    $rootScope.$broadcast("adal:notAuthorized", rejection, resource);
                }
                return $q.reject(rejection);
            }
        };
    };
    return AuthenticationInterceptorFactory;
}());
var AdalAngularModule = (function () {
    function AdalAngularModule() {
    }
    AdalAngularModule.init = function () {
        //why bother otherwise?? this is an angular binding
        if (angular) {
            var AdalModule = angular.module("AdalAngular", []);
            AdalModule.provider("adalAuthenticationService", function () {
                console.log("adal-angular:initializing adalAuthenticationService...");
                return AuthenticationServiceProviderFactory.Create();
            });
            AdalModule.factory("ProtectedResourceInterceptor", [
                "adalAuthenticationService", "$q", "$rootScope",
                function (authService, $q, $rootScope) {
                    console.log("adal-angular:intializing ProtectedResourceInterceptor...");
                    return AuthenticationInterceptorFactory.Create(authService, $q, $rootScope);
                }
            ]);
        }
        else {
            console.error("Angular.JS is not included");
        }
    };
    return AdalAngularModule;
}());
AdalAngularModule.init();
//# sourceMappingURL=adal-angular.js.map