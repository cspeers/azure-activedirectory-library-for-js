
declare var $Adal:adal.IFactory;
import adal=adalts;

declare module "adal" {
    export=adal;
}

declare module adalts {

    interface IFactoryMethod<T,C>{
        (config:C):T
    }

    interface IFactory extends IFactoryMethod<IAuthenticationContext,IConfig>{
        (config:IConfig):IAuthenticationContext;
    }

    /**
  * @description Base Contract for OAuth Request Parameters
  */
    interface IRequestParameters {
        error: string;
        errorDescription: string;
        id_token: string;
        access_token: string;
        state: string;
        [key: string]: any;
    }

    /**
     * @description Interface for representing Token Requests
     */
    interface IRequestInfo {
        valid: boolean;
        parameters: IRequestParameters;
        stateMatch: boolean;
        stateResponse: string;
        requestType: string;
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

    interface IUser {
        userName: string;
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
        header: string;
        JWSPayload: string;
        JWSSig: string;
    }

    interface IRenewalList {
        [resource: string]: any;
    }

    /**
     * @description Delgate method for Logger Log method
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

    interface IErrorMessages {
        [key: string]: string;
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

        REQUEST_TYPE: IRequestTypes;
        CONSTANTS: any;
        instance: string;
        config: IConfig;
        popUp: boolean;
        frameCallInProgress: boolean;
        callback: IRequestCallback;
        idTokenNonce: string;
        renewActive: boolean;
        singletonInstance:IAuthenticationContext;

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
}