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
const botkit_1 = require("botkit");
/**
 * This is a specialized version of [Botkit's core BotWorker class](core.md#BotWorker) that includes additional methods for interacting with Facebook.
 * It includes all functionality from the base class, as well as the extension methods below.
 *
 * When using the FacebookAdapter with Botkit, all `bot` objects passed to handler functions will include these extensions.
 */
class FacebookBotWorker extends botkit_1.BotWorker {
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
    constructor(botkit, config) {
        // allow a page id to be passed in
        if (typeof config === 'string') {
            const page_id = config;
            config = {
                // an activity is required to spawn the bot via the api
                activity: {
                    channelId: 'facebook',
                    recipient: {
                        id: page_id
                    }
                }
            };
        }
        super(botkit, config);
    }
    // TODO: Typing indicators
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
    startConversationWithUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.changeContext({
                channelId: 'facebook',
                // @ts-ignore
                conversation: { id: userId },
                bot: this.getConfig('activity').recipient,
                // @ts-ignore
                user: { id: userId }
            });
        });
    }
}
exports.FacebookBotWorker = FacebookBotWorker;
//# sourceMappingURL=botworker.js.map