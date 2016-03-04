/// <reference path="../../typings/angularjs/angular.d.ts" />
"use strict";

import adal = require("../adal/adal");

/**
* @description module dependency injection for commonjs
* 
* @param config {Config} The Authentication Context configuration to be used
*/
export function inject(config: adal.IConfig): adal.IAuthenticationContext {
    return new adal.AuthenticationContext(config);
}

class AdalAuthenticationService implements angular.IServiceProvider {

    $get: any;

    updateDataFromCache: (resource: string) => void;

    init: (configOptions: adal.IConfig, httpProvider: angular.IHttpProvider) => void;

    acquireToken: (resource: string) => angular.IPromise<any>;

    login: () => void;

    loginInProgress: () => boolean;

    logOut: () => void;

    getCachedToken: (resource: string) => string;

    getUser: () => angular.IPromise<adal.IUser>;

    getResourceForEndpoint: (endpoint: string) => string;

    clearCache: () => void;

    clearCacheForResource: (resource: string) => void;

    info: (message: string) => void;

    verbose: (message: string) => void;

    config: adal.IConfig;
    userInfo: adal.IOAuthData;
    
    constructor() {

        var _adal: adal.AuthenticationContext = null;
        var _oauthData: adal.OAuthData = { isAuthenticated: false, userName: "", loginError: "", profile: null };

        var updateDataFromCache = (resource: string) => {
            // only cache lookup here to not interrupt with events
            var token = _adal.getCachedToken(resource);
            _oauthData.isAuthenticated = token !== null && token.length > 0;
            var user = _adal.getCachedUser() || { userName: "", profile: null };
            _oauthData.userName = user.userName;
            _oauthData.profile = user.profile;
            _oauthData.loginError = _adal.getLoginError();
        };

        this.init = (configOptions, httpProvider) => {
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
                _adal = new adal.AuthenticationContext(configOptions);
            } else {
                throw new Error("You must set configOptions, when calling init");
            }

            //loginresource is used to set authenticated status
            updateDataFromCache(_adal.config.loginResource);
        };

        /**
         * @desc Special function that exposes methods in Angular controller
        *  $rootScope, $window, $q, $location, $timeout are injected by Angular
         */
        this.$get = [
            "$rootScope", "$window", "$q", "$location", "$timeout",
            ($rootScope: angular.IRootScopeService, $window: angular.IWindowService, $q: angular.IQService, $location: angular.ILocationService, $timeout: angular.ITimeoutService) => {

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
                                _adal.acquireToken(_adal.config.loginResource, function (error, tokenOut) {
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
                };

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
                };

                function isADLoginRequired(route: any, global: any) {
                    return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
                }

                var routeChangeHandler = (e: any, nextRoute: any) => {
                    if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, _adal.config)) {
                        if (!_oauthData.isAuthenticated) {
                            _adal.info("Route change event for:" + ($location as any).$$url);
                            loginHandler();
                        }
                    }
                };

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
                };

                // Route change event tracking to receive fragment and also auto renew tokens
                $rootScope.$on("$routeChangeStart", routeChangeHandler);

                $rootScope.$on("$stateChangeStart", stateChangeHandler);

                $rootScope.$on("$locationChangeStart", locationChangeHandler);

                updateDataFromCache(_adal.config.loginResource);

            }];
    }
}

class AdalHttpInterceptor implements angular.IHttpInterceptor {

    request: (config: angular.IRequestConfig) => angular.IRequestConfig | angular.IPromise<angular.IRequestConfig>;
    response: (rejection: any) => void;

    constructor(authService: AdalAuthenticationService, $q: angular.IQService, $rootScope: angular.IRootScopeService) {
        this.request = (config: angular.IRequestConfig): angular.IPromise<angular.IRequestConfig> | angular.IRequestConfig => {
            return config;
        };

        this.response = (rejection: any) => {
            if (rejection && rejection.status === 401) {
                var resource = authService.getResourceForEndpoint(rejection.config.url);
                authService.clearCacheForResource(resource);
                $rootScope.$broadcast('adal:notAuthorized', rejection, resource);
            }
            return $q.reject(rejection);
        };
    }
}

interface IAdalRootScope extends angular.IRootScopeService {
    userInfo: adal.IOAuthData
}

(function(){
    if (angular) {
        var AdalModule = angular.module("AdalAngular", []).run(($rootScope: IAdalRootScope): void => {
            $rootScope.userInfo = { isAuthenticated: false, userName: '', loginError: '', profile: null };
        });
        AdalModule.provider("adalAuthenticationService", () => {
            return new AdalAuthenticationService();
        });
        AdalModule.factory('ProtectedResourceInterceptor', [
            'adalAuthenticationService', '$q', '$rootScope',
            (authService: AdalAuthenticationService, $q: angular.IQService, $rootScope: IAdalRootScope) => {
                return new AdalHttpInterceptor(authService, $q, $rootScope);
            }
        ]);
    } else {
        console.log("AngularJS is not here???");
    }
})();
