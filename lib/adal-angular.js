/// <reference path="../jquery/jquery.d.ts"/>
/// <reference path="../angularjs/angular.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var adal = require("../adal/adal");
/**
 * @description String Constants for the module
 */
var Constants = (function () {
    function Constants() {
    }
    /**
     * @description The exposed The Angular Module Name
     */
    Constants.ModuleName = "AdalAngular";
    /**
     * @description The exposed Angular Service Name
     */
    Constants.ServiceName = "AdalAuthenticationService";
    /**
     * @description The exposed Angular Provider Name
     */
    Constants.ProviderName = "AdalAuthenticationServiceProvider";
    /**
     * @description The exposed Angular Http Interceptor Name
     */
    Constants.InterceptorName = "ProtectedResourceInterceptor";
    return Constants;
})();
/**
 * @description Concrete implementation for User Data
 */
var OAuthData = (function () {
    function OAuthData() {
    }
    return OAuthData;
})();
var AdalServiceProviderBase = (function () {
    function AdalServiceProviderBase() {
        this._oauthData = {
            isAuthenticated: false,
            userName: "",
            loginError: "",
            profile: null
        };
        this.initMethod = function ($rootScope, $window, $q, $location, $timeout) {
        };
    }
    AdalServiceProviderBase.prototype.updateDataFromCache = function (resource) {
        // only cache lookup here to not interrupt with events
        var token = this._adal.getCachedToken(resource);
        this._oauthData.isAuthenticated = token !== null && token.length > 0;
        var user = this._adal.getCachedUser() || { userName: '', profile: null };
        this._oauthData.userName = user.userName;
        this._oauthData.profile = user.profile;
        this._oauthData.loginError = this._adal.getLoginError();
    };
    AdalServiceProviderBase.prototype.init = function (configOptions, httpProvider) {
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
        }
        else {
            throw new Error('You must set configOptions, when calling init');
        }
        // loginresource is used to set authenticated status
        this.updateDataFromCache(this._adal.config.loginResource);
    };
    return AdalServiceProviderBase;
})();
var AdalServiceProvider = (function (_super) {
    __extends(AdalServiceProvider, _super);
    function AdalServiceProvider() {
        _super.apply(this, arguments);
    }
    return AdalServiceProvider;
})(AdalServiceProviderBase);
if (angular) {
    var AdalModule = angular.module(Constants.ModuleName, []);
    AdalModule.provider(Constants.ServiceName);
}
else {
    console.error("Angular.JS is not included");
}
function inject(conf) {
    return new adal.AuthenticationContext(conf);
}
exports.inject = inject;
//# sourceMappingURL=adal-angular.js.map