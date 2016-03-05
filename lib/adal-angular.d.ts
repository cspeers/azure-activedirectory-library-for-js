/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="adal.d.ts" />
import * as adal from "./adal";
/**
 * @description module dependency injection for commonjs
 *
 * @param config {Config} The Authentication Context configuration to be used
 */
export declare function inject(config: adal.IConfig): adal.IAuthenticationContext;
export declare class AdalAuthenticationService implements angular.IServiceProvider {
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
    constructor();
}
export declare class AdalHttpInterceptor implements angular.IHttpInterceptor {
    request: (config: angular.IRequestConfig) => angular.IRequestConfig | angular.IPromise<angular.IRequestConfig>;
    response: (rejection: any) => void;
    constructor(authService: AdalAuthenticationService, $q: angular.IQService, $rootScope: angular.IRootScopeService);
}
export interface IAdalRootScope extends angular.IRootScopeService {
    userInfo: adal.IOAuthData;
}
