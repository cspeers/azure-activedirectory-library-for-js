/// <reference path="adal.d.ts" />
/// <reference path="../typings/angularjs/angular.d.ts" />
import adalangularts = adalangular;
declare module "adal-angular" {
    export = adalangularts;
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
/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */
declare var module: adal.IShimModule;
