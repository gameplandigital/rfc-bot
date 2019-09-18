/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Botkit, BotWorker } from 'botkit';
import { FacebookAPI } from './facebook_api';
/**
 * This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Facebook.
 * It includes all functionality from the base class, as well as the extension methods below.
 *
 * When using the FacebookAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.
 */
export declare class FacebookBotWorker extends BotWorker {
    /**
     * A copy of the FacebookAPI client giving access to `let res = await bot.api.callAPI(path, method, parameters);`
     */
    api: FacebookAPI;
    /**
     * Reserved for use internally by Botkit's `controller.spawn()`, this class is used to create a BotWorker instance that can send messages, replies, and make other API calls.
     *
     * When used with the FacebookAdapter's multi-tenancy mode, it is possible to spawn a bot instance by passing in the Facebook page ID representing the appropriate bot identity.
     * Use this in concert with [startConversationWithUser()](#startConversationWithUser) and [changeContext()](core.md#changecontext) to start conversations
     * or send proactive alerts to users on a schedule or in response to external events.
     *
     * ```javascript
     * let bot = await controller.spawn(FACEBOOK_PAGE_ID);
     * ```
     * @param botkit The Botkit controller object responsible for spawning this bot worker.
     * @param config Normally, a DialogContext object.  Can also be the ID of a Facebook page managed by this app.
     */
    constructor(botkit: Botkit, config: any);
    /**
     * Change the operating context of the worker to begin a conversation with a specific user.
     * After calling this method, any calls to `bot.say()` or `bot.beginDialog()` will occur in this new context.
     *
     * This method can be used to send users scheduled messages or messages triggered by external events.
     * ```javascript
     * let bot = await controller.spawn(FACEBOOK_PAGE_ID);
     * await bot.startConversationWithUser(FACEBOOK_USER_PSID);
     * await bot.say('Howdy human!');
     * ```
     *
     * @param userId the PSID of a user the bot has previously interacted with
     */
    startConversationWithUser(userId: any): Promise<void>;
}
