import { QuickReply } from '../../../../quick-reply/src/QuickReply.js';

export const applyTweaks = ()=>{
    tweakQuickReplies();
};
const tweakQuickReplies = ()=>{
    const originalRender = Object.getOwnPropertyDescriptor(QuickReply.prototype, 'render');
    Object.defineProperties(QuickReply.prototype, {
        'visualCache': {
            value: {},
            configurable: true,
            enumerable: true,
            writable: true,
        },
        'getVisualCache': {
            value() {
                const keys = [
                    'isHidden',
                    'icon',
                ];
                return Object.fromEntries(Object.entries(this.toJSON()).filter(([k,v])=>keys.includes(k)));
            },
            configurable: true,
            enumerable: true,
        },
        'hasVisualChanges': {
            get() {
                const cache = this.getVisualCache();
                return JSON.stringify(this.visualCache) != JSON.stringify(cache);
            },
            configurable: true,
            enumerable: true,
        },
        'render': {
            value(...args) {
                if (!this.dom || this.hasVisualChanges) {
                    this.visualCache = this.getVisualCache();
                    return originalRender.value.call(this, ...args);
                }
                return this.dom;
            },
            configurable: true,
            enumerable: true,
        },
    });
};

