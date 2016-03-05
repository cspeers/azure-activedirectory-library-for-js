/// <reference path="../../typings/angularjs/angular.d.ts" />
import * as adal from "../adal";
/**
 * @description module dependency injection for commonjs
 *
 * @param config {Config} The Authentication Context configuration to be used
 */
export declare function inject(config: adal.IConfig): adal.IAuthenticationContext;
