/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="adal/adal.d.ts" />
"use strict";

var $Adal: adal.IFactory;

console.log("adal-angular:loading beginning...");

class AuthenticationServiceProvider implements ng.IServiceProvider {

    static ModuleName = 'adalAuthenticationService';

    private _adal: adal.IAuthenticationContext;
    private _oauthData: adal.IOAuthData;

    static $inject = ["$rootScope", "$window", "$q", "$location", "$timeout"];

    config: adal.IConfig;
    
    userInfo: adal.IOAuthData;

    $get: any;

    updateDataFromCache(resource: string):void {
        // only cache lookup here to not interrupt with events
        var token = this._adal.getCachedToken(resource);
        this._oauthData.isAuthenticated = token !== null && token.length > 0;
        var user = this._adal.getCachedUser() || { userName: "", profile: null };
        this._oauthData.userName = user.userName;
        this._oauthData.profile = user.profile;
        this._oauthData.loginError = this._adal.getLoginError();
    }
    
    acquireToken: (resource: string) => ng.IPromise<any>;

    login: () => void;

    loginInProgress: () => boolean;

    logOut: () => void;

    getCachedToken: (resource: string) => string;

    getUser: () => ng.IPromise<adal.IUser>;

    getResourceForEndpoint: (endpoint: string) => string;

    clearCache: () => void;

    clearCacheForResource: (resource: string) => void;

    info: (message: string) => void;

    verbose: (message: string) => void;    

    init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void {
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

            console.log("adal-angular:Initializing the Authentication Context");

            // create instance with given config
            this._adal = $Adal(configOptions);
        } else {
            throw new Error("You must set configOptions, when calling init");
        }

        //loginresource is used to set authenticated status
        this.updateDataFromCache(this._adal.config.loginResource);
    }

    constructor($rootScope: ng.IRootScopeService, $window: ng.IWindowService, $q: ng.IQService,
        $location: ng.ILocationService, $timeout: ng.ITimeoutService) {

        console.log("adal-angular:AdalAuthenticationService.ctor()");

        this._adal=null;
        this._oauthData={ isAuthenticated: false, userName: "", loginError: "", profile: null };
        
        var locationChangeHandler = () => {
            var hash = $window.location.hash;

            if (this._adal.isCallback(hash)) {
                // callback can come from login or iframe request
                var requestInfo = this._adal.getRequestInfo(hash);
                this._adal.saveTokenFromHash(requestInfo);

                if ((<any>$location).$$html5) {
                    $window.location.assign($window.location.origin + $window.location.pathname);
                } else {
                    $window.location.hash = "";
                }

                if (requestInfo.requestType !== this._adal.REQUEST_TYPE.LOGIN) {
                    this._adal.callback = ($window.parent as any).AuthenticationContext().callback;
                    if (requestInfo.requestType === this._adal.REQUEST_TYPE.RENEW_TOKEN) {
                        this._adal.callback = ($window.parent as any).callBackMappedToRenewStates[requestInfo.stateResponse];
                    }
                }

                // Return to callback if it is send from iframe
                if (requestInfo.stateMatch) {
                    if (typeof this._adal.callback === "function") {
                        // Call within the same context without full page redirect keeps the callback
                        if (requestInfo.requestType === this._adal.REQUEST_TYPE.RENEW_TOKEN) {
                            // Idtoken or Accestoken can be renewed
                            if (requestInfo.parameters["access_token"]) {
                                this._adal.callback(this._adal.getItem(this._adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["access_token"]);
                                return;
                            } else if (requestInfo.parameters["id_token"]) {
                                this._adal.callback(this._adal.getItem(this._adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                                return;
                            }
                        }
                    } else {
                        // normal full login redirect happened on the page
                        this.updateDataFromCache(this._adal.config.loginResource);
                        if (this._oauthData.userName) {
                            //IDtoken is added as token for the app
                            $timeout(() => {
                                this.updateDataFromCache(this._adal.config.loginResource);
                                ($rootScope as any).userInfo = this._oauthData;
                                // redirect to login requested page
                                var loginStartPage = this._adal.getItem(this._adal.CONSTANTS.STORAGE.START_PAGE);
                                if (loginStartPage) {
                                    // Check to see if any params were stored
                                    var paramsJSON = this._adal.getItem(this._adal.CONSTANTS.STORAGE.START_PAGE_PARAMS);

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
                            $rootScope.$broadcast("adal:loginFailure", this._adal.getItem(this._adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                        }
                    }
                }
            } else {
                // No callback. App resumes after closing or moving to new page.
                // Check token and username
                this.updateDataFromCache(this._adal.config.loginResource);
                if (!this._adal.renewActive && !this._oauthData.isAuthenticated && this._oauthData.userName) {
                    if (!this._adal.getItem(this._adal.CONSTANTS.STORAGE.FAILED_RENEW)) {
                        // Idtoken is expired or not present
                        this._adal.acquireToken(this._adal.config.loginResource, (error, tokenOut)=>{
                            if (error) {
                                $rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                            } else {
                                if (tokenOut) {
                                    this._oauthData.isAuthenticated = true;
                                }
                            }
                        });
                    }
                }
            }

            $timeout(() => {
                this.updateDataFromCache(this._adal.config.loginResource);
                ($rootScope as any).userInfo = this._oauthData;
            }, 1);
        };

        var loginHandler = () => {
            this._adal.info("Login event for:" + ($location as any).$$url);
            if (this._adal.config && this._adal.config.localLoginUrl) {
                $location.path(this._adal.config.localLoginUrl);
            } else {
                // directly start login flow
                this._adal.saveItem(this._adal.CONSTANTS.STORAGE.START_PAGE, ($location as any).$$url);
                this._adal.info("Start login at:" + window.location.href);
                $rootScope.$broadcast("adal:loginRedirect");
                this._adal.login();
            }
        };

        var isADLoginRequired = (route: any, global: any): boolean => {
            return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
        };

        var routeChangeHandler = (e: any, nextRoute: any) => {
            if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, this._adal.config)) {
                if (!this._oauthData.isAuthenticated) {
                    this._adal.info("Route change event for:" + ($location as any).$$url);
                    loginHandler();
                }
            }
        };

        var stateChangeHandler = (e: any, toState: any, toParams: any, fromState: any, fromParams: any) => {
            if (toState && isADLoginRequired(toState, this._adal.config)) {
                if (!this._oauthData.isAuthenticated) {
                    // $location.$$url is set as the page we are coming from
                    // Update it so we can store the actual location we want to
                    // redirect to upon returning
                    ($location as any).$$url = toState.url;

                    // Parameters are not stored in the url on stateChange so
                    // we store them
                   this._adal.saveItem(this._adal.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));

                    this._adal.info("State change event for:" + ($location as any).$$url);
                    loginHandler();
                }
            }
        };

        // Route change event tracking to receive fragment and also auto renew tokens
        $rootScope.$on("$routeChangeStart", routeChangeHandler);

        $rootScope.$on("$stateChangeStart", stateChangeHandler);

        $rootScope.$on("$locationChangeStart", locationChangeHandler);

        this.updateDataFromCache(this._adal.config.loginResource);

        //set the data in the scope

        this.info = (message: string) => { this._adal.info(message); }
        this.verbose = (message: string) => { this._adal.verbose(message); }
        this.login = () => { this._adal.login(); };
        this.logOut = () => { this._adal.logOut(); };
        this.clearCache = () => { this._adal.clearCache(); }
        this.getResourceForEndpoint = (endpoint: string) => {
            return this._adal.getResourceForEndpoint(endpoint);
        }
        this.getCachedToken = (resource: string) => {
            return this._adal.getCachedToken(resource);
        }
        this.getUser = () => {
            var deferred = $q.defer();
            this._adal.getUser(function (error, user) {
                if (error) {
                    this._adal.error('Error when getting user', error);
                    deferred.reject(error);
                } else {
                    deferred.resolve(user);
                }
            });

            return deferred.promise;
        }
        this.acquireToken = (resource: string) => {
            // automated token request call
            var deferred = $q.defer();
            this._adal.acquireToken(resource, (error, tokenOut) => {
                if (error) {
                    this._adal.error('Error when acquiring token for resource: ' + resource, error);
                    deferred.reject(error);
                } else {
                    deferred.resolve(tokenOut);
                }
            });

            return deferred.promise;
        }
    }
}

class HttpInterceptor implements ng.IHttpInterceptor {

    static ModuleName = 'ProtectedResourceInterceptor';

    static $inject = ['adalAuthenticationService', '$q', '$rootScope'];

    request: (config: ng.IRequestConfig) => ng.IRequestConfig | ng.IPromise<ng.IRequestConfig>;
    response: (rejection: any) => void;

    constructor(authService: AuthenticationServiceProvider, $q: ng.IQService, $rootScope: ng.IRootScopeService) {
        console.log("adal-angular:HttpInterceptor.ctor()");
        this.request =
            (config: ng.IRequestConfig): ng.IPromise<ng.IRequestConfig> | ng.IRequestConfig => {
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

var module: any;
if (typeof module !== "undefined" && module.exports) {
    module.exports.inject = (config: adal.IConfig) => {

        return $Adal(config);
    }
}
var AdalAngular = angular.module("AdalAngular", []);
AdalAngular.provider(AuthenticationServiceProvider.ModuleName, AuthenticationServiceProvider);
AdalAngular.factory(HttpInterceptor.ModuleName, HttpInterceptor);
console.log("adal-angular:loading complete!");

