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

class OAuthData implements adal.IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: adal.IUserProfile;
}

interface IAuthenticatedRequestHeaders extends ng.IHttpRequestConfigHeaders {
    Authorization?: string;
}

class AuthenticationInterceptor implements ng.IHttpInterceptor {

    static $inject = ['adalAuthenticationService', '$q', '$rootScope'];

    protected authService: AuthenticationService;
    protected $q: ng.IQService;
    protected $rootScope: ng.IRootScopeService;

    request(config: angular.IRequestConfig): angular.IRequestConfig | angular.IPromise<angular.IRequestConfig> {
        if (config) {
            console.log("adal-angular:HttpInterceptor[request]");
            // This interceptor needs to load service, but dependeny definition causes circular reference error.
            // Loading with injector is suggested at github. https://github.com/angular/angular.js/issues/2367

            var configHeaders:IAuthenticatedRequestHeaders=config.headers || {};

            var resource = this.authService.getResourceForEndpoint(config.url);
            if (resource === null) {
                return config;
            }
            var tokenStored = this.authService.getCachedToken(resource);
            var isEndpoint = false;
            if (tokenStored) {
                this.authService.info('Token is avaliable for this url ' + config.url);
                // check endpoint mapping if provided
                configHeaders.Authorization = 'Bearer ' + tokenStored;
                return config;
            } else {

                if (this.authService.config) {
                    for (var endpointUrl in this.authService.config.endpoints) {
                        if (config.url.indexOf(endpointUrl) > -1) {
                            isEndpoint = true;
                        }
                    }
                }

                // Cancel request if login is starting
                if (this.authService.loginInProgress()) {
                    this.authService.info('login already start.');
                    return this.$q.reject();
                } else if (this.authService.config && isEndpoint) {
                    // external endpoints
                    // delayed request to return after iframe completes
                    var delayedRequest = this.$q.defer();
                    this.authService.acquireToken(resource).then(function (token) {
                        this.authService.verbose('Token is avaliable');
                        configHeaders.Authorization = 'Bearer ' + token;
                        delayedRequest.resolve(config);
                    }, function (err) {
                        delayedRequest.reject(err);
                    });

                    return delayedRequest.promise;
                }
            }

            return config;
        }
    }

    response(rejection: any): ng.IPromise<any> {
        console.log("adal-angular:HttpInterceptor[response]");
        this.authService.info('Getting error in the response');
        if (rejection && rejection.status === 401) {
            var resource = this.authService.getResourceForEndpoint(rejection.config.url);
            this.authService.clearCacheForResource(resource);
            this.$rootScope.$broadcast('adal:notAuthorized', rejection, resource);
        }

        return this.$q.reject(rejection);
    }

    constructor(authService: AuthenticationService, $q: angular.IQService, $rootScope: angular.IRootScopeService) {
        console.log("adal-angular:AuthenticationInterceptor.ctor()");
        this.authService = authService;
        this.$q = $q;
        this.$rootScope = $rootScope;
    }

}

class AuthenticationService {

    static $inject: Array<string> = ['$rootScope', '$window', '$q', '$location', '$timeout'];

    //region Private variables
    private _adal: adal.IAuthenticationContext;
    private _oauthData: adal.IOAuthData;
    private $q: ng.IQService;
    //endregion

    config: adal.IConfig;
    userInfo: adal.IOAuthData;

    //region Service Methods

    login(): void { this._adal.login(); }

    loginInProgress(): boolean { return this._adal.loginInProgress(); }

    logOut(): void { this._adal.logOut(); }

    getCachedToken(resource: string): string {
        return this._adal.getCachedToken(resource);
    }

    acquireToken(resource: string): ng.IPromise<any> {
        // automated token request call
        var deferred = this.$q.defer();
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

    getUser(): angular.IPromise<adal.IUser> {
        var deferred = this.$q.defer();
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

    getResourceForEndpoint(endpoint: string): string {
        return this._adal.getResourceForEndpoint(endpoint);
    }

    clearCache(): void { this._adal.clearCache(); }

    clearCacheForResource(resource: string): void {
        this._adal.clearCacheForResource(resource);
    }

    info(message: string): void {this._adal.info(message);}

    verbose(message: string): void { this._adal.verbose(message); }

    //endregion

    constructor($rootScope: angular.IRootScopeService, $window: angular.IWindowService, $q: angular.IQService, $location: angular.ILocationService, $timeout: angular.ITimeoutService) {
        this.$q = $q;
        console.log("adal-angular:AuthenticationService.ctor()");
    }

}

class AuthenticationServiceProvider implements ng.IServiceProvider {

    static $inject: Array<string> = [];

    //region Private variables
    private _adal: adal.IAuthenticationContext;
    private _oauthData: adal.IOAuthData;
    private $rootScope:ng.IRootScopeService;
    private $window: ng.IWindowService;
    private $location: ng.ILocationService;
    private $timeout: ng.ITimeoutService;
    private $q: ng.IQService;
    
    //endregion

    private AuthenticationService:AuthenticationService;

    //region Service Handlers
    private loginHandler(): void {
        this._adal.info("Login event for:" + (this.$location as any).$$url);
        if (this._adal.config && this._adal.config.localLoginUrl) {
            this.$location.path(this._adal.config.localLoginUrl);
        } else {
            // directly start login flow
            this._adal.saveItem(this._adal.CONSTANTS.STORAGE.START_PAGE, (this.$location as any).$$url);
            this._adal.info("Start login at:" + window.location.href);
            this.$rootScope.$broadcast("adal:loginRedirect");
            this._adal.login();
        }
    }

    private isADLoginRequired(route: any, global: any): boolean {
        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
    }

    private stateChangeHandler(e: any, toState: any, toParams: any, fromState: any, fromParams: any): void {
        if (toState && this.isADLoginRequired(toState, this._adal.config)) {
            if (!this._oauthData.isAuthenticated) {
                // $location.$$url is set as the page we are coming from
                // Update it so we can store the actual location we want to
                // redirect to upon returning
                (this.$location as any).$$url = toState.url;

                // Parameters are not stored in the url on stateChange so
                // we store them
                this._adal.saveItem(this._adal.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));

                this._adal.info("State change event for:" + (this.$location as any).$$url);
                this.loginHandler();
            }
        }
    }

    private locationChangeHandler(): void {

        var hash = this.$window.location.hash;

        if (this._adal.isCallback(hash)) {
            // callback can come from login or iframe request
            var requestInfo = this._adal.getRequestInfo(hash);
            this._adal.saveTokenFromHash(requestInfo);

            if ((<any>this.$location).$$html5) {
                this.$window.location.assign(this.$window.location.origin + this.$window.location.pathname);
            } else {
                this.$window.location.hash = "";
            }

            if (requestInfo.requestType !== this._adal.REQUEST_TYPE.LOGIN) {
                this._adal.callback = (this.$window.parent as any).AuthenticationContext().callback;
                if (requestInfo.requestType === this._adal.REQUEST_TYPE.RENEW_TOKEN) {
                    this._adal.callback = (this.$window.parent as any).callBackMappedToRenewStates[requestInfo.stateResponse];
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
                        this.$timeout(() => {
                            this.updateDataFromCache(this._adal.config.loginResource);
                            (this.$rootScope as any).userInfo = this._oauthData;
                            // redirect to login requested page
                            var loginStartPage = this._adal.getItem(this._adal.CONSTANTS.STORAGE.START_PAGE);
                            if (loginStartPage) {
                                // Check to see if any params were stored
                                var paramsJSON = this._adal.getItem(this._adal.CONSTANTS.STORAGE.START_PAGE_PARAMS);

                                if (paramsJSON) {
                                    // If params were stored redirect to the page and then
                                    // initialize the params
                                    var loginStartPageParams = JSON.parse(paramsJSON);
                                    this.$location.url(loginStartPage).search(loginStartPageParams);
                                } else {
                                    this.$location.url(loginStartPage);
                                }
                            }
                        }, 1);
                        this.$rootScope.$broadcast("adal:loginSuccess");
                    } else {
                        this.$rootScope.$broadcast("adal:loginFailure", this._adal.getItem(this._adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
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
                    this._adal.acquireToken(this._adal.config.loginResource, (error, tokenOut) => {
                        if (error) {
                            this.$rootScope.$broadcast("adal:loginFailure", "auto renew failure");
                        } else {
                            if (tokenOut) {
                                this._oauthData.isAuthenticated = true;
                            }
                        }
                    });
                }
            }
        }

        this.$timeout(() => {
            this.updateDataFromCache(this._adal.config.loginResource);
            (this.$rootScope as any).userInfo = this._oauthData;
        }, 1);
    }

    private routeChangeHandler(e: any, nextRoute: any): void {
        if (nextRoute && nextRoute.$$route && this.isADLoginRequired(nextRoute.$$route, this._adal.config)) {
            if (!this._oauthData.isAuthenticated) {
                this._adal.info("Route change event for:" + (this.$location as any).$$url);
                this.loginHandler();
            }
        }
    }

    private updateDataFromCache(resource: string): void {
        // only cache lookup here to not interrupt with events
        var token = this._adal.getCachedToken(resource);
        this._oauthData.isAuthenticated = token !== null && token.length > 0;
        var user = this._adal.getCachedUser() || { userName: "", profile: null };
        this._oauthData.userName = user.userName;
        this._oauthData.profile = user.profile;
        this._oauthData.loginError = this._adal.getLoginError();
    }
    //endregion

    init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void {
        console.log("adal-angular:AuthenticationServiceProvider.init()")

        if (configOptions) {

            this._oauthData = new OAuthData();
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
                this._adal = new $adal(configOptions);
            } else {
                throw new Error("You must set configOptions, when calling init");
            }

            //loginResource is used to set authenticated status
            this.updateDataFromCache(this._adal.config.loginResource);
        }
    }

    $get($rootScope: ng.IRootScopeService, $window: ng.IWindowService, $q: ng.IQService,
        $location: ng.ILocationService, $timeout: ng.ITimeoutService): AuthenticationService {
        console.log("adal-angular:AuthenticationServiceProvider.$get");
        
        $rootScope.$on("$routeChangeStart", this.routeChangeHandler);
        $rootScope.$on("$stateChangeStart", this.stateChangeHandler);
        $rootScope.$on("$locationChangeStart", this.locationChangeHandler);
        
        this.AuthenticationService=new AuthenticationService($rootScope, $window, $q, $location, $timeout);
        return this.AuthenticationService;
    }

    constructor() {
        this._adal = null;
        this._oauthData = new OAuthData();
    }
}

class AuthenticationModule {

    private _module: angular.IModule;

    public initialize(): void {
        this._module=angular.module('AdalAngular', []);
        this._module.provider('adalAuthenticationService', AuthenticationServiceProvider);
        this._module.factory('ProtectedResourceInterceptor', AuthenticationInterceptor);
    }

}

var AdalModule = new AuthenticationModule();
AdalModule.initialize();
console.log("adal-angular:loading complete!");

