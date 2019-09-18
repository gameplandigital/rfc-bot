/**
 * @module botbuilder-adapter-facebook
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { MiddlewareSet } from 'botbuilder';
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
export declare class FacebookEventTypeMiddleware extends MiddlewareSet {
    /**
     * Implements the middleware's onTurn function. Called automatically.
     * @ignore
     * @param context
     * @param next
     */
    onTurn(context: any, next: any): Promise<void>;
}
