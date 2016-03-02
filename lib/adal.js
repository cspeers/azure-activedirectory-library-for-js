var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var RequestParameters = (function () {
    function RequestParameters() {
    }
    RequestParameters.deserialize = function (query) {
        var match, pl = /\+/g, // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g, decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); }, obj = new RequestParameters();
        match = search.exec(query);
        while (match) {
            obj[decode(match[1])] = decode(match[2]);
            match = search.exec(query);
        }
        return obj;
    };
    RequestParameters.serialize = function (responseType, obj, resource) {
        var str = new Array();
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
    };
    return RequestParameters;
})();
exports.RequestParameters = RequestParameters;
/**
* @description Concrete implementation Token Requests
*/
var RequestInfo = (function () {
    function RequestInfo() {
    }
    return RequestInfo;
})();
exports.RequestInfo = RequestInfo;
var CallbackMap = (function () {
    function CallbackMap() {
    }
    return CallbackMap;
})();
exports.CallbackMap = CallbackMap;
var User = (function () {
    function User() {
    }
    return User;
})();
exports.User = User;
/**
* @description Concrete implementation of JWT
* @see IToken
*/
var Token = (function () {
    function Token(header, payload, signature) {
        this.header = header;
        this.JWSPayload = payload;
        this.JWSSig = signature;
    }
    Token.toJwt = function (matches) {
        return new Token(matches[1], matches[2], matches[3]);
    };
    Token.decodeJwt = function (jwtToken) {
        if (jwtToken === null) {
            return null;
        }
        ;
        var idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        var matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            return null;
        }
        var crackedToken = Token.toJwt(matches);
        return crackedToken;
    };
    ;
    Token.decode = function (base64IdToken) {
        var codes = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        base64IdToken = String(base64IdToken).replace(/=+$/, "");
        var length = base64IdToken.length;
        if (length % 4 === 1) {
            throw new Error("The token to be decoded is not correctly encoded.");
        }
        var h1, h2, h3, h4, bits, c1, c2, c3, decoded = "";
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
    };
    Token.base64DecodeStringUrlSafe = function (base64IdToken) {
        // html5 should support atob function for decoding
        base64IdToken = base64IdToken.replace(/-/g, "+").replace(/_/g, "/");
        if (window.atob) {
            return decodeURIComponent(encodeURIComponent(window.atob(base64IdToken))); // jshint ignore:line
        }
        else {
            return decodeURIComponent(encodeURIComponent(Token.decode(base64IdToken)));
        }
    };
    Token.convertUrlSafeToRegularBase64EncodedString = function (str) {
        return str.replace("-", "+").replace("_", "/");
    };
    return Token;
})();
exports.Token = Token;
var EndpointCollection = (function () {
    function EndpointCollection() {
    }
    return EndpointCollection;
})();
exports.EndpointCollection = EndpointCollection;
/**
* @description Helper class for guids
*/
var Guid = (function () {
    function Guid() {
    }
    Guid.newGuid = function () {
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
            }
            else if (guidHolder[i] === "y") {
                // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                r &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                r |= 0x8; // set pos 3 to 1 as 1???
                guidResponse += hex[r];
            }
            else {
                guidResponse += guidHolder[i];
            }
        }
        return guidResponse;
    };
    ;
    return Guid;
})();
exports.Guid = Guid;
/**
 * @description Helper class for DateTime methods
 */
var DateTime = (function () {
    function DateTime() {
    }
    DateTime.now = function () {
        return Math.round(new Date().getTime() / 1000.0);
    };
    ;
    return DateTime;
})();
exports.DateTime = DateTime;
/**
* @description Class containing Browser Helper Methods
*/
var BrowserHelpers = (function () {
    function BrowserHelpers() {
    }
    BrowserHelpers.supportsLocalStorage = function () {
        try {
            return Boolean("localStorage" in window && window["localStorage"]);
        }
        catch (e) {
            return false;
        }
    };
    ;
    BrowserHelpers.supportsSessionStorage = function () {
        try {
            return Boolean("sessionStorage" in window && window["sessionStorage"]);
        }
        catch (e) {
            return false;
        }
    };
    return BrowserHelpers;
})();
exports.BrowserHelpers = BrowserHelpers;
var RenewalList = (function () {
    function RenewalList() {
    }
    return RenewalList;
})();
exports.RenewalList = RenewalList;
/**
* @description Enumeration for Token Request Types
*/
var RequestTypes = (function () {
    function RequestTypes() {
        this.LOGIN = "LOGIN";
        this.RENEW_TOKEN = "RENEW_TOKEN";
        this.ID_TOKEN = "ID_TOKEN";
        this.UNKNOWN = "UNKNOWN";
    }
    return RequestTypes;
})();
exports.RequestTypes = RequestTypes;
var ErrorMessages = (function () {
    function ErrorMessages() {
        this.NO_TOKEN = "User is not authorized";
    }
    return ErrorMessages;
})();
exports.ErrorMessages = ErrorMessages;
var LoggingLevels = (function () {
    function LoggingLevels() {
        this.ERROR = 0;
        this.WARN = 1;
        this.INFO = 2;
        this.VERBOSE = 3;
    }
    return LoggingLevels;
})();
exports.LoggingLevels = LoggingLevels;
var StorageConstants = (function () {
    function StorageConstants() {
        this.TOKEN_KEYS = "adal.token.keys";
        this.ACCESS_TOKEN_KEY = "adal.access.token.key";
        this.EXPIRATION_KEY = "adal.expiration.key";
        this.START_PAGE = "adal.start.page";
        this.START_PAGE_PARAMS = "adal.start.page.params";
        this.FAILED_RENEW = "adal.failed.renew";
        this.STATE_LOGIN = "adal.state.login";
        this.STATE_RENEW = "adal.state.renew";
        this.STATE_RENEW_RESOURCE = "adal.state.renew.resource";
        this.STATE_IDTOKEN = "adal.state.idtoken";
        this.NONCE_IDTOKEN = "adal.nonce.idtoken";
        this.SESSION_STATE = "adal.session.state";
        this.USERNAME = "adal.username";
        this.IDTOKEN = "adal.idtoken";
        this.ERROR = "adal.error";
        this.ERROR_DESCRIPTION = "adal.error.description";
        this.LOGIN_REQUEST = "adal.login.request";
        this.LOGIN_ERROR = "adal.login.error";
    }
    return StorageConstants;
})();
exports.StorageConstants = StorageConstants;
var Constants = (function () {
    function Constants() {
        this.ACCESS_TOKEN = "access_token";
        this.EXPIRES_IN = "expires_in";
        this.ID_TOKEN = "id_token";
        this.ERROR_DESCRIPTION = "error_description";
        this.SESSION_STATE = "session_state";
        this.STORAGE = new StorageConstants();
        this.RESOURCE_DELIMETER = "|";
        this.LOGGING_LEVEL = new LoggingLevels();
        this.LEVEL_STRING_MAP = {
            0: "ERROR:",
            1: "WARNING:",
            2: "INFO:",
            3: "VERBOSE:"
        };
        this.LIBRARY_VERSION = "1.0.8";
    }
    return Constants;
})();
exports.Constants = Constants;
/**
 * @description Generic logging class
 */
var Logging = (function () {
    function Logging() {
    }
    Logging.level = 0;
    Logging.log = function (m) { console.log(m); };
    return Logging;
})();
exports.Logging = Logging;
var ConfigBase = (function () {
    function ConfigBase() {
        this.correlationId = Guid.newGuid();
        this.endpoints = new EndpointCollection();
    }
    return ConfigBase;
})();
exports.ConfigBase = ConfigBase;
var Config = (function (_super) {
    __extends(Config, _super);
    function Config() {
        _super.apply(this, arguments);
    }
    return Config;
})(ConfigBase);
exports.Config = Config;
var AuthenticationContextBase = (function () {
    function AuthenticationContextBase(cfg) {
        this.REQUEST_TYPE = new RequestTypes();
        this.CONSTANTS = new Constants();
        this.popUp = false;
        this._loginInProgress = false;
        this._renewStates = [];
        this._renewActive = false;
        this._singletonInstance = this;
        this.config = cfg;
        this.instance = "https://login.microsoftonline.com/";
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
        window.callBackMappedToRenewStates = new CallbackMap();
        window.callBacksMappedToRenewStates = new CallbackMap();
        window.AuthenticationContext = this;
    }
    AuthenticationContextBase.prototype._libVersion = function () { return this.CONSTANTS.LIBRARY_VERSION; };
    AuthenticationContextBase.prototype.getResourceForEndpoint = function (endpoint) {
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
        }
        else {
            // in angular level, the url for $http interceptor call could be relative url, 
            // if it's relative call, we'll treat it as app backend call. 
            return this.config.loginResource;
        }
        // if not the app's own backend or not a domain listed in the endpoints structure
        return null;
    };
    AuthenticationContextBase.prototype.loginInProgress = function () { return this._loginInProgress; };
    AuthenticationContextBase.prototype.clearCache = function () {
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
    };
    AuthenticationContextBase.prototype.clearCacheForResource = function (resource) {
        this._saveItem(this.CONSTANTS.STORAGE.FAILED_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_RENEW, "");
        this._saveItem(this.CONSTANTS.STORAGE.STATE_IDTOKEN, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR, "");
        this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "");
        if (this._hasResource(resource)) {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, "");
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
        }
    };
    AuthenticationContextBase.prototype.getLoginError = function () {
        return this._getItem(this.CONSTANTS.STORAGE.LOGIN_ERROR);
    };
    AuthenticationContextBase.prototype.log = function (level, message, error) {
        if (level <= Logging.level) {
            var correlationId = this.config.correlationId;
            var timestamp = new Date().toUTCString();
            var formattedMessage = timestamp + ":" + correlationId + "-" + this.CONSTANTS.LEVEL_STRING_MAP[level] + " " + message;
            if (error) {
                formattedMessage += "\nstack:\n" + error.stack;
            }
            Logging.log(formattedMessage);
        }
    };
    AuthenticationContextBase.prototype.error = function (message, error) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.ERROR, message, error);
    };
    ;
    AuthenticationContextBase.prototype.warn = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.WARN, message, null);
    };
    ;
    AuthenticationContextBase.prototype.info = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.INFO, message, null);
    };
    ;
    AuthenticationContextBase.prototype.verbose = function (message) {
        this.log(this.CONSTANTS.LOGGING_LEVEL.VERBOSE, message, null);
    };
    ;
    AuthenticationContextBase.prototype.isCallback = function (hash) {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        return (parameters.hasOwnProperty(this.CONSTANTS.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(this.CONSTANTS.ACCESS_TOKEN) ||
            parameters.hasOwnProperty(this.CONSTANTS.ID_TOKEN));
    };
    AuthenticationContextBase.prototype.getCachedToken = function (resource) {
        if (!this._hasResource(resource)) {
            return null;
        }
        var token = this._getItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource);
        var expired = this._getItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource);
        // If expiration is within offset, it will force renew
        var offset = this.config.expireOffsetSeconds || 120;
        if (expired && (expired > this._now() + offset)) {
            return token;
        }
        else {
            this._saveItem(this.CONSTANTS.STORAGE.ACCESS_TOKEN_KEY + resource, '');
            this._saveItem(this.CONSTANTS.STORAGE.EXPIRATION_KEY + resource, 0);
            return null;
        }
    };
    AuthenticationContextBase.prototype._getHostFromUri = function (uri) {
        // remove http:// or https:// from uri
        var extractedUri = String(uri).replace(/^(https?:)\/\//, '');
        extractedUri = extractedUri.split('/')[0];
        return extractedUri;
    };
    AuthenticationContextBase.prototype._logstatus = function (msg) {
        if (console) {
            console.log(msg);
        }
    };
    AuthenticationContextBase.prototype._getHash = function (hash) {
        if (hash.indexOf("#/") > -1) {
            hash = hash.substring(hash.indexOf("#/") + 2);
        }
        else if (hash.indexOf("#") > -1) {
            hash = hash.substring(1);
        }
        return hash;
    };
    AuthenticationContextBase.prototype._expiresIn = function (expires) {
        return DateTime.now() + parseInt(expires, 10);
    };
    AuthenticationContextBase.prototype._addClientId = function () {
        // x-client-SKU
        // x-client-Ver
        return "&x-client-SKU=Js&x-client-Ver=" + this._libVersion();
    };
    ;
    AuthenticationContextBase.prototype._supportsLocalStorage = function () {
        return BrowserHelpers.supportsLocalStorage();
    };
    AuthenticationContextBase.prototype._urlContainsQueryStringParameter = function (name, url) {
        // regex to detect pattern of a ? or & followed by the name parameter and an equals character
        var regex = new RegExp("[\\?&]" + name + "=");
        return regex.test(url);
    };
    AuthenticationContextBase.prototype._supportsSessionStorage = function () {
        return BrowserHelpers.supportsSessionStorage();
    };
    AuthenticationContextBase.prototype._getItem = function (key) {
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
    };
    AuthenticationContextBase.prototype._saveItem = function (key, obj) {
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
    ;
    AuthenticationContextBase.prototype._getResourceFromState = function (state) {
        if (state) {
            var splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    };
    AuthenticationContextBase.prototype._isEmpty = function (str) {
        return (typeof str === "undefined" || !str || 0 === str.length);
    };
    AuthenticationContextBase.prototype._hasResource = function (key) {
        var keys = this._getItem(this.CONSTANTS.STORAGE.TOKEN_KEYS);
        return keys && !this._isEmpty(keys) && (keys.indexOf(key + this.CONSTANTS.RESOURCE_DELIMETER) > -1);
    };
    AuthenticationContextBase.prototype._guid = function () {
        return Guid.newGuid();
    };
    AuthenticationContextBase.prototype._now = function () {
        return DateTime.now();
    };
    AuthenticationContextBase.prototype._addAdalFrame = function (iframeId) {
        if (typeof iframeId === "undefined") {
            return null;
        }
        this._logstatus("Add adal frame to document:" + iframeId);
        var adalFrame = document.getElementById(iframeId);
        if (!adalFrame) {
            if (document.createElement && document.documentElement && window.navigator.userAgent.indexOf("MSIE 5.0") === -1) {
                var ifr = document.createElement("iframe");
                ifr.setAttribute("id", iframeId);
                ifr.style.visibility = "hidden";
                ifr.style.position = "absolute";
                ifr.style.width = ifr.style.height = ifr.frameBorder = "0px";
                adalFrame = document.getElementsByTagName('body')[0].appendChild(ifr);
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML('beforeEnd', '<iframe name="' + iframeId + '" id="' + iframeId + '" style="display:none"></iframe>');
            }
            if (window.frames && window.frames[iframeId]) {
                adalFrame = window.frames[iframeId];
            }
        }
        return adalFrame;
    };
    AuthenticationContextBase.prototype._loadFrame = function (urlNavigate, frameName) {
        var self = this;
        self.info("LoadFrame:" + frameName);
        var frameCheck = frameName;
        var setupFrame = function () {
            var frameHandle = self._addAdalFrame(frameCheck);
            if (frameHandle.src === '' || frameHandle.src === 'about:blank') {
                frameHandle.src = urlNavigate;
                self._loadFrame(urlNavigate, frameCheck);
            }
        };
        setTimeout(setupFrame, 500);
    };
    /**
    * @description Redirect the Browser to Azure AD Authorization endpoint
    * @param {string}   urlNavigate The authorization request url
    */
    AuthenticationContextBase.prototype.promptUser = function (urlNavigate) {
        if (urlNavigate) {
            this.info("Navigate to:" + urlNavigate);
            window.location.replace(urlNavigate);
        }
        else {
            this.info("Navigate url is empty");
        }
    };
    AuthenticationContextBase.prototype._getDomainHint = function () {
        if (this._user && this._user.userName && this._user.userName.indexOf('@') > -1) {
            var parts = this._user.userName.split('@');
            // local part can include @ in quotes. Sending last part handles that.
            return parts[parts.length - 1];
        }
        return '';
    };
    // var errorResponse = {error:'', errorDescription:''};
    // var token = 'string token';
    // callback(errorResponse, token)
    // with callback
    /**
    * Acquires access token with hidden iframe
    * @param {string}   resource  ResourceUri identifying the target resource
    * @param {IRequestCallback} callback The Request Callback
    */
    AuthenticationContextBase.prototype._renewToken = function (resource, callback) {
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
    };
    AuthenticationContextBase.prototype._renewIdToken = function (callback) {
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
    };
    AuthenticationContextBase.prototype._getNavigateUrl = function (responseType, resource) {
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
    };
    AuthenticationContextBase.prototype._deserialize = function (query) {
        return RequestParameters.deserialize(query);
    };
    AuthenticationContextBase.prototype._serialize = function (responseType, obj, resource) {
        return RequestParameters.serialize(responseType, obj, resource);
    };
    return AuthenticationContextBase;
})();
exports.AuthenticationContextBase = AuthenticationContextBase;
var AuthenticationContext = (function (_super) {
    __extends(AuthenticationContext, _super);
    function AuthenticationContext(cfg) {
        _super.call(this, this._cloneConfig(cfg));
    }
    AuthenticationContext.prototype._cloneConfig = function (obj) {
        if (null === obj || "object" !== typeof obj) {
            return obj;
        }
        var copy = new Config();
        Object.keys(obj).forEach(function (attr) {
            copy[attr] = obj[attr];
        });
        return copy;
    };
    AuthenticationContext.prototype._extractIdToken = function (encodedIdToken) {
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
        }
        catch (err) {
            this.error("The returned id_token could not be decoded", err);
        }
        return null;
    };
    AuthenticationContext.prototype._createUser = function (idToken) {
        var user = null;
        var parsedJson = this._extractIdToken(idToken);
        if (parsedJson && parsedJson.hasOwnProperty("aud")) {
            if (parsedJson.aud.toLowerCase() === this.config.clientId.toLowerCase()) {
                user = {
                    userName: "",
                    profile: parsedJson
                };
                if (parsedJson.hasOwnProperty("upn")) {
                    user.userName = parsedJson.upn;
                }
                else if (parsedJson.hasOwnProperty("email")) {
                    user.userName = parsedJson.email;
                }
            }
            else {
                this.warn("IdToken has invalid aud field");
            }
        }
        return user;
    };
    AuthenticationContext.prototype._decode = function (base64IdToken) { return Token.decode(base64IdToken); };
    AuthenticationContext.prototype.getUser = function (callback) {
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
        }
        else {
            this.warn('User information is not available');
            this.callback('User information is not available');
        }
    };
    AuthenticationContext.prototype.acquireToken = function (resource, callback) {
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
            }
            else {
                this._renewToken(resource, callback);
            }
        }
    };
    AuthenticationContext.prototype.registerCallback = function (expectedState, resource, callback) {
        var _this = this;
        this._activeRenewals[resource] = expectedState;
        if (!window.callBacksMappedToRenewStates[expectedState]) {
            window.callBacksMappedToRenewStates[expectedState] = [];
        }
        window.callBacksMappedToRenewStates[expectedState].push(callback);
        if (!window.callBackMappedToRenewStates[expectedState]) {
            window.callBackMappedToRenewStates[expectedState] = function (message, token) {
                for (var i = 0; i < window.callBacksMappedToRenewStates[expectedState].length; ++i) {
                    window.callBacksMappedToRenewStates[expectedState][i](message, token);
                }
                _this._activeRenewals[resource] = null;
                window.callBacksMappedToRenewStates[expectedState] = null;
                window.callBackMappedToRenewStates[expectedState] = null;
            };
        }
    };
    AuthenticationContext.prototype.handleWindowCallback = function () {
        // This is for regular javascript usage for redirect handling
        // need to make sure this is for callback
        var hash = window.location.hash;
        if (this.isCallback(hash)) {
            var requestInfo = this.getRequestInfo(hash);
            this.info("Returned from redirect url");
            this.saveTokenFromHash(requestInfo);
            var callback;
            if ((requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN ||
                requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) &&
                window.parent) {
                // iframe call but same single page
                this.verbose("Window is in iframe");
                callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                window.src = "";
            }
            else if (window && window.oauth2Callback) {
                this.verbose("Window is redirecting");
                callback = this.callback;
            }
            window.location.hash = "";
            window.location = this._getItem(this.CONSTANTS.STORAGE.LOGIN_REQUEST);
            if (requestInfo.requestType === this.REQUEST_TYPE.RENEW_TOKEN) {
                callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters[this.CONSTANTS.ACCESS_TOKEN] || requestInfo.parameters[this.CONSTANTS.ID_TOKEN]);
                return;
            }
            else if (requestInfo.requestType === this.REQUEST_TYPE.ID_TOKEN) {
                // JS context may not have the user if callback page was different, so parse idtoken again to callback
                callback(this._getItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION), this._createUser(this._getItem(this.CONSTANTS.STORAGE.IDTOKEN)));
                return;
            }
        }
    };
    AuthenticationContext.prototype.getCachedUser = function () {
        if (this._user) {
            return this._user;
        }
        var idtoken = this._getItem(this.CONSTANTS.STORAGE.IDTOKEN);
        this._user = this._createUser(idtoken);
        return this._user;
    };
    AuthenticationContext.prototype.getRequestInfo = function (hash) {
        hash = this._getHash(hash);
        var parameters = this._deserialize(hash);
        var requestInfo = {
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
                }
                else {
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
                if (!requestInfo.stateMatch && window.parent && window.parent.AuthenticationContext) {
                    var statesInParentContext = window.parent.AuthenticationContext._renewStates;
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
    };
    AuthenticationContext.prototype.saveTokenFromHash = function (requestInfo) {
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
        }
        else {
            // It must verify the state from redirect
            if (requestInfo.stateMatch) {
                // record tokens to storage if exists
                this.info("State is right");
                if (requestInfo.parameters.hasOwnProperty(this.CONSTANTS.SESSION_STATE)) {
                    this._saveItem(this.CONSTANTS.STORAGE.SESSION_STATE, requestInfo.parameters[this.CONSTANTS.SESSION_STATE]);
                }
                var keys, resource;
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
                        }
                        else {
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
            }
            else {
                this._saveItem(this.CONSTANTS.STORAGE.ERROR, "Invalid_state");
                this._saveItem(this.CONSTANTS.STORAGE.ERROR_DESCRIPTION, "Invalid_state");
                if (requestInfo.requestType === this.REQUEST_TYPE.LOGIN) {
                    this._saveItem(this.CONSTANTS.STORAGE.LOGIN_ERROR, "State is not same as " + requestInfo.stateResponse);
                }
            }
        }
    };
    AuthenticationContext.prototype.login = function () {
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
        }
        else {
            this.promptUser(urlNavigate);
        }
        // callback from redirected page will receive fragment. It needs to call oauth2Callback
    };
    AuthenticationContext.prototype.logOut = function () {
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
    };
    return AuthenticationContext;
})(AuthenticationContextBase);
exports.AuthenticationContext = AuthenticationContext;
function inject(config) {
    return new AuthenticationContext(config);
}
exports.inject = inject;
//# sourceMappingURL=adal.js.map