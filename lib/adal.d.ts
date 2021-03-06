/// <reference path="../typings/main.d.ts" />
/**
 * TODO:Figure out less hacky way to have this thing play nice
 * when not loading in a CommonJS fashion.
 */
declare var module: adal.IShimModule;
import adal = adalts;
declare module "adal" {
    export = adal;
}
/**
 * @description Shared ADAL Interfaces
 */
declare module adalts {
    interface IShimModule extends NodeModule {
    }
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
    interface IDisplayCall {
        (urlNavigate: string): void;
    }
    /**
     * @description Interface to synthesize message dictionary
     */
    interface IStringMap {
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
        /**
         * @desc    The claim not valid before
         */
        nbf: number;
        /**
         * @desc    The claim expiration
         */
        exp: number;
        /**
         * @desc    The claim issued at
         */
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
        /**
         *  @desc value used to associate a Client session with an ID Token
         */
        nonce: string;
        /**
         * @desc    The claim scope
         */
        scp: string;
        /**
         * @desc    Full Name
         */
        name: string;
        /**
         * @desc    Given name(s) or first name(s)
         */
        given_name: string;
        /**
         * @desc    Surname(s) or last name(s)
         */
        family_name: string;
        /**
         * @desc time the information was last updated
         */
        updated_at: number;
        locale: string;
        zoneinfo: string;
        profile: string;
        picture: string;
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
    interface ILogFunction {
        (message: string): void;
    }
    /**
     * @description  Interface for Resource Uri to Endpoint Mapping
     */
    interface IEndpointCollection {
        [key: string]: string;
    }
    /**
     * @desc Base contract for Configuration Options
     */
    interface IConfig {
        displayCall?: IDisplayCall;
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
        /**0
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
        [key: string]: string;
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
        singletonInstance: IAuthenticationContext;
        decode(base64idToken: string): string;
        newGuid(): string;
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
    interface IConstructable<TConfig, TContext> {
        /**
         *
         * @param config {TConfig}  The context configuration options
         */
        new (config: TConfig): TContext;
    }
    /**
     * @description Generic Interface for casting the context constructor
     * @param T the type constraint to Authentication Contexts
     */
    interface IContextConstructor<T extends IAuthenticationContext> extends IConstructable<IConfig, T> {
    }
}
/**
 * @desc Concrete Adal Interfaces
 */
declare module adalts {
    function inject(config: IConfig): IAuthenticationContext;
    /**
     * @description Concrete implementation of OAuth Request Parameters
     */
    class RequestParameters implements IRequestParameters {
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
        /**
         * @desc    Deserializes OAuth request parameters from a URL string
         * @param   query {string} The URL query string to deserialize
         * @returns {RequestParameters}
         */
        static deserialize(query: string): IRequestParameters;
        /**
         * @desc    Serializes OAuth request parameters to a URL string
         * @param   responseType {string} The desired OAuth response type
         * @param   obj   {adal.IConfig}  The context configuration
         * @param   resource  {string}    The desired resource
         * @returns {string}
         */
        static serialize(responseType: string, obj: IConfig, resource: string): string;
        [key: string]: any;
    }
    /**
    * @description Concrete implementation of JWT
    * @see IToken
    */
    class Token implements IToken {
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
        /**
         * @desc    Converts a regex match set to a JWT
         * @param matches   The regex match set to evaluate
         * @returns {Token}
         */
        static toJwt(matches: RegExpMatchArray): Token;
        /**
         * @desc    Decodes a JWT from a string
         * @param jwtToken  {string}    The encoded token
         * @returns {adal.IToken} The decoded token
         */
        static decodeJwt(jwtToken: string): IToken;
        /**
         * @desc    Decodes a Base64 encoded JWT
         * @param base64IdToken {string} The encoded token string
         * @returns {string}
         */
        static decode(base64IdToken: string): string;
        /**
         * @desc    Url decodes a base64 encoded string
         * @param base64IdToken {string} the base64 encoded token
         * @returns {string}
         */
        static base64DecodeStringUrlSafe(base64IdToken: string): string;
        static convertUrlSafeToRegularBase64EncodedString(str: string): string;
        constructor(...args: any[]);
    }
    /**
    * @description Helper class for guids
    */
    class Guid {
        /**
         * @description returns a new GUID
         */
        static newGuid(): string;
    }
    /**
     * @description Helper class for DateTime methods
     */
    class DateTime {
        /**
         * @desc returns the current time as seconds
         */
        static now(): number;
    }
    /**
    * @description Class containing Browser Helper Methods
    */
    class BrowserHelpers {
        /**
         * @desc Whether the current browser supports local storage
         * @returns {boolean}
         */
        static supportsLocalStorage(): boolean;
        /**
         * @desc Whether the current browser supports session storage
         * @returns {boolean}
         */
        static supportsSessionStorage(): boolean;
    }
    /**
     * @description Enumeration for Log Severity Levels
     */
    enum LoggingLevels {
        ERROR = 0,
        WARN = 1,
        INFO = 2,
        VERBOSE = 3,
    }
    /**
     * @description General Constants
     */
    class Constants {
        static LIBRARY_VERSION: string;
        ACCESS_TOKEN: string;
        EXPIRES_IN: string;
        ID_TOKEN: string;
        ERROR_DESCRIPTION: string;
        SESSION_STATE: string;
        STORAGE: {
            TOKEN_KEYS: string;
            ACCESS_TOKEN_KEY: string;
            EXPIRATION_KEY: string;
            START_PAGE: string;
            START_PAGE_PARAMS: string;
            FAILED_RENEW: string;
            STATE_LOGIN: string;
            STATE_RENEW: string;
            STATE_RENEW_RESOURCE: string;
            STATE_IDTOKEN: string;
            NONCE_IDTOKEN: string;
            SESSION_STATE: string;
            USERNAME: string;
            IDTOKEN: string;
            ERROR: string;
            ERROR_DESCRIPTION: string;
            LOGIN_REQUEST: string;
            LOGIN_ERROR: string;
        };
        RESOURCE_DELIMETER: string;
        LOGGING_LEVEL: typeof LoggingLevels;
        LEVEL_STRING_MAP: IStringMap;
    }
    /**
     * @description Generic logging class
     */
    class Logging {
        /**
         * @desc    The Logging Level
         */
        static level: LoggingLevels;
        /**
         * @desc Logs the specified message
         */
        static log: ILogFunction;
    }
    /**
     * @description Concrete implementation of Azure Active Directory Authentication Context
     */
    class AuthenticationContext implements IAuthenticationContext {
        private _user;
        private _loginInProgress;
        private _idTokenNonce;
        private _renewStates;
        private _activeRenewals;
        instance: string;
        config: IConfig;
        popUp: boolean;
        frameCallInProgress: boolean;
        callback: IRequestCallback;
        idTokenNonce: string;
        renewActive: boolean;
        singletonInstance: AuthenticationContext;
        REQUEST_TYPE: IRequestTypes;
        CONSTANTS: Constants;
        acquireToken(resource: string, callback: IRequestCallback): void;
        Library_Version: string;
        getResourceForEndpoint(endpoint: string): string;
        loginInProgress(): boolean;
        clearCache(): void;
        clearCacheForResource(resource: string): void;
        getLoginError(): string;
        log(level: number, message: string, error: any): void;
        error(message: string, error: any): void;
        warn(message: string): void;
        info(message: string): void;
        verbose(message: string): void;
        isCallback(hash: string): boolean;
        getCachedToken(resource: string): string;
        getHostFromUri(uri: string): string;
        decode(base64idToken: string): string;
        newGuid(): string;
        /**
         * @desc Retrieves an item from the cache
         * @param key   {string} the storage item key
         */
        getItem(key: string): any;
        /**
         * @desc Saves an item to the cache
         * @param key   {string} the storage item key
         * @param obj   {any} the item to be stored
         */
        saveItem(key: string, obj: any): boolean;
        getUser(callback: IRequestCallback): IUser;
        getCachedUser(): IUser;
        getRequestInfo(hash: string): IRequestInfo;
        registerCallback(expectedState: string, resource: string, callback: IRequestCallback): void;
        handleWindowCallback(): void;
        saveTokenFromHash(requestInfo: IRequestInfo): void;
        login(): void;
        logOut(): void;
        private _libVersion();
        private logstatus(msg);
        private getHash(hash);
        private expiresIn(expires);
        private addClientId();
        private supportsLocalStorage();
        private urlContainsQueryStringParameter(name, url);
        private supportsSessionStorage();
        private _getItem(key);
        private _saveItem(key, obj);
        private getResourceFromState(state);
        private isEmpty(str);
        private hasResource(key);
        /**
         * @desc Creates or repurposes an iframe for authentication
         * @param iframeId {string} the iframe id
         */
        private addAdalFrame(iframeId);
        /**
         * @description Loads an iframe for authentication navigation
         * @param urlNavigate {string}  The url to navigate to
         * @param frameName {string} the id of the iframe
         */
        private loadFrame(urlNavigate, frameName);
        /**
         * @description Redirect the Browser to Azure AD Authorization endpoint
         * @param {string}   urlNavigate The authorization request url
         */
        private promptUser(urlNavigate);
        /**
         * @desc Retrieves a domain hint for the OAuth request Url
         * @returns {string}
         */
        private getDomainHint();
        /**
         * @desc Acquires access token with hidden iframe
         * @param {string}   resource  ResourceUri identifying the target resource
         * @param {IRequestCallback} callback The Request Callback
         */
        private renewToken(resource, callback);
        private renewIdToken(callback);
        /**
         * @desc    Retrieves the navigation url for the desired response type
         * @param responseType {string} the desired response type
         * @param resource  {string}    the target resource uri
         */
        private getNavigateUrl(responseType, resource);
        /**
         * @description Copies configuration settings
         * @param obj {any} The input configuration object
         * @returns {IConfig}  The cloned configuration
         */
        private cloneConfig(obj);
        /**
         * @desc Decodes a JWT from a base64 encoded payload
         * @param encodedIdToken The encoded string
         * @returns {IUserProfile} The decoded JWT Claims
         */
        private extractIdToken(encodedIdToken);
        /**
         * @description Creates an instance of a user for a given token
         * @param idToken {string} the JWT containing the claims
         */
        private createUser(idToken);
        constructor(cfg: IConfig);
    }
}
/**
 * Establish the global context contructor declared in adalts/adalts.d.ts
 */
declare var $Adal: adal.IContextConstructor<adal.IAuthenticationContext>;
