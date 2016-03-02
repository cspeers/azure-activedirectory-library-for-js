/// <reference path="../jquery/jquery.d.ts"/>
/// <reference path="../angularjs/angular.d.ts" />

import adal=require("../adal/adal");

/**
 * @description String Constants for the module
 */
class Constants {
    /**
     * @description The exposed The Angular Module Name
     */
    public static ModuleName = "AdalAngular";
    /**
     * @description The exposed Angular Service Name
     */
    public static ServiceName = "AdalAuthenticationService";
    /**
     * @description The exposed Angular Provider Name
     */
    public static ProviderName = "AdalAuthenticationServiceProvider";
    /**
     * @description The exposed Angular Http Interceptor Name
     */
    public static InterceptorName = "ProtectedResourceInterceptor";
}

/**
 * @description Base contract for User Data
 */
export interface IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: adal.IUserProfile;
}

/**
 * @description Concrete implementation for User Data
 */
class OAuthData implements IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: adal.IUserProfile;
}

/**
 * @desc Extension contract for an Angular service provider
 */
interface IAngularServiceProvider extends angular.IServiceProvider {
}

/**
 * @desc Extension contract for an Angular Http interceptor
 */
interface IAdalHttpInterceptor extends angular.IHttpInterceptor {
    request(config: any): any;
    responseError(rejection: any): any;
}

interface IAdalServiceProviderFactory extends angular.IServiceProviderFactory{
    (...args: any[]): angular.IServiceProvider;
}

interface IAdalServiceProvider extends angular.IServiceProvider {
    
}

abstract class AdalServiceProviderBase implements IAdalServiceProvider {

    protected _adal:adal.AuthenticationContext;
    protected _oauthData: IOAuthData = {
        isAuthenticated: false,
        userName: "",
        loginError: "",
        profile: null
    };

    initMethod: any = ($rootScope:angular.IRootScopeService, $window:Window, $q:angular.IQService, $location:angular.ILocationService, $timeout:angular.ITimeoutService): any => {

    };

    protected updateDataFromCache(resource: string):void{
        // only cache lookup here to not interrupt with events
        var token = this._adal.getCachedToken(resource);
        this._oauthData.isAuthenticated = token !== null && token.length > 0;
        var user= this._adal.getCachedUser() || { userName: '',profile:null };
        this._oauthData.userName = user.userName;
        this._oauthData.profile = user.profile;
        this._oauthData.loginError = this._adal.getLoginError();
    }

    $get: any;

    init(configOptions: adal.IConfig, httpProvider: angular.IHttpProvider) {
        if (configOptions) {
            // redirect and logout_redirect are set to current location by default
            var existingHash = window.location.hash;
            var pathDefault = window.location.href;
            if (existingHash) {
                pathDefault = pathDefault.replace(existingHash, '');
            }
            configOptions.redirectUri = configOptions.redirectUri || pathDefault;
            configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;

            if (httpProvider && httpProvider.interceptors) {
                httpProvider.interceptors.push('ProtectedResourceInterceptor');
            }

            // create instance with given config
            this._adal = new adal.AuthenticationContext(configOptions);
        } else {
            throw new Error('You must set configOptions, when calling init');
        }

        // loginresource is used to set authenticated status
        this.updateDataFromCache(this._adal.config.loginResource);
    }

    constructor() {

    }
}

class AdalServiceProvider extends AdalServiceProviderBase {

}


if (angular) {
    var AdalModule=angular.module(Constants.ModuleName,[]);
    AdalModule.provider(Constants.ServiceName);
}
else {
    console.error("Angular.JS is not included");
}

export function inject(conf:adal.IConfig):adal.IAuthenticationContext{
    return new adal.AuthenticationContext(conf);
}