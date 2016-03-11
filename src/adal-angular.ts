/// <reference path="adal.ts" />
/// <reference path="../typings/angularjs/angular.d.ts" />
"use strict";

/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */
var module: any;
if (typeof module !== "undefined" && module.exports) {
    module.exports.inject = (config: adal.IConfig) => {

        return new $adal(config);
    };
}

console.log("adal-angular:Initializing Angular HTTP binding service...");
import adalangularts = adalangular;

declare module "adal-angular" {
    export=adalangularts;
}

/**
 * @description ADAL Interfaces used by angular bindings.
 */
declare module adalangular {
    /**
     * @description Contract for a token based Authentication service
     */
    interface IAuthenticationService {
        /**
         *@desc The context configuration
         */
        config: adal.IConfig;
        /**
         * @desc Login
         */
        login(): void;
        /**
         * @desc    Is a login currently in progress
         */
        loginInProgress(): boolean;
        /**
         * @desc    Log out
         */
        logOut(): void;
        /**
         * @desc Retrieve a token from the cache
         * @param resource  {string} The desired target audience
         */
        getCachedToken(resource: string): string;
        /**
         * @desc    Acquire a token for the desired audience
         * @param resource {string} The desired target audience
         */
        acquireToken(resource: string): ng.IPromise<any>;
        getUser(): angular.IPromise<adal.IUser>;
        getResourceForEndpoint(endpoint: string): string;
        clearCache(): void;
        clearCacheForResource(resource: string): void;

        info(message: string): void;
        verbose(message: string): void;
    }
    /**
     * @description Contract for an angular HTTP request configuration
     */
    interface IAuthenticatedRequestConfig extends ng.IRequestConfig {
        /**
         * @description {IAuthenticatedRequestHeaders} The request header collection
         */
        headers: IAuthenticatedRequestHeaders;
    }

    /**
     * @description Contract for an angular Root scope within an OAuth authentication service
     */
    interface IAuthenticationRootScope extends ng.IRootScopeService {
        /**
         * @description {adal.iOAuthData}   The current user profile
         */
        userInfo: adal.IOAuthData;
    }

    /**
     * @description Contract for angular request header configuration
     */
    interface IAuthenticatedRequestHeaders extends ng.IHttpRequestConfigHeaders {
        /**
         * @description {string} Authorization Header
         */
        Authorization: string;
    }

    /**
     * @description Contract for an angular Authorization Service Provider
     */
    interface IAuthenticationServiceProvider extends ng.IServiceProvider {
        /**
         *
         * @param configOptions {adal.IConfig}  Configuration options for the authentication context
         * @param httpProvider  {ng.IHttpProvider}  The angular http provider
         */
        init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void;
    }
}


//why bother otherwise?? this is an angular binding
if (angular) {
    var AdalModule = angular.module("AdalAngular", []);
    AdalModule.provider("adalAuthenticationService", (): adalangular.IAuthenticationServiceProvider => {

        console.log("adal-angular:initializing adalAuthenticationService...");
        let adalContext: adal.IAuthenticationContext = null;
        let oAuthData:adal.IOAuthData = {
            userName:"",
            isAuthenticated:false,
            loginError:"",
            profile:null
        };

        var updateDataFromCache = (resource: string): void => {
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
            init: (configOptions: adal.IConfig, httpProvider: ng.IHttpProvider) => {
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
                    adalContext = new $adal(configOptions);
                } else {
                    throw new Error("You must set configOptions, when calling init");
                }
                updateDataFromCache(adalContext.config.loginResource);
                console.log("adal-angular:AuthenticationServiceProvider.init() - END");
            },
            $get: [
                "$rootScope", "$window", "$q", "$location", "$timeout", ($rootScope: adalangular.IAuthenticationRootScope, $window: ng.IWindowService, $q: ng.IQService,
                    $location: ng.ILocationService, $timeout: ng.ITimeoutService): adalangular.IAuthenticationService => {

                    console.log("adal-angular:adalAuthenticationService.$get() -> BEGIN");

                    var locationChangeHandler = () => {

                        var hash = $window.location.hash;

                        if (adalContext.isCallback(hash)) {
                            // callback can come from login or iframe request
                            var requestInfo = adalContext.getRequestInfo(hash);
                            adalContext.saveTokenFromHash(requestInfo);

                            if ((<any>$location).$$html5) {
                                $window.location.assign($window.location.origin + $window.location.pathname);
                            } else {
                                $window.location.hash = "";
                            }

                            if (requestInfo.requestType !== adalContext.REQUEST_TYPE.LOGIN) {
                                adalContext.callback = ($window.parent as any).AuthenticationContext().callback;
                                if (requestInfo.requestType === adalContext.REQUEST_TYPE.RENEW_TOKEN) {
                                    adalContext.callback = ($window.parent as any).callBackMappedToRenewStates[requestInfo.stateResponse];
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
                                        } else if (requestInfo.parameters["id_token"]) {
                                            adalContext.callback(adalContext.getItem(adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                                            return;
                                        }
                                    }
                                } else {
                                    // normal full login redirect happened on the page
                                    updateDataFromCache(adalContext.config.loginResource);
                                    if (oAuthData.userName) {
                                        //IDtoken is added as token for the app
                                        $timeout(() => {
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
                                                } else {
                                                    $location.url(loginStartPage);
                                                }
                                            }
                                        }, 1);
                                        $rootScope.$broadcast("adal:loginSuccess");
                                    } else {
                                        $rootScope.$broadcast("adal:loginFailure", adalContext.getItem(adalContext.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                                    }
                                }
                            }
                        } else {
                            // No callback. App resumes after closing or moving to new page.
                            // Check token and username
                            updateDataFromCache(adalContext.config.loginResource);
                            if (!adalContext.renewActive && !oAuthData.isAuthenticated && oAuthData.userName) {
                                if (!adalContext.getItem(adalContext.CONSTANTS.STORAGE.FAILED_RENEW)) {
                                    // Idtoken is expired or not present
                                    adalContext.acquireToken(adalContext.config.loginResource, (error, tokenOut) => {
                                        if (error) {
                                            $rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                                        } else {
                                            if (tokenOut) {
                                                oAuthData.isAuthenticated = true;
                                            }
                                        }
                                    });
                                }
                            }
                        }

                        $timeout(() => {
                            updateDataFromCache(adalContext.config.loginResource);
                            ($rootScope as any).userInfo = oAuthData;
                        }, 1);
                    };

                    var loginHandler = () => {
                        adalContext.info("Login event for:" + ($location as any).$$url);
                        if (adalContext.config && adalContext.config.localLoginUrl) {
                            $location.path(adalContext.config.localLoginUrl);
                        } else {
                            // directly start login flow
                            adalContext.saveItem(adalContext.CONSTANTS.STORAGE.START_PAGE, ($location as any).$$url);
                            adalContext.info("Start login at:" + window.location.href);
                            $rootScope.$broadcast("adal:loginRedirect");
                            adalContext.login();
                        }
                    };

                    var isADLoginRequired = (route: any, global: any) => {
                        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                    };

                    var routeChangeHandler = (e: any, nextRoute: any) => {
                        if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, adalContext.config)) {
                            if (!oAuthData.isAuthenticated) {
                                adalContext.info("Route change event for:" + ($location as any).$$url);
                                loginHandler();
                            }
                        }
                    };

                    var stateChangeHandler = (e: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
                        if (toState && isADLoginRequired(toState, adalContext.config)) {
                            if (!oAuthData.isAuthenticated) {
                                // $location.$$url is set as the page we are coming from
                                // Update it so we can store the actual location we want to
                                // redirect to upon returning
                                ($location as any).$$url = toState.url;

                                // Parameters are not stored in the url on stateChange so
                                // we store them
                                adalContext.saveItem(adalContext.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));

                                adalContext.info("State change event for:" + ($location as any).$$url);
                                loginHandler();
                            }
                        }
                    };

                    $rootScope.$on("$routeChangeStart", routeChangeHandler);

                    $rootScope.$on("$stateChangeStart", stateChangeHandler);

                    $rootScope.$on("$locationChangeStart", locationChangeHandler);

                    updateDataFromCache(adalContext.config.loginResource);

                    $rootScope.userInfo = oAuthData;

                    console.log("adal-angular:adalAuthenticationService.$get -> END");

                    return {
                        config: adalContext.config,
                        login: () => adalContext.login(),
                        loginInProgress: () => adalContext.loginInProgress(),
                        logOut: () => adalContext.logOut(),
                        getCachedToken: (resource: string): string => adalContext.getCachedToken(resource),
                        acquireToken: (resource: string): ng.IPromise<string> => {
                            // automated token request call
                            var deferred = $q.defer();
                            adalContext.acquireToken(resource, (error, tokenOut) => {
                                if (error) {
                                    adalContext.error("Error when acquiring token for resource: " + resource, error);
                                    deferred.reject(error);
                                } else {
                                    deferred.resolve(tokenOut);
                                }
                            });
                            return deferred.promise;
                        },
                        getUser: (): ng.IPromise<adal.IUser> => {
                            var deferred = $q.defer();
                            adalContext.getUser((error, user) => {
                                if (error) {
                                    adalContext.error("Error when getting user", error);
                                    deferred.reject(error);
                                } else {
                                    deferred.resolve(user);
                                }
                            });

                            return deferred.promise;
                        },
                        getResourceForEndpoint: (endpoint: string): string => adalContext.getResourceForEndpoint(endpoint),
                        clearCache: () => adalContext.clearCache(),
                        clearCacheForResource: (resource: string) => adalContext.clearCacheForResource(resource),
                        info: (message: string) => adalContext.info(message),
                        verbose: (message: string) => adalContext.verbose(message)
                    };
                }
            ]
        };
    });
    AdalModule.factory("ProtectedResourceInterceptor", [
        "adalAuthenticationService", "$q", "$rootScope",
        (authService: adalangular.IAuthenticationService, $q: ng.IQService, $rootScope: adalangular.IAuthenticationRootScope): ng.IHttpInterceptor => {
            console.log("adal-angular:intializing ProtectedResourceInterceptor...");
            return {
                request: (config: adalangular.IAuthenticatedRequestConfig): adalangular.IAuthenticatedRequestConfig | ng.IPromise<adalangular.IAuthenticatedRequestConfig> => {

                    // This interceptor needs to load service, but dependeny definition causes circular reference error.
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
                    } else {
                        if (authService.config) {
                            for (var endpointUrl in authService.config.endpoints) {
                                if (config.url.indexOf(endpointUrl) > -1) {
                                    isEndpoint = true;
                                }
                            }
                        }

                        // Cancel request if login is starting
                        if (authService.loginInProgress()) {
                            authService.info("login already start.");
                            return $q.reject();
                        } else if (authService.config && isEndpoint) {
                            // external endpoints
                            // delayed request to return after iframe completes
                            var delayedRequest = $q.defer();
                            authService.acquireToken(resource).then((token) => {
                                authService.verbose("Token is avaliable");
                                config.headers.Authorization = "Bearer " + token;
                                delayedRequest.resolve(config);
                            }, (err) => {
                                delayedRequest.reject(err);
                            });

                            return delayedRequest.promise;
                        }
                    }

                    return config;

                },
                responseError: (rejection: any): any | ng.IPromise<any> => {
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
        }
    ]);
} else {
    console.error("Angular.JS is not included");
}



console.log("adal-angular:loading complete!");

