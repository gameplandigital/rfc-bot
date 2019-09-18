/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Activity, BotAdapter, TurnContext, ConversationReference, ResourceResponse } from 'botbuilder';
import { FacebookBotWorker } from './botworker';
import { FacebookAPI } from './facebook_api';
/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) or [BotBuilder](https://www.npmjs.com/package/botbuilder) to Facebook Messenger.
 */
export declare class FacebookAdapter extends BotAdapter {
    /**
     * Name used by Botkit plugin loader
     * @ignore
     */
    name: string;
    /**
     * Object containing one or more Botkit middlewares to bind automatically.
     * @ignore
     */
    middlewares: any;
    /**
     * A customized BotWorker object that exposes additional utility methods.
     * @ignore
     */
    botkit_worker: typeof FacebookBotWorker;
    private options;
    /**
     * Create an adapter to handle incoming messages from Facebook and translate them into a standard format for processing by your bot.
     *
     * The Facebook Adapter can be used in 2 modes:
     * * bound to a single Facebook page
     * * multi-tenancy mode able to serve multiple pages
     *
     * To create an app bound to a single Facebook page, include that page's `access_token` in the options.
     *
     * To create an app that can be bound to multiple pages, include `getAccessTokenForPage` - a function in the form `async (pageId) => page_access_token`
     *
     * To use with Botkit:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *      access_token: process.env.FACEBOOK_ACCESS_TOKEN
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // other options
     * });
     * ```
     *
     * To use with BotBuilder:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *      access_token: process.env.FACEBOOK_ACCESS_TOKEN
     * });
     * const server = restify.createServer();
     * server.use(restify.plugins.bodyParser());
     * server.post('/api/messages', (req, res) => {
     *      adapter.processActivity(req, res, async(context) => {
     *          // do your bot logic here!
     *      });
     * });
     * ```
     *
     * In multi-tenancy mode:
     * ```javascript
     * const adapter = new FacebookAdapter({
     *      verify_token: process.env.FACEBOOK_VERIFY_TOKEN,
     *      app_secret: process.env.FACEBOOK_APP_SECRET,
     *       getAccessTokenForPage: async(pageId) => {
     *           // do something to fetch the page access token for pageId.
     *           return token;
     *       })
     * });
     *```
     *
     * @param options Configuration options
     */
    constructor(options: FacebookAdapterOptions);
    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     *      * Amends the webhook_uri with an additional behavior for responding to Facebook's webhook verification request.
     * @param botkit
     */
    init(botkit: any): Promise<any>;
    /**
     * Get a Facebook API client with the correct credentials based on the page identified in the incoming activity.
     * This is used by many internal functions to get access to the Facebook API, and is exposed as `bot.api` on any BotWorker instances passed into Botkit handler functions.
     *
     * ```javascript
     * let api = adapter.getAPI(activity);
     * let res = api.callAPI('/me/messages', 'POST', message);
     * ```
     * @param activity An incoming message activity
     */
    getAPI(activity: Partial<Activity>): Promise<FacebookAPI>;
    /**
     * Converts an Activity object to a Facebook messenger outbound message ready for the API.
     * @param activity
     */
    private activityToFacebook;
    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    sendActivities(context: TurnContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]>;
    /**
     * Facebook adapter does not support updateActivity.
     * @ignore
     */
    updateActivity(context: TurnContext, activity: Partial<Activity>): Promise<void>;
    /**
     * Facebook adapter does not support updateActivity.
     * @ignore
     */
    deleteActivity(context: TurnContext, reference: Partial<ConversationReference>): Promise<void>;
    /**
     * Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)
     * @param reference A conversation reference to be applied to future messages.
     * @param logic A bot logic function that will perform continuing action in the form `async(context) => { ... }`
     */
    continueConversation(reference: Partial<ConversationReference>, logic: (context: TurnContext) => Promise<void>): Promise<void>;
    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    processActivity(req: any, res: any, logic: (context: TurnContext) => Promise<void>): Promise<void>;
    /**
     * Handles each individual message inside a webhook payload (webhook may deliver more than one message at a time)
     * @param message
     * @param logic
     */
    private processSingleMessage;
    private verifySignature;
}
/**
 * This interface defines the options that can be passed into the FacebookAdapter constructor function.
 */
export interface FacebookAdapterOptions {
    /**
     * Alternate root url used to contruct calls to Facebook's API.  Defaults to 'graph.facebook.com' but can be changed (for mocking, proxy, etc).
     */
    api_host?: string;
    /**
     * Alternate API version used to construct calls to Facebook's API. Defaults to v3.2
     */
    api_version?: string;
    /**
     * The "verify token" used to initially create and verify the Webhooks subscription settings on Facebook's developer portal.
     */
    verify_token: string;
    /**
     * The "app secret" from the "basic settings" page from your app's configuration in the Facebook developer portal
     */
    app_secret: string;
    /**
     * When bound to a single page, use `access_token` to specify the "page access token" provided in the Facebook developer portal's "Access Tokens" widget of the "Messenger Settings" page.
     */
    access_token?: string;
    /**
     * When bound to multiple teams, provide a function that, given a page id, will return the page access token for that page.
     */
    getAccessTokenForPage?: (pageId: string) => Promise<string>;
    /**
     * Allow the adapter to startup without a complete configuration.
     * This is risky as it may result in a non-functioning or insecure adapter.
     * This should only be used when getting started.
     */
    enable_incomplete?: boolean;
}
