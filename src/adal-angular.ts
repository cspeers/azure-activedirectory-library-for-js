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

interface IAuthenticatedRequestConfig extends ng.IRequestConfig {
    headers: IAuthenticatedRequestHeaders;
}

interface IAuthenticationRootScope extends ng.IRootScopeService {
    userInfo: adal.IOAuthData;
}

interface IAuthenticatedRequestHeaders extends ng.IHttpRequestConfigHeaders {
    Authorization: string;
}

class ProtectedResourceInterceptor implements ng.IHttpInterceptor {

    static $inject = ['adalAuthenticationService', '$q', '$rootScope'];
    
    request(config: IAuthenticatedRequestConfig): IAuthenticatedRequestConfig|angular.IPromise<IAuthenticatedRequestConfig> {
        console.log("adal-angular:HttpInterceptor[request]");
        if (config) {
            // This interceptor needs to load service, but dependeny definition causes circular reference error.
            // Loading with injector is suggested at github. https://github.com/angular/angular.js/issues/2367

            var configHeaders:IAuthenticatedRequestHeaders=config.headers || {Authorization:null};

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
                    this.authService.info('login already started.');
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

    constructor(private authService: AuthenticationService, private $q: angular.IQService, private $rootScope: angular.IRootScopeService) {
        console.log("adal-angular:AuthenticationInterceptor.ctor()");
    }

}

class AuthenticationService {

    static $inject: Array<string> = ['$rootScope', '$window', '$q', '$location', '$timeout'];
    static context:adal.IAuthenticationContext;

    //region Private variables
    private _oauthData: adal.IOAuthData;
    //endregion

    config: adal.IConfig=AuthenticationService.context.config;
    userInfo: adal.IOAuthData;

    //region Service Methods

    login(): void { AuthenticationService.context.login(); }

    loginInProgress(): boolean { return AuthenticationService.context.loginInProgress(); }

    logOut(): void { AuthenticationService.context.logOut(); }

    getCachedToken(resource: string): string {
        return AuthenticationService.context.getCachedToken(resource);
    }

    acquireToken(resource: string): ng.IPromise<any> {
        // automated token request call
        var deferred = this.$q.defer();
        AuthenticationService.context.acquireToken(resource, (error, tokenOut) => {
            if (error) {
                AuthenticationService.context.error('Error when acquiring token for resource: ' + resource, error);
                deferred.reject(error);
            } else {
                deferred.resolve(tokenOut);
            }
        });

        return deferred.promise;
    }

    getUser(): angular.IPromise<adal.IUser> {
        var deferred = this.$q.defer();
        AuthenticationService.context.getUser(function (error, user) {
            if (error) {
                AuthenticationService.context.error('Error when getting user', error);
                deferred.reject(error);
            } else {
                deferred.resolve(user);
            }
        });

        return deferred.promise;
    }

    getResourceForEndpoint(endpoint: string): string {
        return AuthenticationService.context.getResourceForEndpoint(endpoint);
    }

    clearCache(): void { AuthenticationService.context.clearCache(); }

    clearCacheForResource(resource: string): void {
        AuthenticationService.context.clearCacheForResource(resource);
    }

    info(message: string): void {AuthenticationService.context.info(message);}

    verbose(message: string): void { AuthenticationService.context.verbose(message); }

    private loginHandler(): void {
        AuthenticationService.context.info("Login event for:" + (this.$location as any).$$url);
        if (AuthenticationService.context.config && AuthenticationService.context.config.localLoginUrl) {
            this.$location.path(AuthenticationService.context.config.localLoginUrl);
        } else {
            // directly start login flow
            AuthenticationService.context.saveItem(AuthenticationService.context.CONSTANTS.STORAGE.START_PAGE, (this.$location as any).$$url);
            AuthenticationService.context.info("Start login at:" + window.location.href);
            this.$rootScope.$broadcast("adal:loginRedirect");
            AuthenticationService.context.login();
        }
    }

    private isADLoginRequired(route: any, global: any): boolean {
        return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
    }

    private stateChangeHandler(e: any, toState: any, toParams: any, fromState: any, fromParams: any): void {
        if (toState && this.isADLoginRequired(toState, AuthenticationService.context.config)) {
            if (!this._oauthData.isAuthenticated) {
                // $location.$$url is set as the page we are coming from
                // Update it so we can store the actual location we want to
                // redirect to upon returning
                (this.$location as any).$$url = toState.url;

                // Parameters are not stored in the url on stateChange so
                // we store them
                AuthenticationService.context.saveItem(AuthenticationService.context.CONSTANTS.STORAGE.START_PAGE_PARAMS, JSON.stringify(toParams));

                AuthenticationService.context.info("State change event for:" + (this.$location as any).$$url);
                this.loginHandler();
            }
        }
    }

    private locationChangeHandler(): void {

        var hash = this.$window.location.hash;

        if (AuthenticationService.context.isCallback(hash)) {
            // callback can come from login or iframe request
            var requestInfo = AuthenticationService.context.getRequestInfo(hash);
            AuthenticationService.context.saveTokenFromHash(requestInfo);

            if ((<any>this.$location).$$html5) {
                this.$window.location.assign(this.$window.location.origin + this.$window.location.pathname);
            } else {
                this.$window.location.hash = "";
            }

            if (requestInfo.requestType !== AuthenticationService.context.REQUEST_TYPE.LOGIN) {
                AuthenticationService.context.callback = (this.$window.parent as any).AuthenticationContext().callback;
                if (requestInfo.requestType === AuthenticationService.context.REQUEST_TYPE.RENEW_TOKEN) {
                    AuthenticationService.context.callback = (this.$window.parent as any).callBackMappedToRenewStates[requestInfo.stateResponse];
                }
            }

            // Return to callback if it is send from iframe
            if (requestInfo.stateMatch) {
                if (typeof AuthenticationService.context.callback === "function") {
                    // Call within the same context without full page redirect keeps the callback
                    if (requestInfo.requestType === AuthenticationService.context.REQUEST_TYPE.RENEW_TOKEN) {
                        // Idtoken or Accestoken can be renewed
                        if (requestInfo.parameters["access_token"]) {
                            AuthenticationService.context.callback(AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["access_token"]);
                            return;
                        } else if (requestInfo.parameters["id_token"]) {
                            AuthenticationService.context.callback(AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters["id_token"]);
                            return;
                        }
                    }
                } else {
                    // normal full login redirect happened on the page
                    this.updateDataFromCache(AuthenticationService.context.config.loginResource);
                    if (this._oauthData.userName) {
                        //IDtoken is added as token for the app
                        this.$timeout(() => {
                            this.updateDataFromCache(AuthenticationService.context.config.loginResource);
                            (this.$rootScope as any).userInfo = this._oauthData;
                            // redirect to login requested page
                            var loginStartPage = AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.START_PAGE);
                            if (loginStartPage) {
                                // Check to see if any params were stored
                                var paramsJSON = AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.START_PAGE_PARAMS);

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
                        this.$rootScope.$broadcast("adal:loginFailure", AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.ERROR_DESCRIPTION));
                    }
                }
            }
        } else {
            // No callback. App resumes after closing or moving to new page.
            // Check token and username
            this.updateDataFromCache(AuthenticationService.context.config.loginResource);
            if (!AuthenticationService.context.renewActive && !this._oauthData.isAuthenticated && this._oauthData.userName) {
                if (!AuthenticationService.context.getItem(AuthenticationService.context.CONSTANTS.STORAGE.FAILED_RENEW)) {
                    // Idtoken is expired or not present
                    AuthenticationService.context.acquireToken(AuthenticationService.context.config.loginResource, (error, tokenOut) => {
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
            this.updateDataFromCache(AuthenticationService.context.config.loginResource);
            (this.$rootScope as any).userInfo = this._oauthData;
        }, 1);
    }

    private routeChangeHandler(e: any, nextRoute: any): void {
        if (nextRoute && nextRoute.$$route && this.isADLoginRequired(nextRoute.$$route, AuthenticationService.context.config)) {
            if (!this._oauthData.isAuthenticated) {
                AuthenticationService.context.info("Route change event for:" + (this.$location as any).$$url);
                this.loginHandler();
            }
        }
    }

    private updateDataFromCache(resource: string): void {
        console.log("adal-angular:AuthenticationService updating data from Cache")
        // only cache lookup here to not interrupt with events
        var token = AuthenticationService.context.getCachedToken(resource);
        this._oauthData.isAuthenticated = token !== null && token.length > 0;
        var user = AuthenticationService.context.getCachedUser() || { userName: "", profile: null };
        this._oauthData.userName = user.userName;
        this._oauthData.profile = user.profile;
        this._oauthData.loginError = AuthenticationService.context.getLoginError();
    }

    //endregion

    constructor( private $rootScope: IAuthenticationRootScope,  private $window: angular.IWindowService, private $q: angular.IQService,  private $location: angular.ILocationService,  private $timeout: angular.ITimeoutService) {

        console.log("adal-angular:AuthenticationService.ctor()");

        this._oauthData = new OAuthData();
        $rootScope.$on("$routeChangeStart", this.routeChangeHandler);
        $rootScope.$on("$stateChangeStart", this.stateChangeHandler);
        $rootScope.$on("$locationChangeStart", this.locationChangeHandler);
        this.updateDataFromCache(AuthenticationService.context.config.loginResource);


    }

}

class AuthenticationServiceProvider implements ng.IServiceProvider {

    static $inject: Array<string> = [];

    init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void {
        console.log("adal-angular:AuthenticationServiceProvider.init()")

        if (configOptions) {

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
                AuthenticationService.context = new $adal(configOptions);
            } else {
                throw new Error("You must set configOptions, when calling init");
            }
        }
    }

    $get($rootScope: IAuthenticationRootScope, $window: ng.IWindowService, $q: ng.IQService,
        $location: ng.ILocationService, $timeout: ng.ITimeoutService): AuthenticationService {
        console.log("adal-angular:AuthenticationServiceProvider.$get");
        return new AuthenticationService($rootScope, $window, $q, $location, $timeout);
    }

    constructor() {
        AuthenticationService.context=null;
    }
}

class AuthenticationModule {

    private _module: angular.IModule;

    public initialize(): void {
        this._module=angular.module('AdalAngular', []);
        this._module.provider('adalAuthenticationService', AuthenticationServiceProvider);
        this._module.factory('ProtectedResourceInterceptor', ProtectedResourceInterceptor);
    }

}

var AdalModule = new AuthenticationModule();
AdalModule.initialize();
console.log("adal-angular:loading complete!");

