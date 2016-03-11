"use strict";

/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */

/* tslint:disable:* */
var module: any;
if (typeof module !== "undefined" && module.exports) {
    console.log("adal:Module inject required");
    module.exports.inject = (config: adal.IConfig) => {
        return new adalts.AuthenticationContext(config);
    };
}
/* tslint:enable:* */

//fold back into adal
import adal = adalts;

//expose as ambient
declare module "adal" {
    export=adal;
}

/**
 * @description Shared ADAL Interfaces
 */
declare module adalts {

    /**
     * @description Base Contract for OAuth Url encoded request parameters
     */
    interface IRequestParameters {
        /**
         * @desc    {string}    The current error
         */
        error: string;
        /**
         * @desc    {string}    The current error description
         */
        errorDescription: string;
        /**
         * @desc    {string}    The current id token
         */
        id_token: string;
        /**
         * @desc    {string}    The current access token
         */
        access_token: string;
        /**
         * @desc    {string}    The current nonce state
         */
        state: string;

        [key: string]: any;
    }

    /**
     * @description Interface for representing Token Requests
     */
    interface IRequestInfo {
        /**
         * @desc    {boolean}   Is the request valid?
         */
        valid: boolean;
        /**
         * @desc    {IRequestParameters}    URL Parameters for the request
         */
        parameters: IRequestParameters;
        /**
         * @desc    {boolean}   The nonce state match
         */
        stateMatch: boolean;
        /**
         * @desc    {string}    The nonce state response
         */
        stateResponse: string;
        /**
         * @desc    {string}    The token request type
         */
        requestType: string;
    }

    /**
     * @description Interface for Navigations
     * @param   {string}    The url to be forwarded
     */
    export interface IDisplayCall {
        (urlNavigate: string): void;
    }

    /**
     * @description Interface to synthesize message dictionary
     */
    export interface IStringMap {
        [level: number]: string;
    }

    /**
     * @description Base contract representing a dictionary of
     *  resource URI and Callbacks
     */
    interface ICallbackMap<T> {
        [expectedState: string]: T;
    }

    /**
     * @description Interface for JWT User Claims
     */
    interface IUserProfile {
        /**
         * @desc    The user principal name
         */
        upn: string;
        /**
         * @desc    The claim audience
         */
        aud: string;
        /**
         * @desc    The user email address
         */
        email: string;
        nbf: number;
        /**
         * @desc    The claim expiration
         */
        exp: number;
        iat: number;
        /**
         * @desc    The claim issuer
         */
        iss: number;
        prn: string;
        /**
         * @desc    The claim type
         */
        typ: string;
        nonce: string;
    }

    /**
     * @description Base contract for an OAuth authenticated user
     */
    interface IUser {
        /**
         * @description {string} The user name
         */
        userName: string;
        /**
         * @description {IUserProfile} The user profile
         */
        profile?: IUserProfile;
    }

    /**
     * @description Base contract for Request Callback
     * @param {string} message
     * @param {any} item
     */
    interface IRequestCallback {
        (message: string, item?: any): void;
    }

    /**
     * @description Interface for JWT
     */
    interface IToken {
        /**
         * @desc    {string} JWT Header
         */
        header: string;
        /**
         * @desc    {string} JWT Signed Payload
         */
        JWSPayload: string;
        /**
         * @desc    {string} JWT Signature
         */
        JWSSig: string;
    }

    /**
     * @description Dictionary to hold Token renewals
     */
    interface IRenewalList {
        [resource: string]: any;
    }

    /**
     * @description Delegate method for Logger Log method
     */
    export interface ILogFunction {
        (message: string): void;
    }

    /**
     * @description  Interface for Resource Uri to Endpoint Mapping
     */
    export interface IEndpointCollection {
        [key: string]: string;
    }

    /**
     * @desc Base contract for Configuration Options
     */
    interface IConfig {
        displayCall?:IDisplayCall;
        /**
         * @desc The logon authority
         */
        instance: string;
        /**
         * @desc The tenant to authorize (optional) as default to 'common'
         */
        tenant?: string;
        /**
         * @desc The application id
         */
        clientId: string;
        /**
         * @desc The target redirect URI
         */
        redirectUri?: string;
        /**
         * @desc The resource to endpoint mapping
         */
        endpoints?: IEndpointCollection;
        /**
         * @desc A correlation id for requests
         */
        correlationId?: string;
        /**
         * @desc The location for the token cache
         */
        cacheLocation?: string;
        /**
         * @desc The target resource
         */
        resource?: string;
        loginResource?: string;
        /**
         * @desc The id nonce state
         */
        state?: string;
        /**
         * @desc The length of token validity
         */
        expireOffsetSeconds?: number;
        /**
         * @desc Extra parameters to add to the request
         */
        extraQueryParameter?: string;
        localLoginUrl?: string;
        postLogoutRedirectUri?: string;
        slice?: string;
    }

    /**
     * @desc Base contract for representing OAuth user data
     */
    interface IOAuthData {
        /**
         * @desc Whether the user is currently authenticated
         */
        isAuthenticated: boolean;
        /**
         * @desc The current user name
         */
        userName: string;
        /**
         * @desc Any current login error message
         */
        loginError: string;
        /**
         * @desc The OAuth user claim set
         */
        profile: IUserProfile;
    }

    interface IOAuthHTMLElement {
        callBackMappedToRenewStates: ICallbackMap<IRequestCallback>;
        callBacksMappedToRenewStates: ICallbackMap<Array<IRequestCallback>>;
        oauth2Callback: any;
        AuthenticationContext: IAuthenticationContext;
    }

    interface IOAuthWindow extends Window, IOAuthHTMLElement {

    }

    interface IOAuthIFrame extends HTMLIFrameElement, IOAuthHTMLElement {
        parent: IOAuthWindow;
    }

    /**
     * @desc Interface for OAuth request type constants
     */
    interface IRequestTypes {
        LOGIN: string;
        RENEW_TOKEN: string;
        ID_TOKEN: string;
        UNKNOWN: string;

        [key:string]:string;
    }

    /**
     * @description Contract for an Authentication Context
     */
    interface IAuthenticationContext {

        /**
         * @desc    {RequestTypes}  Enumeration of Request Types
         */
        REQUEST_TYPE: IRequestTypes;
        /**
         * @desc    {any}  Property Bag of constants
         */
        CONSTANTS: any;
        /**
         * @desc    {string}  The authentication authority
         */
        instance: string;
        /**
         * @desc    {IConfig} The configuration options
         */
        config: IConfig;
        /**
         * @desc    {boolean}  Whether popup token requests
         */
        popUp: boolean;
        /**
         * @desc    IRequestCallback    Whether an IFrame token request is in progress
         */
        frameCallInProgress: boolean;
        /**
         * @desc    IRequestCallback    The token request callback
         */
        callback: IRequestCallback;
        /**
         * @desc    {string} The current user token nonce value
         */
        idTokenNonce: string;
        /**
         * @desc    {string}  Whether token renewal is in progress
         */
        renewActive: boolean;
        /**
         * @desc    {IAuthenticationContext}    Context singleton instance
         */
        singletonInstance:IAuthenticationContext;

        decode(base64idToken:string):string;
        newGuid():string;
        getHostFromUri(uri: string): string;
        login(): void;
        loginInProgress(): boolean;
        logOut(): void;
        acquireToken(resource: string, callback: IRequestCallback): void;
        clearCache(): void;
        clearCacheForResource(resource: string): void;
        getCachedUser(): IUser;
        getUser(callback: IRequestCallback): IUser;
        getLoginError(): string;
        getRequestInfo(hash: string): IRequestInfo;
        getResourceForEndpoint(endpoint: string): string;
        handleWindowCallback(): void;
        saveTokenFromHash(requestInfo: IRequestInfo): void;
        log(level: number, message: string, error: any): void;
        error(message: string, error: any): void;
        warn(message: string): void;
        info(message: string): void;
        verbose(message: string): void;
        isCallback(hash: string): boolean;
        registerCallback(expectedState: string, resource: string, callback: IRequestCallback): void;
        getCachedToken(resource: string): string;
        getItem(key: string): any;
        saveItem(key: string, obj: any): boolean;
    }

    /**
     * @description Generic Interface for casting the context constructor
     * @param   TConfig     The type of the configuration constructor parameter
     * @param   TContext    The type of the object
     */
    interface IConstructable<TConfig,TContext>{
        /**
         *
         * @param config {TConfig}  The context configuration options
         */
        new(config:TConfig):TContext;
    }

    /**
     * @description Generic Interface for casting the context constructor
     * @param T the type constraint to Authentication Contexts
     */
    interface IContextConstructor<T extends IAuthenticationContext> extends IConstructable<IConfig,T> {

    }
}

/**
 * @desc Concrete Adal Interfaces
 */
module adalts {

    export function inject(config: IConfig): IAuthenticationContext {
        return new AuthenticationContext(config);
    }

    /**
     * @description Concrete implementation of OAuth Request Parameters
     */
    export class RequestParameters implements IRequestParameters {
        /**
         * @desc    {string}    The current error
         */
        public error: string;
        /**
         * @desc    {string}    The current error description
         */
        public errorDescription: string;
        /**
         * @desc    {string}    The current id token
         */
        public id_token: string;
        /**
         * @desc    {string}    The current access token
         */
        public access_token: string;
        /**
         * @desc    {string}    The current nonce state
         */
        public state: string;

        /**
         * @desc    Deserializes OAuth request parameters from a URL string
         * @param   query {string} The URL query string to deserialize
         * @returns {RequestParameters}
         */
        public static deserialize(query: string): adal.IRequestParameters {
            let match: RegExpMatchArray,
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

        /**
         * @desc    Serializes OAuth request parameters to a URL string
         * @param   responseType {string} The desired OAuth response type
         * @param   obj   {adal.IConfig}  The context configuration
         * @param   resource  {string}    The desired resource
         * @returns {string}
         */
        public static serialize(responseType: string, obj: adal.IConfig, resource: string): string {
            var str: Array<string> = [];
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
    * @description Concrete implementation of JWT
    * @see IToken
    */
    export class Token implements IToken {

        /**
         * @desc    {string} JWT Header
         */
        public header: string;
        /**
         * @desc    {string} JWT Signed Payload
         */
        public JWSPayload: string;
        /**
         * @desc    {string} JWT Signature
         */
        public JWSSig: string;

        /**
         * @desc    Converts a regex match set to a JWT
         * @param matches   The regex match set to evaluate
         * @returns {Token}
         */
        public static toJwt(matches: RegExpMatchArray): Token {
            return new Token(matches[1], matches[2], matches[3]);
        }

        /**
         * @desc    Decodes a JWT from a string
         * @param jwtToken  {string}    The encoded token
         * @returns {adal.IToken} The decoded token
         */
        public static decodeJwt(jwtToken: string): IToken {
            if (jwtToken === null) {
                return null;
            }

            let idTokenPartsRegex: RegExp = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;

            let matches: RegExpMatchArray = idTokenPartsRegex.exec(jwtToken);
            if (!matches || matches.length < 4) {
                return null;
            }

            return Token.toJwt(matches);
        }

        /**
         * @desc    Decodes a Base64 encoded JWT
         * @param base64IdToken {string} The encoded token string
         * @returns {string}
         */
        public static decode(base64IdToken: string): string {
            let codes: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            base64IdToken = String(base64IdToken).replace(/=+$/, "");

            let length: number = base64IdToken.length;
            if (length % 4 === 1) {
                throw new Error("The token to be decoded is not correctly encoded.");
            }

            var h1: number, h2: number, h3: number, h4: number, bits: number, c1: number, c2: number, c3: number, decoded: string = "";
            for (let i: number = 0; i < length; i += 4) {
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
                    bits = h1 << 18 | h2 << 12;
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

        /**
         * @desc    Url decodes a base64 encoded string
         * @param base64IdToken {string} the base64 encoded token
         * @returns {string}
         */
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

        constructor(...args: any[])
        constructor(header: string, payload: string, signature: string) {
            this.header = header;
            this.JWSPayload = payload;
            this.JWSSig = signature;
        }
    }

    /**
    * @description Helper class for guids
    */
    export class Guid {

        /**
         * @description returns a new GUID
         */
        public static newGuid(): string {
            const guidHolder: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            const hex: string = "0123456789abcdef";
            var r: number = 0;
            let guidResponse: string = "";
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
        /**
         * @desc returns the current time as seconds
         */
        public static now(): number {
            return Math.round(new Date().getTime() / 1000.0);
        };
    }

    /**
    * @description Class containing Browser Helper Methods
    */
    export class BrowserHelpers {

        /**
         * @desc Whether the current browser supports local storage
         * @returns {boolean}
         */
        public static supportsLocalStorage(): boolean {
            try {
                return Boolean("localStorage" in window && window.localStorage);
            } catch (e) {
                return false;
            }
        };

        /**
         * @desc Whether the current browser supports session storage
         * @returns {boolean}
         */
        public static supportsSessionStorage(): boolean {
            try {
                return Boolean("sessionStorage" in window && window.sessionStorage);
            } catch (e) {
                return false;
            }
        }
    }

    /**
     * @description Enumeration for Log Severity Levels
     */
    export enum LoggingLevels {
        ERROR = 0,
        WARN = 1,
        INFO = 2,
        VERBOSE = 3
    }

    /**
     * @description General Constants
     */
    export class Constants {

        public static LIBRARY_VERSION: string = "1.0.8";

        public ACCESS_TOKEN: string = "access_token";
        public EXPIRES_IN: string = "expires_in";
        public ID_TOKEN: string = "id_token";
        public ERROR_DESCRIPTION: string = "error_description";
        public SESSION_STATE: string = "session_state";
        public STORAGE = {
            TOKEN_KEYS: "adal.token.keys",
            ACCESS_TOKEN_KEY: "adal.access.token.key",
            EXPIRATION_KEY: "adal.expiration.key",
            START_PAGE: "adal.start.page",
            START_PAGE_PARAMS: "adal.start.page.params",
            FAILED_RENEW: "adal.failed.renew",
            STATE_LOGIN: "adal.state.login",
            STATE_RENEW: "adal.state.renew",
            STATE_RENEW_RESOURCE: "adal.state.renew.resource",
            STATE_IDTOKEN: "adal.state.idtoken",
            NONCE_IDTOKEN: "adal.nonce.idtoken",
            SESSION_STATE: "adal.session.state",
            USERNAME: "adal.username",
            IDTOKEN: "adal.idtoken",
            ERROR: "adal.error",
            ERROR_DESCRIPTION: "adal.error.description",
            LOGIN_REQUEST: "adal.login.request",
            LOGIN_ERROR: "adal.login.error"
        };
        public RESOURCE_DELIMETER: string = "|";
        public LOGGING_LEVEL = LoggingLevels;
        public LEVEL_STRING_MAP: IStringMap = {
            0: "ERROR:",
            1: "WARNING:",
            2: "INFO:",
            3: "VERBOSE:"
        };
    }

    /**
     * @description Generic logging class
     */
    export class Logging {
        /**
         * @desc    The Logging Level
         */
        public static level: LoggingLevels = 0;

        /**
         * @desc Logs the specified message
         */
        public static log: ILogFunction = (m: string) => { console.log(m); };
    }

    /**
     * @description Concrete implementation of Azure Active Directory Authentication Context
     */
    export class AuthenticationContext implements IAuthenticationContext {

        private _user: IUser;
        private _loginInProgress: boolean = false;
        private _idTokenNonce: string;
        private _renewStates: Array<string> = [];
        private _activeRenewals: IRenewalList;

        public instance: string = "https://login.microsoftonline.com/";
        public config: IConfig;
        public popUp: boolean = false;
        public frameCallInProgress: boolean;
        public callback: IRequestCallback;
        public idTokenNonce: string;
        public renewActive = false;
        public singletonInstance: AuthenticationContext;
        public REQUEST_TYPE: IRequestTypes = {
            LOGIN: "LOGIN",
            RENEW_TOKEN: "RENEW_TOKEN",
            ID_TOKEN: "ID_TOKEN",
            UNKNOWN: "UNKNOWN"
        };
        public CONSTANTS = new Constants();


        public acquireToken(resource: string, callback: IRequestCallback): void {
            if (this.isEmpty(resource)) {
                this.warn("resource is required");
                callback("resource is required", null);
                return;
            }

            let token: string = this.getCachedToken(resource);
            if (token) {
                this.info("Token is already in cache for resource:" + resource);
                callback(null, token);
                return;
            }

            if (this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW)) {
                this.info("renewToken is failed for resource " + resource + ":" + this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW));
                callback(this._getItem(this.CONSTANTS.STORAGE.FAILED_RENEW), null);
                return;
            }

            if (!this._user) {
                this.warn("User login is required");
                callback("User login is required", null);
                return;
            }

            // refresh attept with iframe
            //Already renewing for this resource, callback when we get the token.
            if (this._activeRenewals[resource]) {
                //Active renewals contains the state for each renewal.
                this.registerCallback(this._activeRenewals[resource], resource, callback);
            } else {
                if (resource === this.config.clientId) {
                    // App uses idtoken to send to api endpoints
                    // Default resource is tracked as clientid to store this token
                    this.verbose("renewing idtoken");
                    this.renewIdToken(callback);
                } else {
                    this.renewToken(resource, callback);
                }
            }
        }

        public Library_Version: string = this._libVersion();

        public getResourceForEndpoint(endpoint: string): string {
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
            if (endpoint.indexOf("http://") > -1 || endpoint.indexOf("https://") > -1) {
                if (this.getHostFromUri(endpoint) === this.getHostFromUri(this.config.redirectUri)) {
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

        public loginInProgress(): boolean { return this._loginInProgress; }

        public clearCache(): void {
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

            if (!this.isEmpty(keys)) {
                keys = keys.split(this.CONSTANTS.RESOURCE_DELIMETER);
                for (var i = 0; i < keys.length; i++) {
                    this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + keys[i], "");
                    this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + keys[i], 0);
                }
            }
            this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, "");
        }

        public clearCacheForResource(resource: string): void {
            this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
            this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, "");
            this._saveItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN, "");
            this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
            this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");
            if (this.hasResource(resource)) {
                this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, "");
                this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
            }
        }

        public getLoginError(): string {
            return this._getItem(this.CONSTANTS.STORAGE.LOGIN_ERROR);
        }

        public log(level: number, message: string, error: any): void {
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

        public error(message: string, error: any): void {
            this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR, message, error);
        };

        public warn(message: string): void {
            this.log(this.CONSTANTS.LOGGING_LEVEL.WARN, message, null);
        };

        public info(message: string): void {
            this.log(this.CONSTANTS.LOGGING_LEVEL.INFO, message, null);
        };

        public verbose(message: string): void {
            this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE, message, null);
        };

        public isCallback(hash: string): boolean {
            hash = this.getHash(hash);
            var parameters = RequestParameters.deserialize(hash);
            return (
                parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
                    parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
                    parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)
            );
        }

        public getCachedToken(resource: string): string {
            if (!this.hasResource(resource)) {
                return null;
            }

            var token = this._getItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource) as string;
            var expired = this._getItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource) as number;

            // If expiration is within offset, it will force renew
            var offset = this.config.expireOffsetSeconds || 120;

            if (expired && (expired > DateTime.now() + offset)) {
                return token;
            } else {
                this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, "");
                this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
                return null;
            }
        }

        public getHostFromUri(uri: string): string {
            // remove http:// or https:// from uri
            var extractedUri = String(uri).replace(/^(https?:)\/\//, "");

            extractedUri = extractedUri.split("/")[0];
            return extractedUri;
        }

        public decode(base64idToken: string): string {
            return Token.decode(base64idToken);
        }

        public newGuid(): string {
            return Guid.newGuid();
        }

        /**
         * @desc Retrieves an item from the cache
         * @param key   {string} the storage item key
         */
        public getItem(key: string): any {
            return this._getItem(key);
        }

        /**
         * @desc Saves an item to the cache
         * @param key   {string} the storage item key
         * @param obj   {any} the item to be stored
         */
        public saveItem(key: string, obj: any): boolean {
            return this._saveItem(key, obj);
        }

        public getUser(callback: IRequestCallback): IUser {
            // idToken is first call
            if (typeof callback !== "function") {
                throw new Error("callback is not a function");
            }

            this.callback = callback;

            // user in memory
            if (this._user) {
                this.callback(null, this._user);
                return;
            }

            // frame is used to get idtoken
            let idtoken: string = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
            if (!this.isEmpty(idtoken)) {
                this.info("User exists in cache: ");
                this._user = this.createUser(idtoken);
                this.callback(null, this._user);
            } else {
                this.warn("User information is not available");
                this.callback("User information is not available");
            }
        }

        public getCachedUser(): IUser {

            if (this._user) {
                return this._user;
            }

            let idtoken: string = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
            this._user = this.createUser(idtoken);
            return this._user;
        }

        public getRequestInfo(hash: string): IRequestInfo {

            hash = this.getHash(hash);
            let parameters: IRequestParameters = RequestParameters.deserialize(hash);
            let requestInfo: IRequestInfo = {
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
                    let stateResponse: string = "";
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
                        default:
                            break;
                    }

                    // external api requests may have many renewtoken requests for different resource
                    if (!requestInfo.stateMatch && window.parent && (window.parent as IOAuthWindow).AuthenticationContext) {
                        let aContext: AuthenticationContext = ((window.parent as IOAuthWindow).AuthenticationContext as AuthenticationContext);
                        var statesInParentContext = aContext._renewStates;
                        for (let i: number = 0; i < statesInParentContext.length; i++) {
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

        public registerCallback(expectedState: string, resource: string, callback: IRequestCallback): void {
            this._activeRenewals[resource] = expectedState;
            let oAuthWindow = window as IOAuthWindow;
            if (!oAuthWindow.callBacksMappedToRenewStates[expectedState]) {
                oAuthWindow.callBacksMappedToRenewStates[expectedState] = [];
            }
            oAuthWindow.callBacksMappedToRenewStates[expectedState].push(callback);
            if (!oAuthWindow.callBackMappedToRenewStates[expectedState]) {
                oAuthWindow.callBackMappedToRenewStates[expectedState] = (message: string, token: string) => {
                    for (let i: number = 0; i < oAuthWindow.callBacksMappedToRenewStates[expectedState].length; ++i) {
                        oAuthWindow.callBacksMappedToRenewStates[expectedState][i](message, token);
                    }
                    this._activeRenewals[resource] = null;
                    oAuthWindow.callBacksMappedToRenewStates[expectedState] = null;
                    oAuthWindow.callBackMappedToRenewStates[expectedState] = null;
                };
            }
        }

        public handleWindowCallback(): void {
            // This is for regular javascript usage for redirect handling
            // need to make sure this is for callback
            let hash:string = window.location.hash;
            if (this.isCallback(hash)) {
                let requestInfo: IRequestInfo = this.getRequestInfo(hash);
                this.info("Returned from redirect url");
                this.saveTokenFromHash(requestInfo);
                let callback: IRequestCallback;
                if ((requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN ||
                        requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) &&
                    window.parent) {
                    // iframe call but same single page
                    this.verbose("Window is in iframe");
                    callback = (window.parent as IOAuthWindow).callBackMappedToRenewStates[requestInfo.stateResponse];
                    ((window as any) as IOAuthIFrame).src = "";
                } else if (window && (window as IOAuthWindow).oauth2Callback) {
                    this.verbose("Window is redirecting");
                    callback = this.callback;
                }

                window.location.hash = "";
                window.location = this._getItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST);
                if (callback) {
                    if (requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) {
                        callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION),
                            requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN] || requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                        return;
                    } else if (requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) {
                        // JS context may not have the user if callback page was different, so parse idtoken again to callback
                        callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION),
                            this.createUser(this._getItem(this.CONSTANTS.STORAGE.IDTOKEN)));
                        return;
                    }
                }
            }

        }

        public saveTokenFromHash(requestInfo: IRequestInfo): void {
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

                    let keys: any, resource: string;

                    if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN)) {
                        this.info("Fragment has access token");
                        // default resource
                        resource = this.config.loginResource;
                        if (!this.hasResource(resource)) {
                            keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || "";
                            this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
                        }

                        if (requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) {
                            resource = this.getResourceFromState(requestInfo.stateResponse);
                        }

                        // save token with related resource
                        this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN]);
                        this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, this.expiresIn(requestInfo.parameters[this.CONSTANTS.EXPIRES_IN]));
                    }

                    if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN)) {
                        this._loginInProgress = false;
                        this._user = this.createUser(requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                        if (this._user && this._user.profile) {
                            if (this._user.profile.nonce !== this._getItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN)) {
                                this._user = null;
                                this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "Nonce is not same as " + this._idTokenNonce);
                            } else {
                                this._saveItem(this.CONSTANTS.STORAGE.IDTOKEN, requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);

                                // Save idtoken as access token for app itself
                                resource = this.config.loginResource ? this.config.loginResource : this.config.clientId;
                                if (!this.hasResource(resource)) {
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

        public login(): void {

            // Token is not present and user needs to login
            let expectedState: string = Guid.newGuid();
            this.config.state = expectedState;
            this._idTokenNonce = Guid.newGuid();
            this.verbose("Expected state: " + expectedState + " startPage:" + window.location);
            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, window.location);
            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "");
            this._saveItem(this.CONSTANTS.STORAGE.STATE_LOGIN, expectedState);
            this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce);
            this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
            this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
            this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");


            let urlNavigate: string = this.getNavigateUrl("id_token", null) + "&nonce=" + encodeURIComponent(this._idTokenNonce);
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

        public logOut(): void {
            this.clearCache();
            let tenant: string = "common";
            let logout: string = "";
            this._user = undefined;
            if (this.config.tenant) {
                tenant = this.config.tenant;
            }

            if (this.config.instance) {
                this.instance = this.config.instance;
            }

            if (this.config.postLogoutRedirectUri) {
                logout = "post_logout_redirect_uri=" + encodeURIComponent(this.config.postLogoutRedirectUri);
            }

            let urlNavigate: string = this.instance + tenant + "/oauth2/logout?" + logout;
            this.info("Logout navigate to: " + urlNavigate);
            this.promptUser(urlNavigate);
        }

        private _libVersion(): string { return Constants.LIBRARY_VERSION; }

        private logstatus(msg: string) {
            if (console) {
                console.log(msg);
            }
        }

        private getHash(hash: string): string {
            if (hash.indexOf("#/") > -1) {
                hash = hash.substring(hash.indexOf("#/") + 2);
            } else if (hash.indexOf("#") > -1) {
                hash = hash.substring(1);
            }
            return hash;
        }

        private expiresIn(expires: string): number {
            return DateTime.now() + parseInt(expires, 10);
        }

        private addClientId(): string {
            // x-client-SKU
            // x-client-Ver
            return "&x-client-SKU=Js&x-client-Ver=" + this._libVersion();
        };

        private supportsLocalStorage(): boolean {
            return BrowserHelpers.supportsLocalStorage();
        }

        private urlContainsQueryStringParameter(name: string, url: string): boolean {
            // regex to detect pattern of a ? or & followed by the name parameter and an equals character
            let regex: RegExp = new RegExp("[\\?&]" + name + "=");
            return regex.test(url);
        }

        private supportsSessionStorage(): boolean {
            return BrowserHelpers.supportsSessionStorage();
        }

        private _getItem(key: string): any {

            if (this.config && this.config.cacheLocation && this.config.cacheLocation === "localStorage") {

                if (!this.supportsLocalStorage()) {
                    this.info("Local storage is not supported");
                    return null;
                }

                return localStorage.getItem(key);
            }

            // Default as session storage
            if (!this.supportsSessionStorage()) {
                this.info("Session storage is not supported");
                return null;
            }

            return sessionStorage.getItem(key);
        }

        private _saveItem(key: string, obj: any): boolean {

            if (this.config && this.config.cacheLocation && this.config.cacheLocation === "localStorage") {

                if (!this.supportsLocalStorage()) {
                    this.info("adal:[saveItem]Local storage is not supported");
                    return false;
                }

                localStorage.setItem(key, obj);
                this.info("adal:[saveItem]Local storage is supported");
                return true;
            }

            // Default as session storage
            if (!this.supportsSessionStorage()) {
                this.info("adal:[saveItem]Session storage is not supported");
                return false;
            }
            this.info("adal:[saveItem]Session storage is supported");
            sessionStorage.setItem(key, obj);
            return true;
        };

        private getResourceFromState(state: string): string {
            if (state) {
                var splitIndex = state.indexOf("|");
                if (splitIndex > -1 && splitIndex + 1 < state.length) {
                    return state.substring(splitIndex + 1);
                }
            }
            return "";
        }

        private isEmpty(str: string): boolean {
            return (typeof str === "undefined" || !str || 0 === str.length);
        }

        private hasResource(key: string): boolean {
            let keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) as string;
            return keys && !this.isEmpty(keys) && (keys.indexOf(key + this.CONSTANTS.RESOURCE_DELIMETER) > -1);
        }

        /**
         * @desc Creates or repurposes an iframe for authentication
         * @param iframeId {string} the iframe id
         */
        private addAdalFrame(iframeId: string): HTMLIFrameElement {
            if (typeof iframeId === "undefined") {
                this.logstatus("adal:[addAdalFrame]iframeId " + iframeId + "is undefined!");
                return null;
            }

            this.logstatus("adal:[addAdalFrame]Add AdalTS frame to document:" + iframeId);
            let adalFrame = document.getElementById(iframeId) as HTMLIFrameElement;
            if (!adalFrame) {
                this.logstatus("adal:[addAdalFrame]Setting up the iFrame id:" + iframeId);
                if (document.createElement && document.documentElement && window.navigator.userAgent.indexOf("MSIE 5.0") === -1) {
                    this.logstatus("adal:[addAdalFrame]Creating new iFrame id:" + iframeId);
                    var ifr = document.createElement("iframe");
                    ifr.setAttribute("id", iframeId);
                    ifr.style.visibility = "hidden";
                    ifr.style.position = "absolute";
                    ifr.style.width = ifr.style.height = ifr.frameBorder = "0px";
                    adalFrame = document.getElementsByTagName("body")[0].appendChild(ifr) as HTMLIFrameElement;
                } else if (document.body && document.body.insertAdjacentHTML) {
                    this.info("adal:[addAdalFrame]Inserting existing into existing iframe element" + iframeId);
                    document.body.insertAdjacentHTML("beforeEnd", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
                }
                if (window.frames && window.frames[iframeId as any]) {
                    this.info("adal:[addAdalFrame]Finalizing iframe id:" + iframeId);
                    adalFrame = (window.frames[iframeId as any] as any) as HTMLIFrameElement;
                }
            }
            return adalFrame;
        }

        /**
         * @description Loads an iframe for authentication navigation
         * @param urlNavigate {string}  The url to navigate to
         * @param frameName {string} the id of the iframe
         */
        private loadFrame(urlNavigate: string, frameName: string): void {
            var self = this;
            self.info("adal:[LoadFrame]" + frameName);
            var frameCheck = frameName;
            var setupFrame = () => {
                self.info("adal:[LoadFrame]Adding iframe:" + frameCheck);
                var frameHandle = self.addAdalFrame(frameCheck);
                if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                    frameHandle.src = urlNavigate;
                    self.loadFrame(urlNavigate, frameCheck);
                }
            };
            self.info("adal:[LoadFrame]Initializing Frame" + frameName);
            setTimeout(setupFrame, 500);
        }

        /**
         * @description Redirect the Browser to Azure AD Authorization endpoint
         * @param {string}   urlNavigate The authorization request url
         */
        private promptUser(urlNavigate: string): void {
            if (urlNavigate) {
                this.info("adal:[promptUser]Navigate to:" + urlNavigate);
                window.location.replace(urlNavigate);
            } else {
                this.info("adal:[promptUser]Navigate url is empty");
            }
        }

        /**
         * @desc Retrieves a domain hint for the OAuth request Url
         * @returns {string}
         */
        private getDomainHint(): string {
            if (this._user && this._user.userName && this._user.userName.indexOf("@") > -1) {
                var parts = this._user.userName.split("@");
                // local part can include @ in quotes. Sending last part handles that.
                return parts[parts.length - 1];
            }
            return "";
        }

        // var errorResponse = {error:'', errorDescription:''};
        // var token = 'string token';
        // callback(errorResponse, token)
        // with callback
        /**
         * @desc Acquires access token with hidden iframe
         * @param {string}   resource  ResourceUri identifying the target resource
         * @param {IRequestCallback} callback The Request Callback
         */
        private renewToken(resource: string, callback: IRequestCallback): void {
            // use iframe to try refresh token
            // use given resource to create new authz url
            this.logstatus("renewToken is called for resource:" + resource);
            if (!this.hasResource(resource)) {
                let keys: string = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || "";
                this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + resource + this.CONSTANTS.RESOURCE_DELIMETER);
            }

            let frameHandle: HTMLIFrameElement = this.addAdalFrame("adalRenewFrame");
            let expectedState: string = Guid.newGuid() + "|" + resource;
            this._idTokenNonce = Guid.newGuid();
            this.config.state = expectedState;
            // renew happens in iframe, so it keeps javascript context
            this._renewStates.push(expectedState);

            this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");

            this.logstatus("Renew token Expected state: " + expectedState);
            let urlNavigate: string = this.getNavigateUrl("token", resource) +
                "&prompt=none&login_hint=" + encodeURIComponent(this._user.userName);
            urlNavigate += "&domain_hint=" + encodeURIComponent(this.getDomainHint());
            urlNavigate += "&nonce=" + encodeURIComponent(this._idTokenNonce);
            this.callback = callback;
            this.registerCallback(expectedState, resource, callback);
            this.idTokenNonce = null;
            this.logstatus("Navigate to:" + urlNavigate);
            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, "");
            frameHandle.src = "about:blank";
            this.loadFrame(urlNavigate, "adalRenewFrame");
        }

        private renewIdToken(callback: IRequestCallback): void {
            // use iframe to try refresh token
            this.info("adal:[renewIdToken]Renewing Id Token...");
            if (!this.hasResource(this.config.clientId)) {
                let keys: string = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS) || "";
                this._saveItem(this.CONSTANTS.STORAGE.TOKEN_KEYS, keys + this.config.clientId + this.CONSTANTS.RESOURCE_DELIMETER);
            }

            let frameHandle: HTMLIFrameElement = this.addAdalFrame("adalIdTokenFrame");
            let expectedState: string = Guid.newGuid() + "|" + this.config.clientId;
            this._idTokenNonce = Guid.newGuid();
            this._saveItem(this.CONSTANTS.STORAGE.NONCE_IDTOKEN, this._idTokenNonce);
            this.config.state = expectedState;
            // renew happens in iframe, so it keeps javascript context
            this._renewStates.push(expectedState);
            this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, expectedState);
            this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");

            this.verbose("adal:[renewIdToken]Renew Idtoken Expected state:" + expectedState);
            let urlNavigate: string = this.getNavigateUrl("id_token", null) +
                "&prompt=none&login_hint=" + encodeURIComponent(this._user.userName);

            // don't add domain_hint twice if user provided it in the extraQueryParameter value
            if (!this.urlContainsQueryStringParameter("domain_hint", urlNavigate)) {
                let domainHint: string = this.getDomainHint();
                this.info("adal:[renewIdToken]Domain hint:" + domainHint);
                urlNavigate += "&domain_hint=" + encodeURIComponent(domainHint);
            }
            urlNavigate += "&nonce=" + encodeURIComponent(this._idTokenNonce);

            this.registerCallback(expectedState, this.config.clientId, callback);
            this.idTokenNonce = null;
            this.verbose("adal:[renewIdToken]Navigate to:" + urlNavigate);
            this._saveItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST, "");
            frameHandle.src = "about:blank";
            this.loadFrame(urlNavigate, "adalIdTokenFrame");
        }

        /**
         * @desc    Retrieves the navigation url for the desired response type
         * @param responseType {string} the desired response type
         * @param resource  {string}    the target resource uri
         */
        private getNavigateUrl(responseType: string, resource: string): string {
            let tenant: string = "common";
            if (this.config.tenant) {
                tenant = this.config.tenant;
            }

            if (this.config.instance) {
                this.instance = this.config.instance;
            }

            let urlNavigate: string = this.instance + tenant + "/oauth2/authorize" + RequestParameters.serialize(responseType, this.config, resource) + this.addClientId();
            this.info("Navigate url:" + urlNavigate);
            return urlNavigate;
        }

        /**
         * @description Copies configuration settings
         * @param obj {any} The input configuration object
         * @returns {IConfig}  The cloned configuration
         */
        private cloneConfig(obj: any): IConfig {
            if (null === obj || "object" !== typeof obj) {
                return obj;
            }
            let copy: any = {};
            Object.keys(obj).forEach((attr: string) => {
                copy[attr] = obj[attr];
            });
            //TODO:something more graceful than this cast
            return copy as IConfig;
        }

        /**
         * @desc Decodes a JWT from a base64 encoded payload
         * @param encodedIdToken The encoded string
         * @returns {IUserProfile} The decoded JWT Claims
         */
        private extractIdToken(encodedIdToken: string): IUserProfile {
            // id token will be decoded to get the username
            let decodedToken: IToken = Token.decodeJwt(encodedIdToken);
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

        /**
         * @description Creates an instance of a user for a given token
         * @param idToken {string} the JWT containing the claims
         */
        private createUser(idToken: string): IUser {
            let user: IUser = null;
            let parsedJson: IUserProfile = this.extractIdToken(idToken);
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

        constructor(cfg: IConfig) {
            let currentdate: Date = new Date();
            console.log("adal-ts:loading complete!");
            this.logstatus("adal:[" + currentdate.getDate() + "]Initializing Active Directory Authentication Library for JS/TS " + Constants.LIBRARY_VERSION);
            if (!this.singletonInstance) {
                this.singletonInstance = this;
                if (cfg) {
                    if (!cfg.clientId) {
                        throw new Error("clientId is required");
                    }
                    this.config = this.cloneConfig(cfg);
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
                    this._activeRenewals = {};
                    (window as IOAuthWindow).callBackMappedToRenewStates = {};
                    (window as IOAuthWindow).callBacksMappedToRenewStates = { values: new Array<IRequestCallback>() };
                    (window as IOAuthWindow).AuthenticationContext = this;
                }
            }
            console.log("adal-ts:loading complete!");
        }
    }
}

/**
 * Establish the global context contructor declared in adalts/adalts.d.ts
 */
var $adal: adal.IContextConstructor<adal.IAuthenticationContext> = adalts.AuthenticationContext;

