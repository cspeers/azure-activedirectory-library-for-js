/// <reference path="adal.d.ts" />
import adalangularts = adalangular;
declare module "adal-angular" {
    export = adalangularts;
}
/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */
declare var module: adal.IShimModule;
/**
 * @description ADAL Interfaces used by angular bindings.
 */
declare module adalangular {
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
