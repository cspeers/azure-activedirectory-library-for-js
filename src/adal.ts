/// <reference path="adal/adal.d.ts" />
"use strict";
console.log("adal-ts:loading beginning...");

console.log("adal-ts:setting up context factory...");

let $Adal:adal.ContextFactory<adal.IAuthenticationContext>={
  Create:(cfg:adal.IConfig)=>{
      return new AuthenticationContext(cfg);
  }  
};


console.log("adal-ts:exporting classes and methods");

/**
 * @description module dependency injection for commonjs
 *
 * @param config {Config} The Authentication Context configuration to be used
 */
export function inject(config:adal.IConfig):adal.IAuthenticationContext {
    return $Adal.Create<adal.IAuthenticationContext>(config);
}

/**
 * @description Concrete implementation of OAuth Request Parameters
 */
export class RequestParameters implements adal.IRequestParameters {
    error: string;
    errorDescription: string;
    id_token: string;
    state: string;
    access_token: string;

    static deserialize(query: string): adal.IRequestParameters {
        var match: RegExpMatchArray,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = (s: string) => decodeURIComponent(s.replace(pl, " ")),
            obj = new RequestParameters();
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }

        return obj;
    }

    static serialize(responseType: string, obj: adal.IConfig, resource: string): string {
        var str = new Array<string>();
        if (obj !== null) {
            str.push("?response_type=" + responseType);
            str.push("client_id=" + encodeURIComponent(obj.clientId));
            if (resource) {
                str.push("resource=" + encodeURIComponent(resource));
            }

            str.push("redirect_uri=" + encodeURIComponent(obj.redirectUri));
            str.push("state=" + encodeURIComponent(obj.state));

            if (obj.hasOwnProperty("slice")) {
                str.push("slice=" + encodeURIComponent(obj.slice));
            }

            if (obj.hasOwnProperty("extraQueryParameter")) {
                str.push(obj.extraQueryParameter);
            }

            if (obj.correlationId) {
                str.push("client-request-id=" + encodeURIComponent(obj.correlationId));
            }
        }
        return str.join("&");
    }

    [key: string]: any;
}

/**
* @description Concrete implementation Token Requests
*/
export class RequestInfo implements adal.IRequestInfo {
    valid: boolean;
    parameters: adal.IRequestParameters;
    stateMatch: boolean;
    stateResponse: string;
    requestType: string;
}

/**
 * @description Concrete implementation of a dictionary of
 *  resource URI and Callbacks
 */
export class CallbackMap<T> implements adal.ICallbackMap<T> {
    [index: string]: T;
}

/**
 * @description Concrete implementation of a User
 */
export class User implements adal.IUser {
    userName: string;
    profile: adal.IUserProfile=null;
}

/**
* @description Concrete implementation of JWT
* @see IToken
*/
export class Token implements adal.IToken {

    header: string;
    JWSPayload: string;
    JWSSig: string;

    static toJwt(matches: RegExpMatchArray): Token {
        return new Token(matches[1], matches[2], matches[3]);
    }

    static decodeJwt(jwtToken: string): adal.IToken {
        if (jwtToken === null) {
            return null;
        };

        var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;

        var matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            return null;
        }

        var crackedToken = Token.toJwt(matches);

        return crackedToken;
    };

    static decode(base64IdToken: string): string {
        var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        base64IdToken = String(base64IdToken).replace(/=+$/, "");

        var length = base64IdToken.length;
        if (length % 4 === 1) {
            throw new Error("The token to be decoded is not correctly encoded.");
        }

        var h1: number, h2: number, h3: number, h4: number, bits: number, c1: number, c2: number, c3: number, decoded = "";
        for (var i = 0; i < length; i += 4) {
            //Every 4 base64 encoded character will be converted to 3 byte string, which is 24 bits
            // then 6 bits per base64 encoded character
            h1 = codes.indexOf(base64IdToken.charAt(i));
            h2 = codes.indexOf(base64IdToken.charAt(i + 1));
            h3 = codes.indexOf(base64IdToken.charAt(i + 2));
            h4 = codes.indexOf(base64IdToken.charAt(i + 3));

            // For padding, if last two are '='
            if (i + 2 === length - 1) {
                bits = h1 << 18 | h2 << 12 | h3 << 6;
                c1 = bits >> 16 & 255;
                c2 = bits >> 8 & 255;
                decoded += String.fromCharCode(c1, c2);
                break;
            }
            // if last one is '='
            else if (i + 1 === length - 1) {
                bits = h1 << 18 | h2 << 12
                c1 = bits >> 16 & 255;
                decoded += String.fromCharCode(c1);
                break;
            }

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            // then convert to 3 byte chars
            c1 = bits >> 16 & 255;
            c2 = bits >> 8 & 255;
            c3 = bits & 255;

            decoded += String.fromCharCode(c1, c2, c3);
        }

        return decoded;
    }

    static base64DecodeStringUrlSafe(base64IdToken: string): string {
        // html5 should support atob function for decoding
        base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
        if (window.atob) {
            return decodeURIComponent(encodeURIComponent(window.atob(base64IdToken))); // jshint ignore:line
        } else {
            return decodeURIComponent(encodeURIComponent(Token.decode(base64IdToken)));
        }
    }

    static convertUrlSafeToRegularBase64EncodedString(str: string): string {
        return str.replace("-", "+").replace("_", "/");
    }

    constructor(header: string, payload: string, signature: string) {
        this.header = header;
        this.JWSPayload = payload;
        this.JWSSig = signature;
    }
}

/**
* @description  Concrete implementation of Resource Uri to Endpoint Mapping
*/
export class EndpointCollection implements adal.IEndpointCollection {
    [key: string]: string;
}

/**
* @description Helper class for guids
*/
export class Guid {

    static newGuid(): string {
        var guidHolder = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        var hex = "0123456789abcdef";
        var r = 0;
        var guidResponse = "";
        for (var i = 0; i < 36; i++) {
            if (guidHolder[i] !== "-" && guidHolder[i] !== "4") {
                // each x and y needs to be random
                r = Math.random() * 16 | 0;
            }

            if (guidHolder[i] === "x") {
                guidResponse += hex[r];
            } else if (guidHolder[i] === "y") {
                // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                r |= 0x8; // set pos 3 to 1 as 1???
                guidResponse += hex[r];
            } else {
                guidResponse += guidHolder[i];
            }
        }
        return guidResponse;
    };
}

/**
 * @description Helper class for DateTime methods
 */
export class DateTime {
    static now(): number {
        return Math.round(new Date().getTime() / 1000.0);
    };
}

/**
* @description Class containing Browser Helper Methods
*/
export class BrowserHelpers {

    static supportsLocalStorage(): boolean {
        try {
            return Boolean("localStorage" in window && window["localStorage"]);
        } catch (e) {
            return false;
        }
    };

    static supportsSessionStorage(): boolean {
        try {
            return Boolean("sessionStorage" in window && window["sessionStorage"]);
        } catch (e) {
            return false;
        }
    }
}

class RenewalList implements adal.IRenewalList {
    [resource: string]: any;
}

/**
* @description Enumeration for Token Request Types
*/
export class RequestTypes implements adal.IRequestTypes{
    LOGIN: string = "LOGIN";
    RENEW_TOKEN: string = "RENEW_TOKEN";
    ID_TOKEN: string = "ID_TOKEN";
    UNKNOWN: string = "UNKNOWN";
    
    [key:string]:string;
}

/**
 * @description Enumeration for Error Messages
 */
export class ErrorMessages implements adal.IErrorMessages{
    NO_TOKEN: string = "User is not authorized";
    [key:string]:string;
}

/**
 * @description Enumeration for Log Severity Levels
 */
export class LoggingLevels {
    ERROR = 0;
    WARN = 1;
    INFO = 2;
    VERBOSE = 3;
}

/**
 * @description Constants for token storage field names
 */
export class StorageConstants {
    TOKEN_KEYS: string = "adal.token.keys";
    ACCESS_TOKEN_KEY: string = "adal.access.token.key";
    EXPIRATION_KEY: string = "adal.expiration.key";
    START_PAGE: string = "adal.start.page";
    START_PAGE_PARAMS: string = "adal.start.page.params";
    FAILED_RENEW: string = "adal.failed.renew";
    STATE_LOGIN: string = "adal.state.login";
    STATE_RENEW: string = "adal.state.renew";
    STATE_RENEW_RESOURCE: string = "adal.state.renew.resource";
    STATE_IDTOKEN: string = "adal.state.idtoken";
    NONCE_IDTOKEN: string = "adal.nonce.idtoken";
    SESSION_STATE: string = "adal.session.state";
    USERNAME: string = "adal.username";
    IDTOKEN: string = "adal.idtoken";
    ERROR: string = "adal.error";
    ERROR_DESCRIPTION: string = "adal.error.description";
    LOGIN_REQUEST: string = "adal.login.request";
    LOGIN_ERROR: string = "adal.login.error";
}

/**
 * @description General Constants
 */
export class Constants {
    ACCESS_TOKEN: string = "access_token";
    EXPIRES_IN: string = "expires_in";
    ID_TOKEN: string = "id_token";
    ERROR_DESCRIPTION: string = "error_description";
    SESSION_STATE: string = "session_state";
    STORAGE = new StorageConstants();
    RESOURCE_DELIMETER: string = "|";
    LOGGING_LEVEL = new LoggingLevels();
    LEVEL_STRING_MAP: adal.IStringMap = {
        0: "ERROR:",
        1: "WARNING:",
        2: "INFO:",
        3: "VERBOSE:"
    };
    LIBRARY_VERSION: string = "1.0.8";
}

/**
 * @description Generic logging class
 */
export class Logging {
    static level: number = 0;
    static log: adal.ILogFunction = (m: string) => { console.log(m); }
}

/**
 * @desc Concrete implementation of Configuration Options
 */
export class Config implements adal.IConfig {

    displayCall: adal.IDisplayCall;
    tenant: string;
    clientId: string;
    redirectUri: string;
    instance: string;
    endpoints: adal.IEndpointCollection;
    correlationId: string;
    cacheLocation: string;
    resource: string;
    loginResource: string;
    state: string;
    expireOffsetSeconds: number;
    localLoginUrl: string;
    postLogoutRedirectUri: string;
    extraQueryParameter: string;
    slice: string;

    [key: string]: any;

    constructor() {
        this.correlationId = Guid.newGuid();
        this.endpoints = new EndpointCollection();
    }
}

/**
* OAuthData implements IOAuthData
*/
export class OAuthData implements adal.IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: adal.IUserProfile;
}

/**
 * @description Concrete implementation of Azure Active Directory Authentication Context
 */
export class AuthenticationContext implements adal.IAuthenticationContext {

    instance: string="https://login.microsoftonline.com/";
    config: Config;
    popUp: boolean = false;
    frameCallInProgress: boolean;
    callback: adal.IRequestCallback;
    idTokenNonce: string;
    renewActive = false;
    singletonInstance:AuthenticationContext;

    REQUEST_TYPE = new RequestTypes();
    CONSTANTS = new Constants();

    private _user: User;
    private _loginInProgress: boolean = false;
    private _libVersion(): string { return this.CONSTANTS.LIBRARY_VERSION; }
    private _idTokenNonce: string;
    private _renewStates: Array<string> = [];
    private _activeRenewals: RenewalList;
    
    public Library_Version:string=this._libVersion();
    
    getResourceForEndpoint(endpoint: string): string {
        if (this.config && this.config.endpoints) {
            for (var configEndpoint in this.config.endpoints) {
                // configEndpoint is like /api/Todo requested endpoint can be /api/Todo/1
                if (endpoint.indexOf(configEndpoint) > -1) {
                    return this.config.endpoints[configEndpoint];
                }
            }
        }
        // default resource will be clientid if nothing specified
        // App will use idtoken for calls to itself
        // check if it's staring from http or https, needs to match with app host
        if (endpoint.indexOf('http://') > -1 || endpoint.indexOf('https://') > -1) {
            if (this._getHostFromUri(endpoint) === this._getHostFromUri(this.config.redirectUri)) {
                return this.config.loginResource;
            }
        } else {
            // in angular level, the url for $http interceptor call could be relative url, 
            // if it's relative call, we'll treat it as app backend call. 
            return this.config.loginResource;
        }

        // if not the app's own backend or not a domain listed in the endpoints structure
        return null;
    }

    loginInProgress(): boolean { return this._loginInProgress; }

    clearCache(): void {
        this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY, "");
        this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY, 0);
        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, "");
        this._renewStates = [];
        this._saveItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN, "");
        this._saveItem(this.CONSTANTS.STORAGE.START_PAGE, "");
        this._saveItem(this.CONSTANTS.STORAGE.START_PAGE_PARAMS, "");
        this._saveItem(this.CONSTANTS.STORAGE.USERNAME, "");
        this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");
        var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);

        if (!this._isEmpty(keys)) {
            keys = keys.split(this.CONSTANTS.RESOURCE_DELIMETER);
            for (var i = 0; i < keys.length; i++) {
                this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + keys[i], "");
                this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + keys[i], 0);
            }
        }
        this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, "");
    }

    clearCacheForResource(resource: string): void {
        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");
        if (this._hasResource(resource)) {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, "");
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
        }
    }

    getLoginError(): string {
        return this._getItem(this.CONSTANTS.STORAGE.LOGIN_ERROR);
    }

    log(level: number, message: string, error: any): void {
        if (level <= Logging.level) {
            var correlationId = this.config.correlationId;
            var timestamp = new Date().toUTCString();

            var formattedMessage = timestamp + ":" + correlationId + "-" + this.CONSTANTS.LEVEL_STRING_MAP[level] + " " + message;
            if (error) {
                formattedMessage += "\nstack:\n" + error.stack;
            }
            Logging.log(formattedMessage);
        }
    }

    error(message: string, error: any): void {
        this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR, message, error);
    };

    warn(message: string): void {
        this.log(this.CONSTANTS.LOGGING_LEVEL.WARN, message, null);
    };

    info(message: string): void {
        this.log(this.CONSTANTS.LOGGING_LEVEL.INFO, message, null);
    };

    verbose(message: string): void {
        this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE, message, null);
    };

    isCallback(hash: string): boolean {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        return (
            parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
            parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)
        );
    }

    getCachedToken(resource: string): string {
        if (!this._hasResource(resource)) {
            return null;
        }

        var token = this._getItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource) as string;
        var expired = this._getItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource) as number;

        // If expiration is within offset, it will force renew
        var offset = this.config.expireOffsetSeconds || 120;

        if (expired && (expired > this._now() + offset)) {
            return token;
        } else {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, '');
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
            return null;
        }
    }

    private _getHostFromUri(uri: string): string {
        // remove http:// or https:// from uri
        var extractedUri = String(uri).replace(/^(https?:)\/\//, '');

        extractedUri = extractedUri.split('/')[0];
        return extractedUri;
    }

    private _logstatus(msg: string) {
        if (console) {
            console.log(msg);
        }
    }

    private _getHash(hash: string): string {
        if (hash.indexOf("#/") > -1) {
            hash = hash.substring(hash.indexOf("#/") + 2);
        } else if (hash.indexOf("#") > -1) {
            hash = hash.substring(1);
        }

        return hash;
    }

    private _expiresIn(expires: string): number {
        return DateTime.now() + parseInt(expires, 10);
    }

    private _addClientId(): string {
        // x-client-SKU
        // x-client-Ver
        return "&x-client-SKU=Js&x-client-Ver=" + this._libVersion();
    };

    private _supportsLocalStorage(): boolean {
        return BrowserHelpers.supportsLocalStorage();
    }

    private _urlContainsQueryStringParameter(name: string, url: string): boolean {
        // regex to detect pattern of a ? or & followed by the name parameter and an equals character
        var regex = new RegExp("[\\?&]" + name + "=");
        return regex.test(url);
    }

    private _supportsSessionStorage(): boolean {
        return BrowserHelpers.supportsSessionStorage();
    }

    private _getItem(key: string): any {

        if (this.config && this.config.cacheLocation && this.config.cacheLocation === "localStorage") {

            if (!this._supportsLocalStorage()) {
                this.info("Local storage is not supported");
                return null;
            }

            return localStorage.getItem(key);
        }
    
        // Default as session storage
        if (!this._supportsSessionStorage()) {
            this.info("Session storage is not supported");
            return null;
        }

        return sessionStorage.getItem(key);
    }

    getItem(key: string): any {
        return this._getItem(key);
    }

    saveItem(key: string, obj: any): boolean {
        return this._saveItem(key, obj);
    }

    private _saveItem(key: string, obj: any): boolean {

        if (this.config && this.config.cacheLocation && this.config.cacheLocation === "localStorage") {

            if (!this._supportsLocalStorage()) {
                this.info("Local storage is not supported");
                return false;
            }

            localStorage.setItem(key, obj);

            return true;
        }
    
        // Default as session storage
        if (!this._supportsSessionStorage()) {
            this.info("Session storage is not supported");
            return false;
        }

        sessionStorage.setItem(key, obj);
        return true;
    };

    private _getResourceFromState(state: string): string {
        if (state) {
            var splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    }

    private _isEmpty(str: string): boolean {
        return (typeof str === "undefined" || !str || 0 === str.length);
    }

    private _hasResource(key: string): boolean {
        var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) as string;
        return keys && !this._isEmpty(keys) && (keys.indexOf(key + this.CONSTANTS.RESOURCE_DELIMETER) > -1);
    }

    private _guid(): string {
        return Guid.newGuid();
    }

    private _now(): number {
        return DateTime.now();
    }

    private _addAdalFrame(iframeId: string): HTMLIFrameElement {
        if (typeof iframeId === "undefined") {
            return null;
        }

        this._logstatus("Add AdalTS frame to document:" + iframeId);
        var adalFrame = document.getElementById(iframeId) as HTMLIFrameElement;
        if (!adalFrame) {
            if (document.createElement && document.documentElement && window.navigator.userAgent.indexOf("MSIE 5.0") === -1) {
                var ifr = document.createElement("iframe");
                ifr.setAttribute("id", iframeId);
                ifr.style.visibility = "hidden";
                ifr.style.position = "absolute";
                ifr.style.width = ifr.style.height = ifr.frameBorder = "0px";
                adalFrame = document.getElementsByTagName('body')[0].appendChild(ifr) as HTMLIFrameElement;
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML('beforeEnd', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
            }
            if (window.frames && window.frames[iframeId as any]) {
                adalFrame = (window.frames[iframeId as any] as any) as HTMLIFrameElement;
            }
        }
        return adalFrame;
    }

    private _loadFrame(urlNavigate: string, frameName: string): void {
        var self = this;
        self.info("LoadFrame:" + frameName);
        var frameCheck = frameName;
        var setupFrame = () => {
            var frameHandle = self._addAdalFrame(frameCheck);
            if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                frameHandle.src = urlNavigate;
                self._loadFrame(urlNavigate, frameCheck);
            }
        }
        setTimeout(setupFrame, 500);
    }

    /**
    * @description Redirect the Browser to Azure AD Authorization endpoint
    * @param {string}   urlNavigate The authorization request url
    */
    private promptUser(urlNavigate: string): void {
        if (urlNavigate) {
            this.info("Navigate to:" + urlNavigate);
            window.location.replace(urlNavigate);
        } else {
            this.info("Navigate url is empty");
        }
    }

    private _getDomainHint(): string {
        if (this._user && this._user.userName && this._user.userName.indexOf('@') > -1) {
            var parts = this._user.userName.split('@');
            // local part can include @ in quotes. Sending last part handles that.
            return parts[parts.length - 1];
        }
        return '';
    }

    // var errorResponse = {error:'', errorDescription:''};
    // var token = 'string token';
    // callback(errorResponse, token)
    // with callback
    /**
    * Acquires access token with hidden iframe
    * @param {string}   resource  ResourceUri identifying the target resource
    * @param {IRequestCallback} callback The Request Callback
    */
    private _renewToken(resource: string, callback: adal.IRequestCallback): void {
        // use iframe to try refresh token
        // use given resource to create new authz url
        this._logstatus('renewToken is called for resource:' + resource);
        if (!this._hasResource(resource)) {
            var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || '';
            this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
        }

        var frameHandle = this._addAdalFrame('adalRenewFrame');
        var expectedState = this._guid() + '|' + resource;
        this._idTokenNonce = this._guid();
        this.config.state = expectedState;
        // renew happens in iframe, so it keeps javascript context
        this._renewStates.push(expectedState);

        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, '');

        this._logstatus('Renew token Expected state: ' + expectedState);
        var urlNavigate = this._getNavigateUrl('token', resource) + '&prompt=none&login_hint=' + encodeURIComponent(this._user.userName);
        urlNavigate += '&domain_hint=' + encodeURIComponent(this._getDomainHint());
        urlNavigate += '&nonce=' + encodeURIComponent(this._idTokenNonce);
        this.callback = callback;
        this.registerCallback(expectedState, resource, callback);
        this.idTokenNonce = null;
        this._logstatus('Navigate to:' + urlNavigate);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, '');
        frameHandle.src = 'about:blank';
        this._loadFrame(urlNavigate, 'adalRenewFrame');
    }

    private _renewIdToken(callback: adal.IRequestCallback):void {
        // use iframe to try refresh token
        this.info('renewIdToken is called');
        if (!this._hasResource(this.config.clientId)) {
            var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || '';
            this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + this.config.clientId + this.CONSTANTS.RESOURCE_DELIMETER);
        }

        var frameHandle = this._addAdalFrame('adalIdTokenFrame');
        var expectedState = this._guid() + '|' + this.config.clientId;
        this._idTokenNonce = this._guid();
        this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce);
        this.config.state = expectedState;
        // renew happens in iframe, so it keeps javascript context
        this._renewStates.push(expectedState);
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, expectedState);
        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, '');

        this.verbose('Renew Idtoken Expected state: ' + expectedState);
        var urlNavigate = this._getNavigateUrl('id_token', null) + '&prompt=none&login_hint=' + encodeURIComponent(this._user.userName);

        // don't add domain_hint twice if user provided it in the extraQueryParameter value
        if (!this._urlContainsQueryStringParameter("domain_hint", urlNavigate)) {
            urlNavigate += '&domain_hint=' + encodeURIComponent(this._getDomainHint());
        }

        urlNavigate += '&nonce=' + encodeURIComponent(this._idTokenNonce);
        this.registerCallback(expectedState, this.config.clientId, callback);
        this.idTokenNonce = null;
        this.verbose('Navigate to:' + urlNavigate);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, '');
        frameHandle.src = 'about:blank';
        this._loadFrame(urlNavigate, 'adalIdTokenFrame');
    }

    private _getNavigateUrl(responseType: string, resource: string):string {
        var tenant = "common";
        if (this.config.tenant) {
            tenant = this.config.tenant;
        }

        if (this.config.instance) {
            this.instance = this.config.instance;
        }

        var urlNavigate = this.instance + tenant + "/oauth2/authorize" + this._serialize(responseType, this.config, resource) + this._addClientId();
        this.info("Navigate url:" + urlNavigate);
        return urlNavigate;
    }

    private _deserialize(query: string): RequestParameters {
        return RequestParameters.deserialize(query);
    }

    private _serialize(responseType: string, obj: Config, resource: string): string {
        return RequestParameters.serialize(responseType, obj, resource);
    }

    private _cloneConfig(obj: any): Config {
        if (null === obj || "object" !== typeof obj) {
            return obj;
        }
        var copy = new Config();
        Object.keys(obj).forEach((attr: string) => {
            copy[attr] = obj[attr];
        });
        return copy;
    }

    private _extractIdToken(encodedIdToken: string): adal.IUserProfile {
        // id token will be decoded to get the username
        var decodedToken = Token.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
        try {
            var base64IdToken = decodedToken.JWSPayload;
            var base64Decoded = Token.base64DecodeStringUrlSafe(base64IdToken);
            if (!base64Decoded) {
                this.info("The returned id_token could not be base64 url safe decoded.");
                return null;
            }
        
            // ECMA script has JSON built-in support
            return JSON.parse(base64Decoded);
        } catch (err) {
            this.error("The returned id_token could not be decoded", err);
        }
        return null;
    }

    private _createUser(idToken: string): User {
        var user: User = null;
        var parsedJson = this._extractIdToken(idToken);
        if (parsedJson && parsedJson.hasOwnProperty("aud")) {

            if (parsedJson.aud.toLowerCase() === this.config.clientId.toLowerCase()) {

                user = {
                    userName: "",
                    profile: parsedJson
                };

                if (parsedJson.hasOwnProperty("upn")) {
                    user.userName = parsedJson.upn;
                } else if (parsedJson.hasOwnProperty("email")) {
                    user.userName = parsedJson.email;
                }
            } else {
                this.warn("IdToken has invalid aud field");
            }
        }
        return user;
    }

    private _decode(base64IdToken: string): string { return Token.decode(base64IdToken); }

    getUser(callback: adal.IRequestCallback): User {
        // IDToken is first call
        if (typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }

        this.callback = callback;
    
        // user in memory
        if (this._user) {
            this.callback(null, this._user);
            return;
        }
    
        // frame is used to get idtoken
        var idtoken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
        if (!this._isEmpty(idtoken)) {
            this.info('User exists in cache: ');
            this._user = this._createUser(idtoken);
            this.callback(null, this._user);
        } else {
            this.warn('User information is not available');
            this.callback('User information is not available');
        }
    }

    acquireToken(resource: string, callback: adal.IRequestCallback): void {
        if (this._isEmpty(resource)) {
            this.warn('resource is required');
            callback('resource is required', null);
            return;
        }

        var token = this.getCachedToken(resource);
        if (token) {
            this.info('Token is already in cache for resource:' + resource);
            callback(null, token);
            return;
        }

        if (this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW)) {
            this.info('renewToken is failed for resource ' + resource + ':' + this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW));
            callback(this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW), null);
            return;
        }

        if (!this._user) {
            this.warn('User login is required');
            callback('User login is required', null);
            return;
        }
            
        // refresh attept with iframe
        //Already renewing for this resource, callback when we get the token.
        if (this._activeRenewals[resource]) {
            //Active renewals contains the state for each renewal.
            this.registerCallback(this._activeRenewals[resource], resource, callback);
        }
        else {
            if (resource === this.config.clientId) {
                // App uses idtoken to send to api endpoints
                // Default resource is tracked as clientid to store this token
                this.verbose('renewing idtoken');
                this._renewIdToken(callback);
            } else {
                this._renewToken(resource, callback);
            }
        }
    }

    registerCallback(expectedState: string, resource: string, callback: adal.IRequestCallback): void {
        this._activeRenewals[resource] = expectedState;
        if (!(window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState]) {
            (window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState] = [];
        }
        (window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState].push(callback);
        if (!(window as adal.IOAuthWindow).callBackMappedToRenewStates[expectedState]) {
            (window as adal.IOAuthWindow).callBackMappedToRenewStates[expectedState] = (message: string, token: string) => {
                for (var i = 0; i < (window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState].length; ++i) {
                    (window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState][i](message, token);
                }
                this._activeRenewals[resource] = null;
                (window as adal.IOAuthWindow).callBacksMappedToRenewStates[expectedState] = null;
                (window as adal.IOAuthWindow).callBackMappedToRenewStates[expectedState] = null;
            };
        }
    }

    handleWindowCallback(): void {
        // This is for regular javascript usage for redirect handling
        // need to make sure this is for callback
        var hash = window.location.hash;
        if (this.isCallback(hash)) {
            var requestInfo = this.getRequestInfo(hash);
            this.info("Returned from redirect url");
            this.saveTokenFromHash(requestInfo);
            var callback: adal.IRequestCallback;
            if ((requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN ||
                requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) &&
                window.parent) {
                // iframe call but same single page
                this.verbose("Window is in iframe");
                callback = (window.parent as adal.IOAuthWindow).callBackMappedToRenewStates[requestInfo.stateResponse];
                ((window as any) as adal.IOAuthIFrame).src = "";
            } else if (window && (window as adal.IOAuthWindow).oauth2Callback) {
                this.verbose("Window is redirecting");
                callback = this.callback;
            }

            window.location.hash = "";
            window.location = this._getItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST);
            if (requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) {
                callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN] || requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                return;
            } else if (requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) {
                // JS context may not have the user if callback page was different, so parse idtoken again to callback
                callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION), this._createUser(this._getItem(this.CONSTANTS.STORAGE.IDTOKEN)));
                return;
            }
        }

    }

    getCachedUser(): User {
        if (this._user) {
            return this._user;
        }

        var idtoken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
        this._user = this._createUser(idtoken);
        return this._user;
    }

    getRequestInfo(hash: string): RequestInfo {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        var requestInfo: RequestInfo = {
            valid: false,
            parameters: new RequestParameters(),
            requestType: this.REQUEST_TYPE.UNKNOWN,
            stateMatch: false,
            stateResponse: ""
        };
        if (parameters) {
            requestInfo.parameters = parameters;
            if (parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
                parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
                parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)) {

                requestInfo.valid = true;
            
                // which call
                var stateResponse = "";
                if (parameters.hasOwnProperty("state")) {
                    this.verbose("State: " + parameters.state);
                    stateResponse = parameters.state;
                } else {
                    this.verbose("No state returned");
                }

                requestInfo.stateResponse = stateResponse;
            
                // async calls can fire iframe and login request at the same time if developer does not use the API as expected
                // incoming callback needs to be looked up to find the request type
                switch (stateResponse) {
                    case this._getItem(this.CONSTANTS.STORAGE.STATE_LOGIN):
                        requestInfo.requestType = this.REQUEST_TYPE.LOGIN;
                        requestInfo.stateMatch = true;
                        break;

                    case this._getItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN):
                        requestInfo.requestType = this.REQUEST_TYPE.ID_TOKEN;
                        this._saveItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN, "");
                        requestInfo.stateMatch = true;
                        break;
                }
            
                // external api requests may have many renewtoken requests for different resource
                if (!requestInfo.stateMatch && window.parent && (window.parent as adal.IOAuthWindow).AuthenticationContext) {
                    var statesInParentContext = ((window.parent as adal.IOAuthWindow).AuthenticationContext as AuthenticationContext)._renewStates;
                    for (var i = 0; i < statesInParentContext.length; i++) {
                        if (statesInParentContext[i] === requestInfo.stateResponse) {
                            requestInfo.requestType = this.REQUEST_TYPE.RENEW_TOKEN;
                            requestInfo.stateMatch = true;
                            break;
                        }
                    }
                }
            }
        }

        return requestInfo;
    }

    saveTokenFromHash(requestInfo: adal.IRequestInfo): void {
        this.info("State status:" + requestInfo.stateMatch + "; Request type:" + requestInfo.requestType);
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");
    
        // Record error
        if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION)) {
            this.info("Error :" + requestInfo.parameters.error + "; Error description:" + requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);
            this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);
            this._saveItem(this.CONSTANTS.STORAGE.ERROR, requestInfo.parameters.error);
            this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, requestInfo.parameters[this.CONSTANTS.ERROR_DESCRIPTION]);

            if (requestInfo.requestType === this.REQUEST_TYPE.LOGIN) {
                this._loginInProgress = false;
                this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, requestInfo.parameters.errorDescription);
            }
        } else {
        
            // It must verify the state from redirect
            if (requestInfo.stateMatch) {
                // record tokens to storage if exists
                this.info("State is right");
                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.SESSION_STATE)) {
                    this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE, requestInfo.parameters[this.CONSTANTS.SESSION_STATE]);
                }

                var keys: any, resource: string;

                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)) {
                    this.info("Fragment has access token");
                    // default resource
                    resource = this.config.loginResource;
                    if (!this._hasResource(resource)) {
                        keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || "";
                        this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
                    }

                    if (requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) {
                        resource = this._getResourceFromState(requestInfo.stateResponse);
                    }
                
                    // save token with related resource
                    this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN]);
                    this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, this._expiresIn(requestInfo.parameters[this.CONSTANTS.EXPIRES_IN]));
                }

                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)) {
                    this._loginInProgress = false;
                    this._user = this._createUser(requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                    if (this._user && this._user.profile) {
                        if (this._user.profile.nonce !== this._getItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN)) {
                            this._user = null;
                            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "Nonce is not same as " + this._idTokenNonce);
                        } else {
                            this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN, requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                        
                            // Save idtoken as access token for app itself
                            resource = this.config.loginResource ? this.config.loginResource : this.config.clientId;
                            if (!this._hasResource(resource)) {
                                keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || "";
                                this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
                            }
                            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, this._user.profile.exp);
                        }
                    }
                }
            } else {
                this._saveItem(this.CONSTANTS.STORAGE.ERROR, "Invalid_state");
                this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "Invalid_state");
                if (requestInfo.requestType === this.REQUEST_TYPE.LOGIN) {
                    this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "State is not same as " + requestInfo.stateResponse);
                }
            }
        }
    }

    login(): void {

        // Token is not present and user needs to login
        var expectedState = this._guid();
        this.config.state = expectedState;
        this._idTokenNonce = this._guid();
        this.verbose("Expected state: " + expectedState + " startPage:" + window.location);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, window.location);
        this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, expectedState);
        this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce);
        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");


        var urlNavigate = this._getNavigateUrl("id_token", null) + "&nonce=" + encodeURIComponent(this._idTokenNonce);
        this.frameCallInProgress = false;
        this._loginInProgress = true;
        if (this.config.displayCall) {
            // User defined way of handling the navigation
            this.config.displayCall(urlNavigate);
        } else {
            this.promptUser(urlNavigate);
        }
        // callback from redirected page will receive fragment. It needs to call oauth2Callback
    }

    logOut(): void {
        this.clearCache();
        var tenant = "common";
        var logout = "";
        this._user = null;
        if (this.config.tenant) {
            tenant = this.config.tenant;
        }

        if (this.config.instance) {
            this.instance = this.config.instance;
        }

        if (this.config.postLogoutRedirectUri) {
            logout = "post_logout_redirect_uri=" + encodeURIComponent(this.config.postLogoutRedirectUri);
        }

        var urlNavigate = this.instance + tenant + "/oauth2/logout?" + logout;
        this.info("Logout navigate to: " + urlNavigate);
        this.promptUser(urlNavigate);
    }

    constructor(cfg: adal.IConfig) {

        if (!this.singletonInstance) {
            this.singletonInstance=this;
            if (cfg) {
                if (!cfg.clientId) {
                    throw new Error('clientId is required');
                }
                this.config =this._cloneConfig(cfg);
                if (!this.config.loginResource) {
                    this.config.loginResource = this.config.clientId;
                }
                if (!this.config.redirectUri) {
                    this.config.redirectUri = window.location.href;
                }
                if (!this.config.correlationId) {
                    this.config.correlationId = Guid.newGuid();
                }
                this.config.resource = this.config.loginResource || "";
                this._activeRenewals = new RenewalList();
                (window as adal.IOAuthWindow).callBackMappedToRenewStates = new CallbackMap<adal.IRequestCallback>();
                (window as adal.IOAuthWindow).callBacksMappedToRenewStates = new CallbackMap<Array<adal.IRequestCallback>>();
                (window as adal.IOAuthWindow).AuthenticationContext = this;
            }
        }
    }

    [key: string]: any;

}
console.log("adal-ts:loading complete! - " + $Adal);