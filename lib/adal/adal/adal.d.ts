/**
 * @description Base Contract for OAuth Request Parameters
 */
export interface IRequestParameters {
    error: string;
    errorDescription: string;
    id_token: string;
    access_token: string;
    state: string;
    [key: string]: any;
}
/**
 * @description Concrete implementation of OAuth Request Parameters
 */
export declare class RequestParameters implements IRequestParameters {
    error: string;
    errorDescription: string;
    id_token: string;
    state: string;
    access_token: string;
    static deserialize(query: string): IRequestParameters;
    static serialize(responseType: string, obj: IConfig, resource: string): string;
    [key: string]: any;
}
/**
* @description Interface for representing Token Requests
*/
export interface IRequestInfo {
    valid: boolean;
    parameters: IRequestParameters;
    stateMatch: boolean;
    stateResponse: string;
    requestType: string;
}
/**
* @description Concrete implementation Token Requests
*/
export declare class RequestInfo implements IRequestInfo {
    valid: boolean;
    parameters: IRequestParameters;
    stateMatch: boolean;
    stateResponse: string;
    requestType: string;
}
/**
 * @description Base contract representing a dictionary of
 *  resource URI and Callbacks
 */
export interface ICallbackMap<T> {
    [expectedState: string]: T;
}
/**
 * @description Concrete implementation of a dictionary of
 *  resource URI and Callbacks
 */
export declare class CallbackMap<T> implements ICallbackMap<T> {
    [index: string]: T;
}
/**
* @description Interface for JWT User Claims
*/
export interface IUserProfile {
    upn: string;
    aud: string;
    email: string;
    nbf: number;
    exp: number;
    iat: number;
    iss: number;
    prn: string;
    typ: string;
    nonce: string;
}
/**
* @description Base contract for a User
*/
export interface IUser {
    userName: string;
    profile?: IUserProfile;
}
/**
 * @description Concrete implementation of a User
 */
export declare class User implements IUser {
    userName: string;
    profile: IUserProfile;
}
/**
 * @description Base contract for Request Callback
 * @param {string} message
 * @param {any} item
 */
export interface IRequestCallback {
    (message: string, item?: any): void;
}
/**
* @description Interface for JWT
*/
export interface IToken {
    header: string;
    JWSPayload: string;
    JWSSig: string;
}
/**
* @description Concrete implementation of JWT
* @see IToken
*/
export declare class Token implements IToken {
    header: string;
    JWSPayload: string;
    JWSSig: string;
    static toJwt(matches: RegExpMatchArray): Token;
    static decodeJwt(jwtToken: string): IToken;
    static decode(base64IdToken: string): string;
    static base64DecodeStringUrlSafe(base64IdToken: string): string;
    static convertUrlSafeToRegularBase64EncodedString(str: string): string;
    constructor(header: string, payload: string, signature: string);
}
/**
* @description  Interface for Resource Uri to Endpoint Mapping
*/
export interface IEndpointCollection {
    [key: string]: string;
}
/**
* @description  Concrete implementation of Resource Uri to Endpoint Mapping
*/
export declare class EndpointCollection implements IEndpointCollection {
    [key: string]: string;
}
/**
 * @description Interface for Navigations
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
* @description Helper class for guids
*/
export declare class Guid {
    static newGuid(): string;
}
/**
 * @description Helper class for DateTime methods
 */
export declare class DateTime {
    static now(): number;
}
/**
* @description Class containing Browser Helper Methods
*/
export declare class BrowserHelpers {
    static supportsLocalStorage(): boolean;
    static supportsSessionStorage(): boolean;
}
export interface IRenewalList {
    [resource: string]: any;
}
export declare class RenewalList implements IRenewalList {
    [resource: string]: any;
}
/**
* @description Enumeration for Token Request Types
*/
export declare class RequestTypes {
    LOGIN: string;
    RENEW_TOKEN: string;
    ID_TOKEN: string;
    UNKNOWN: string;
}
/**
 * @description Enumeration for Error Messages
 */
export declare class ErrorMessages {
    NO_TOKEN: string;
}
/**
 * @description Enumeration for Log Severity Levels
 */
export declare class LoggingLevels {
    ERROR: number;
    WARN: number;
    INFO: number;
    VERBOSE: number;
}
/**
 * @description Constants for token storage field names
 */
export declare class StorageConstants {
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
}
/**
 * @description General Constants
 */
export declare class Constants {
    ACCESS_TOKEN: string;
    EXPIRES_IN: string;
    ID_TOKEN: string;
    ERROR_DESCRIPTION: string;
    SESSION_STATE: string;
    STORAGE: StorageConstants;
    RESOURCE_DELIMETER: string;
    LOGGING_LEVEL: LoggingLevels;
    LEVEL_STRING_MAP: IStringMap;
    LIBRARY_VERSION: string;
}
/**
* @description Delgate method for Logger Log method
*/
export interface ILogFunction {
    (message: string): void;
}
/**
 * @description Generic logging class
 */
export declare class Logging {
    static level: number;
    static log: ILogFunction;
}
/**
 * @desc Base contract for Configuration Options
 */
export interface IConfig {
    tenant: string;
    clientId: string;
    redirectUri: string;
    instance: string;
    endpoints: IEndpointCollection;
    correlationId: string;
    cacheLocation: string;
    resource: string;
    loginResource: string;
    state: string;
    expireOffsetSeconds: number;
    localLoginUrl: string;
    postLogoutRedirectUri: string;
    extraQueryParameter: string;
    displayCall: IDisplayCall;
    slice: string;
    [key: string]: any;
}
/**
 * @desc Concrete implementation of Configuration Options
 */
export declare class Config implements IConfig {
    displayCall: IDisplayCall;
    tenant: string;
    clientId: string;
    redirectUri: string;
    instance: string;
    endpoints: IEndpointCollection;
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
    constructor();
}
export interface IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: IUserProfile;
}
/**
* OAuthData implements IOAuthData
*/
export declare class OAuthData implements IOAuthData {
    isAuthenticated: boolean;
    userName: string;
    loginError: string;
    profile: IUserProfile;
}
export interface IOAuthHTMLElement {
    callBackMappedToRenewStates: ICallbackMap<IRequestCallback>;
    callBacksMappedToRenewStates: ICallbackMap<Array<IRequestCallback>>;
    oauth2Callback: any;
    AuthenticationContext: IAuthenticationContext;
}
export interface IOAuthWindow extends Window, IOAuthHTMLElement {
}
export interface IOAuthIFrame extends HTMLIFrameElement, IOAuthHTMLElement {
    parent: IOAuthWindow;
}
/**
 * @description Contract for an Azure Active Directory Authentication Context
 */
export interface IAuthenticationContext {
    REQUEST_TYPE: RequestTypes;
    CONSTANTS: Constants;
    instance: string;
    config: IConfig;
    popUp: boolean;
    frameCallInProgress: boolean;
    callback: IRequestCallback;
    idTokenNonce: string;
    renewActive: boolean;
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
 * @description Concrete implementation of Azure Active Directory Authentication Context
 */
export declare class AuthenticationContext implements IAuthenticationContext {
    REQUEST_TYPE: RequestTypes;
    CONSTANTS: Constants;
    instance: string;
    config: IConfig;
    popUp: boolean;
    frameCallInProgress: boolean;
    callback: IRequestCallback;
    idTokenNonce: string;
    private _singletonInstance;
    private _user;
    private _loginInProgress;
    private _libVersion();
    private _idTokenNonce;
    private _renewStates;
    private _activeRenewals;
    renewActive: boolean;
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
    private _getHostFromUri(uri);
    private _logstatus(msg);
    private _getHash(hash);
    private _expiresIn(expires);
    private _addClientId();
    private _supportsLocalStorage();
    private _urlContainsQueryStringParameter(name, url);
    private _supportsSessionStorage();
    private _getItem(key);
    getItem(key: string): any;
    saveItem(key: string, obj: any): boolean;
    private _saveItem(key, obj);
    private _getResourceFromState(state);
    private _isEmpty(str);
    private _hasResource(key);
    private _guid();
    private _now();
    private _addAdalFrame(iframeId);
    private _loadFrame(urlNavigate, frameName);
    /**
    * @description Redirect the Browser to Azure AD Authorization endpoint
    * @param {string}   urlNavigate The authorization request url
    */
    private promptUser(urlNavigate);
    private _getDomainHint();
    /**
    * Acquires access token with hidden iframe
    * @param {string}   resource  ResourceUri identifying the target resource
    * @param {IRequestCallback} callback The Request Callback
    */
    private _renewToken(resource, callback);
    private _renewIdToken(callback);
    private _getNavigateUrl(responseType, resource);
    private _deserialize(query);
    private _serialize(responseType, obj, resource);
    constructor(cfg: IConfig);
    [key: string]: any;
    private _cloneConfig(obj);
    private _extractIdToken(encodedIdToken);
    private _createUser(idToken);
    private _decode(base64IdToken);
    getUser(callback: IRequestCallback): IUser;
    acquireToken(resource: string, callback: IRequestCallback): void;
    registerCallback(expectedState: string, resource: string, callback: IRequestCallback): void;
    handleWindowCallback(): void;
    getCachedUser(): IUser;
    getRequestInfo(hash: string): IRequestInfo;
    saveTokenFromHash(requestInfo: IRequestInfo): void;
    login(): void;
    logOut(): void;
}
/**
 * @description module dependency injection for commonjs
 *
 * @param config {Config} The Authentication Context configuration to be used
 */
export declare function inject(config: Config): IAuthenticationContext;
