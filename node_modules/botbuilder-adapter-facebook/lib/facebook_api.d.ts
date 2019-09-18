/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * A simple API client for the Facebook API.  Automatically signs requests with the access token and app secret proof.
 * It can be used to call any API provided by Facebook.
 *
 */
export declare class FacebookAPI {
    private token;
    private secret;
    private api_host;
    private api_version;
    /**
     * Create a FacebookAPI client.
     * ```
     * let api = new FacebookAPI(TOKEN, SECRET);
     * await api.callAPI('/some/api','POST', {some_options});
     * ```
     * @param token a page access token
     * @param secret an app secret
     * @param api_host optional root hostname for constructing api calls, defaults to graph.facebook.com
     * @param api_version optional api version used when constructing api calls, defaults to v3.2
     */
    constructor(token: string, secret: string, api_host?: string, api_version?: string);
    /**
     * Call one of the Facebook APIs
     * @param path Path to the API endpoint, for example `/me/messages`
     * @param method HTTP method, for example POST, GET, DELETE or PUT.
     * @param payload An object to be sent as parameters to the API call.
     */
    callAPI(path: string, method: string, payload: any): Promise<any>;
    /**
     * Generate the app secret proof used to increase security on calls to the graph API
     * @param access_token a page access token
     * @param app_secret an app secret
     */
    private getAppSecretProof;
}
