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
const botbuilder_1 = require("botbuilder");
/**
 * This adapter middleware, when used in conjunction with FacebookAdapter and Botkit, will result in Botkit emitting events with
 * names based on their event type.
 *
 * ```javascript
 * const adapter = new FacebookAdapter(MY_OPTIONS);
 * adapter.use(new FacebookEventTypeMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 * });
 *
 * // define a handler for one of the new events
 * controller.on('facebook_option', async(bot, message) => {
 *      // ...
 * });
 * ```
 *
 * When used, events emitted may include:
 * * facebook_postback
 * * facebook_referral
 * * facebook_optin
 * * message_delivered
 * * message_read
 * * facebook_account_linking
 * * message_echo
 * * facebook_app_roles
 * * standby
 * * facebook_receive_thread_control
 * * facebook_request_thread_control
 *
 */
class FacebookEventTypeMiddleware extends botbuilder_1.MiddlewareSet {
    /**
     * Implements the middleware's onTurn function. Called automatically.
     * @ignore
     * @param context
     * @param next
     */
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (context.activity && context.activity.channelData) {
                let type = null;
                if (context.activity.channelData.postback) {
                    type = 'facebook_postback';
                }
                else if (context.activity.channelData.referral) {
                    type = 'facebook_referral';
                }
                else if (context.activity.channelData.optin) {
                    type = 'facebook_optin';
                }
                else if (context.activity.channelData.delivery) {
                    type = 'message_delivered';
                }
                else if (context.activity.channelData.read) {
                    type = 'message_read';
                }
                else if (context.activity.channelData.account_linking) {
                    type = 'facebook_account_linking';
                }
                else if (context.activity.channelData.message && context.activity.channelData.message.is_echo) {
                    type = 'message_echo';
                    context.activity.type = botbuilder_1.ActivityTypes.Event;
                }
                else if (context.activity.channelData.app_roles) {
                    type = 'facebook_app_roles';
                }
                else if (context.activity.channelData.standby) {
                    type = 'standby';
                }
                else if (context.activity.channelData.pass_thread_control) {
                    type = 'facebook_receive_thread_control';
                }
                else if (context.activity.channelData.take_thread_control) {
                    type = 'facebook_lose_thread_control';
                }
                else if (context.activity.channelData.request_thread_control) {
                    type = 'facebook_request_thread_control';
                }
                context.activity.channelData.botkitEventType = type;
            }
            yield next();
        });
    }
}
exports.FacebookEventTypeMiddleware = FacebookEventTypeMiddleware;
//# sourceMappingURL=facebook_event_middleware.js.map