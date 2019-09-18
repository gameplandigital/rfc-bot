"use strict";
/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const crypto = require("crypto");
/**
 * A simple API client for the Facebook API.  Automatically signs requests with the access token and app secret proof.
 * It can be used to call any API provided by Facebook.
 *
 */
class FacebookAPI {
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
    constructor(token, secret, api_host = 'graph.facebook.com', api_version = 'v3.2') {
        if (!token) {
            throw new Error('Token is required!');
        }
        this.token = token;
        this.secret = secret;
        this.api_host = api_host;
        this.api_version = api_version;
    }
    /**
     * Call one of the Facebook APIs
     * @param path Path to the API endpoint, for example `/me/messages`
     * @param method HTTP method, for example POST, GET, DELETE or PUT.
     * @param payload An object to be sent as parameters to the API call.
     */
    callAPI(path, method = 'POST', payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let proof = this.getAppSecretProof(this.token, this.secret);
            return new Promise((resolve, reject) => {
                request({
                    method: method,
                    json: true,
                    body: payload,
                    uri: 'https://' + this.api_host + '/' + this.api_version + path + '?access_token=' + this.token + '&appsecret_proof=' + proof
                }, (err, res, body) => {
                    if (err) {
                        reject(err);
                    }
                    else if (body.error) {
                        reject(body.error.message);
                    }
                    else {
                        resolve(body);
                    }
                });
            });
        });
    }
    /**
     * Generate the app secret proof used to increase security on calls to the graph API
     * @param access_token a page access token
     * @param app_secret an app secret
     */
    getAppSecretProof(access_token, app_secret) {
        var hmac = crypto.createHmac('sha256', app_secret || '');
        return hmac.update(access_token).digest('hex');
    }
}
exports.FacebookAPI = FacebookAPI;
//# sourceMappingURL=facebook_api.js.map