/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="adalts/adalts.d.ts" />

"use strict";

console.log("adal-angular:loading beginning...");

var module: any;
if (typeof module !== "undefined" && module.exports) {
    module.exports.inject = (config: adal.IConfig) => {

        return new $adal(config);
    }
}

/**
 * @description Contract for an angular HTTP request configuration
 */
interface IAuthenticatedRequestConfig extends ng.IRequestConfig {
    headers: IAuthenticatedRequestHeaders;
}

/**
 * @description Contract for an angular Root scope within an OAuth authentication service
 */
interface IAuthenticationRootScope extends ng.IRootScopeService {
    userInfo: adal.IOAuthData;
}

/**
 * @description Contract for angular request header configuration
 */
interface IAuthenticatedRequestHeaders extends ng.IHttpRequestConfigHeaders {
    Authorization: string;
}

/**
 * @description Contract for an angular Authorization Service Provider
 */
interface IAuthenticationServiceProvider extends ng.IServiceProvider {
    init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void;
}

/**
 * @description Contract for a token based Authentication service
 */
interface IAuthenticationService {
    config: adal.IConfig;
    login(): void;
    loginInProgress(): boolean;
    logOut(): void;
    getCachedToken(resource: string): string;
    acquireToken(resource: string): ng.IPromise<any>;
    getUser(): angular.IPromise<adal.IUser>;
    getResourceForEndpoint(endpoint: string): string;
    clearCache(): void;
    clearCacheForResource(resource: string): void;
    info(message: string): void;
    verbose(message: string): void;
}

/**
 * @description concrete implementation of OAuth data representation
 */
class OAuthData implements adal.IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: adal.IUserProfile;
}


if (angular) {
    var AdalModule = angular.module('AdalAngular', []);
    AdalModule.provider('adalAuthenticationService', (): IAuthenticationServiceProvider => {
        let _adal: adal.IAuthenticationContext = null;
        let _oauthData = new OAuthData();

        var updateDataFromCache = (resource: string): void => {
            // only cache lookup here to not interrupt with events
            var token = _adal.getCachedToken(resource);
            _oauthData.isAuthenticated = token !== null && token.length > 0;
            var user = _adal.getCachedUser() || { userName: '' };
            _oauthData.userName = user.userName;
            _oauthData.profile = user.profile;
            _oauthData.loginError = _adal.getLoginError();
        };
        return {
            init: (configOptions: adal.IConfig, httpProvider: ng.IHttpProvider) => {
                console.log("adal-angular:AuthenticationServiceProvider.init() - BEGIN");
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
                        console.log("pushed ProtectedResourceInterceptor");
                        httpProvider.interceptors.push("ProtectedResourceInterceptor");
                    }

                    console.log("adal-angular:Initializing the Authentication Context");

                    // create instance with given config
                    _adal = new $adal(configOptions);
                } else {
                    throw new Error("You must set configOptions, when calling init");
                }
                updateDataFromCache(_adal.config.loginResource);
                console.log("adal-angular:AuthenticationServiceProvider.init() - END");
            },
            $get: [
                '$rootScope', '$window', '$q', '$location', '$timeout', ($rootScope: IAuthenticationRootScope, $window: ng.IWindowService, $q: ng.IQService,
                    $location: ng.ILocationService, $timeout: ng.ITimeoutService): IAuthenticationService => {

                    console.log("adal-angular:AuthenticationServiceProvider.$get() -> BEGIN");

                    var locationChangeHandler = () => {

                        var hash = $window.location.hash;

                        if (_adal.isCallback(hash)) {
                            // callback can come from login or iframe request
                            var requestInfo = _adal.getRequestInfo(hash);
                            _adal.saveTokenFromHash(requestInfo);

                            if ((<any>$location).$$html5) {
                                $window.location.assign($window.location.origin + $window.location.pathname);
                            } else {
                                $window.location.hash = "";
                            }

                            if (requestInfo.requestType !== _adal.REQUEST_TYPE.LOGIN) {
                                _adal.callback = ($window.parent as any).AuthenticationContext().callback;
                                if (requestInfo.requestType === _adal.REQUEST_TYPE.RENEW_TOKEN) {
                                    _adal.callback = ($window.parent as any).callBackMappedToRenewStates[requestInfo.stateResponse];
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
                                        } else if (requestInfo.parameters["id_token"]) {
                                            _adal.callback(_adal.getItem(_adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                                            return;
                                        }
                                    }
                                } else {
                                    // normal full login redirect happened on the page
                                    updateDataFromCache(_adal.config.loginResource);
                                    if (_oauthData.userName) {
                                        //IDtoken is added as token for the app
                                        $timeout(() => {
                                            updateDataFromCache(_adal.config.loginResource);
                                            ($rootScope as any).userInfo = _oauthData;
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
                                                } else {
                                                    $location.url(loginStartPage);
                                                }
                                            }
                                        }, 1);
                                        $rootScope.$broadcast("adal:loginSuccess");
                                    } else {
                                        $rootScope.$broadcast("adal:loginFailure", _adal.getItem(_adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                                    }
                                }
                            }
                        } else {
                            // No callback. App resumes after closing or moving to new page.
                            // Check token and username
                            updateDataFromCache(_adal.config.loginResource);
                            if (!_adal.renewActive && !_oauthData.isAuthenticated && _oauthData.userName) {
                                if (!_adal.getItem(_adal.CONSTANTS.STORAGE.FAILED_RENEW)) {
                                    // Idtoken is expired or not present
                                    _adal.acquireToken(_adal.config.loginResource, (error, tokenOut) => {
                                        if (error) {
                                            $rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                                        } else {
                                            if (tokenOut) {
                                                _oauthData.isAuthenticated = true;
                                            }
                                        }
                                    });
                                }
                            }
                        }

                        $timeout(() => {
                            updateDataFromCache(_adal.config.loginResource);
                            ($rootScope as any).userInfo = _oauthData;
                        }, 1);
                    }

                    var loginHandler = () => {
                        _adal.info("Login event for:" + ($location as any).$$url);
                        if (_adal.config && _adal.config.localLoginUrl) {
                            $location.path(_adal.config.localLoginUrl);
                        } else {
                            // directly start login flow
                            _adal.saveItem(_adal.CONSTANTS.STORAGE.START_PAGE, ($location as any).$$url);
                            _adal.info("Start login at:" + window.location.href);
                            $rootScope.$broadcast("adal:loginRedirect");
                            _adal.login();
                        }
                    }

                    var isADLoginRequired = (route: any, global: any) => {
                        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                    }

                    var routeChangeHandler = (e: any, nextRoute: any) => {
                        if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, _adal.config)) {
                            if (!_oauthData.isAuthenticated) {
                                _adal.info("Route change event for:" + ($location as any).$$url);
                                loginHandler();
                            }
                        }
                    }

                    var stateChangeHandler = (e: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
                        if (toState && isADLoginRequired(toState, _adal.config)) {
                            if (!_oauthData.isAuthenticated) {
                                // $location.$$url is set as the page we are coming from
                                // Update it so we can store the actual location we want to
                                // redirect to upon returning
                                ($location as any).$$url = toState.url;

                                // Parameters are not stored in the url on stateChange so
                                // we store them
                                _adal.saveItem(_adal.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));

                                _adal.info("State change event for:" + ($location as any).$$url);
                                loginHandler();
                            }
                        }
                    }

                    $rootScope.$on('$routeChangeStart', routeChangeHandler);

                    $rootScope.$on('$stateChangeStart', stateChangeHandler);

                    $rootScope.$on('$locationChangeStart', locationChangeHandler);

                    updateDataFromCache(_adal.config.loginResource);

                    $rootScope.userInfo = _oauthData;

                    console.log("adal-angular:AuthenticationServiceProvider.$get -> END");

                    return {
                        config: _adal.config,
                        login: () => _adal.login(),
                        loginInProgress: () => _adal.loginInProgress(),
                        logOut: () => _adal.logOut(),
                        getCachedToken: (resource: string): string => _adal.getCachedToken(resource),
                        acquireToken: (resource: string): ng.IPromise<string> => {
                            // automated token request call
                            var deferred = $q.defer();
                            _adal.acquireToken(resource, (error, tokenOut) => {
                                if (error) {
                                    _adal.error("Error when acquiring token for resource: " + resource, error);
                                    deferred.reject(error);
                                } else {
                                    deferred.resolve(tokenOut);
                                }
                            });
                            return deferred.promise;
                        },
                        getUser: (): ng.IPromise<adal.IUser> => {
                            var deferred = $q.defer();
                            _adal.getUser((error, user) => {
                                if (error) {
                                    _adal.error("Error when getting user", error);
                                    deferred.reject(error);
                                } else {
                                    deferred.resolve(user);
                                }
                            });

                            return deferred.promise;
                        },
                        getResourceForEndpoint: (endpoint: string): string => _adal.getResourceForEndpoint(endpoint),
                        clearCache: () => _adal.clearCache(),
                        clearCacheForResource: (resource: string) => _adal.clearCacheForResource(resource),
                        info: (message: string) => _adal.info(message),
                        verbose: (message: string) => _adal.verbose(message),
                    }
                }
            ]
        }
    });
    AdalModule.factory('ProtectedResourceInterceptor', [
        'adalAuthenticationService', '$q', '$rootScope',
        (authService: IAuthenticationService, $q: ng.IQService, $rootScope: IAuthenticationRootScope): ng.IHttpInterceptor => {
            return {
                request: (config: IAuthenticatedRequestConfig): IAuthenticatedRequestConfig | ng.IPromise<IAuthenticatedRequestConfig> => {

                    console.log("adal-angular:AuthenticationInterceptor.request");
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
                        authService.info('Token is avaliable for this url ' + config.url);
                        // check endpoint mapping if provided
                        config.headers.Authorization = 'Bearer ' + tokenStored;
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
                            authService.info('login already start.');
                            return $q.reject();
                        } else if (authService.config && isEndpoint) {
                            // external endpoints
                            // delayed request to return after iframe completes
                            var delayedRequest = $q.defer();
                            authService.acquireToken(resource).then((token) => {
                                authService.verbose('Token is avaliable');
                                config.headers.Authorization = 'Bearer ' + token;
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
                    authService.info('Getting error in the response');
                    if (rejection && rejection.status === 401) {
                        var resource = authService.getResourceForEndpoint(rejection.config.url);
                        authService.clearCacheForResource(resource);
                        $rootScope.$broadcast('adal:notAuthorized', rejection, resource);
                    }
                    return $q.reject(rejection);
                }
            }
        }
    ]);
} else {
    console.error('Angular.JS is not included');
}


console.log("adal-angular:loading complete!");

