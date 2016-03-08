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

class AuthenticationService {
    
    static $inject = ['$rootScope', '$window', '$q', '$location', '$timeout'];
    
    public config:adal.IConfig;
    
    login(): void { this.adal.login(); }

    loginInProgress(): boolean { return this.adal.loginInProgress(); }

    logOut(): void { this.adal.logOut(); }

    getCachedToken(resource: string): string {
        return this.adal.getCachedToken(resource);
    }

    acquireToken(resource: string): ng.IPromise<any> {
        // automated token request call
        var deferred = this.$q.defer();
        this.adal.acquireToken(resource, (error, tokenOut) => {
            if (error) {
                this.adal.error('Error when acquiring token for resource: ' + resource, error);
                deferred.reject(error);
            } else {
                deferred.resolve(tokenOut);
            }
        });

        return deferred.promise;
    }

    getUser(): angular.IPromise<adal.IUser> {
        var deferred = this.$q.defer();
        this.adal.getUser(function(error, user) {
            if (error) {
                this.adal.error('Error when getting user', error);
                deferred.reject(error);
            } else {
                deferred.resolve(user);
            }
        });

        return deferred.promise;
    }

    getResourceForEndpoint(endpoint: string): string {
        return this.adal.getResourceForEndpoint(endpoint);
    }

    clearCache(): void { this.adal.clearCache(); }

    clearCacheForResource(resource: string): void {
        this.adal.clearCacheForResource(resource);
    }

    info(message: string): void { this.adal.info(message); }

    verbose(message: string): void { this.adal.verbose(message); }
    
    constructor(private adal:adal.IAuthenticationContext,private $q: ng.IQService) {
            this.config=adal.config;
            console.log("adal-angular:AuthenticationServiceProvider.$get.ctor()");
    }
}

class AuthenticationInterceptor implements ng.IHttpInterceptor {

    static $inject = ['adalAuthenticationService', '$q', '$rootScope'];

    request(config: IAuthenticatedRequestConfig): IAuthenticatedRequestConfig | ng.IPromise<IAuthenticatedRequestConfig> {
        console.log("adal-angular:AuthenticationInterceptor.request");
        // This interceptor needs to load service, but dependeny definition causes circular reference error.
        // Loading with injector is suggested at github. https://github.com/angular/angular.js/issues/2367

        config.headers = config.headers || {Authorization:null};

        var resource = this.authService.getResourceForEndpoint(config.url);
        if (resource === null) {
            return config;
        }

        var tokenStored = this.authService.getCachedToken(resource);
        var isEndpoint = false;
        
        if (tokenStored) {
            this.authService.info('Token is avaliable for this url ' + config.url);
            // check endpoint mapping if provided
            config.headers.Authorization = 'Bearer ' + tokenStored;
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
                this.authService.acquireToken(resource).then((token) => {
                    this.authService.verbose('Token is avaliable');
                    config.headers.Authorization = 'Bearer ' + token;
                    delayedRequest.resolve(config);
                }, (err) => {
                    delayedRequest.reject(err);
                });

                return delayedRequest.promise;
            }
        }

        return config;
    }
    
    responseError(rejection:any):any|ng.IPromise<any>{
        console.log("adal-angular:AuthenticationInterceptor.responseError");
        this.authService.info('Getting error in the response');
        if (rejection && rejection.status === 401) {
            var resource = this.authService.getResourceForEndpoint(rejection.config.url);
            this.authService.clearCacheForResource(resource);
            this.$rootScope.$broadcast('adal:notAuthorized', rejection, resource);
        }
        return this.$q.reject(rejection);
    }

    constructor(private authService: AuthenticationService, private $q: ng.IQService, private $rootScope: IAuthenticationRootScope) {
        console.log("adal-angular:AuthenticationInterceptor.ctor()");
    }

}

class AuthenticationServiceProvider implements ng.IServiceProvider{
    
    
    private _adal:adal.IAuthenticationContext;
    private _oauthData=new OAuthData();
        
    $get($rootScope: IAuthenticationRootScope, $window: ng.IWindowService,$q: ng.IQService, $location: ng.ILocationService, $timeout: ng.ITimeoutService): any {
            
       console.log("adal-angular:AuthenticationServiceProvider.$get() -> BEGIN");

        var updateDataFromCache = (resource: string): void => {
            // only cache lookup here to not interrupt with events
            var token = this._adal.getCachedToken(resource);
            this._oauthData.isAuthenticated = token !== null && token.length > 0;
            var user = this._adal.getCachedUser() || { userName: '' };
            this._oauthData.userName = user.userName;
            this._oauthData.profile = user.profile;
            this._oauthData.loginError = this._adal.getLoginError();
        };

        var locationChangeHandler = ()=> {

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
                        updateDataFromCache(this._adal.config.loginResource);
                        if (this._oauthData.userName) {
                            //IDtoken is added as token for the app
                            $timeout(() => {
                                updateDataFromCache(this._adal.config.loginResource);
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
                updateDataFromCache(this._adal.config.loginResource);
                if (!this._adal.renewActive && !this._oauthData.isAuthenticated && this._oauthData.userName) {
                    if (!this._adal.getItem(this._adal.CONSTANTS.STORAGE.FAILED_RENEW)) {
                        // Idtoken is expired or not present
                        this._adal.acquireToken(this._adal.config.loginResource, (error, tokenOut) => {
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
                updateDataFromCache(this._adal.config.loginResource);
                ($rootScope as any).userInfo = this._oauthData;
            }, 1);
        }

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
        }

        var isADLoginRequired = (route: any, global: any)=> {
            return global.requireADLogin ? route.requireADLogin !== false : !!route.requireADLogin;
        }

        var routeChangeHandler = (e: any, nextRoute: any)=> {
            if (nextRoute && nextRoute.$$route && isADLoginRequired(nextRoute.$$route, this._adal.config)) {
                if (!this._oauthData.isAuthenticated) {
                    this._adal.info("Route change event for:" + ($location as any).$$url);
                    loginHandler();
                }
            }
        }

        var stateChangeHandler = (e: any, toState: any, toParams: any, fromState: any, fromParams: any)=> {
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
        }

        $rootScope.$on('$routeChangeStart', routeChangeHandler);

        $rootScope.$on('$stateChangeStart', stateChangeHandler);

        $rootScope.$on('$locationChangeStart', locationChangeHandler);

        updateDataFromCache(this._adal.config.loginResource);

        $rootScope.userInfo = this._oauthData;

        console.log("adal-angular:AuthenticationServiceProvider.$get -> END");
                     
        return new AuthenticationService(this._adal,$q);
    }
    
    init(configOptions: adal.IConfig, httpProvider: ng.IHttpProvider): void {
        console.log("adal-angular:AuthenticationServiceProvider.init()");
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
            this._adal = new $adal(configOptions);
        } else {
            throw new Error("You must set configOptions, when calling init");
        }
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

