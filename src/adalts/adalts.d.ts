/**
 * @description Interface definition for ADALTS
 * @summary The common interfaces used by the authentication
 * context and the associated angular binding
 */

/**
 * @summary Global contructor instance.
 * @description Since we are defining the interface in an ambient context it will be incumbent
 * on the context implementation to declare and instantiate this in the angular binding
 */
declare var $adal:adal.IContextConstructor<adal.IAuthenticationContext>;

//fold back into adal
import adal=adalts;

//expose as ambient
declare module "adal" {
    export=adal;
}

/**
 * @description Shared ADAL Interfaces
 */
declare module adalts {

    /**
     * @description Contract for a token based Authentication service
     */
    interface IAuthenticationService {
        config: IConfig;
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
    }

    interface IOAuthData {
        isAuthenticated: boolean;
        userName: string;
        loginError: string;
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
    interface IContextConstructor<T extends IAuthenticationContext> extends IConstructable<IConfig,T>
    {

    }
}