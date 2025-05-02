import { EventEmitter } from '../../../../../../lib/eventemitter.js';
import { quickReplyApi } from '../../../../quick-reply/index.js';
import { QuickReply } from '../../../../quick-reply/src/QuickReply.js';
import { QuickReplyConfig } from '../../../../quick-reply/src/QuickReplyConfig.js';
import { QuickReplySet } from '../../../../quick-reply/src/QuickReplySet.js';
import { QuickReplySetLink } from '../../../../quick-reply/src/QuickReplySetLink.js';
import { QuickReplySettings } from '../../../../quick-reply/src/QuickReplySettings.js';

/**@typedef {QuickReply & { eventSource:EventEmitter, isObservabe:boolean }} ObservableQuickReply */
/**@typedef {QuickReplySet & { eventSource:EventEmitter, isObservabe:boolean }} ObservableQuickReplySet */


/** @readonly */
/** @enum {string} */
export const QR_EVENT = {
    /** ... */
    PROP_CHANGED: 'prop_changed',
    /** ... */
    ARRAY_CHANGED: 'array_changed',
    /** ... */
    EDITOR: 'editor',
    /** ... */
    DELETE: 'delete',
};
/** @readonly */
/** @enum {string} */
export const QRS_EVENT = {
    /** ... */
    DELETE: 'delete',
    /** ... */
    PROP_CHANGED: 'prop_changed',
    /** ... */
    GLOBAL_STATE: 'global_state',
    /** ... */
    CHAT_STATE: 'chat_state',
};
/** @readonly */
/** @enum {string} */
export const QRS_STATIC_EVENT = {
    /** ... */
    CREATE: 'create',
};


const watchedProperties = [
    'icon',
    'label',
    'showLabel',
    'title',
    'message',
    'preventAutoExecute',
    'isHidden',
    'executeOnStartup',
    'executeOnUser',
    'executeOnAi',
    'executeOnChatChange',
    'executeOnGroupMemberDraft',
    'executeOnNewChat',
    'automationId',
];
const watchedArrays = [
    'contextList',
];


const createObservableArray = (arr, callback)=>{
    const methods = [
        'push',
        'pop',
        'splice',
        'unshift',
        'sort',
        'reverse',
    ];

    const handler = {
        get(target, property, receiver) {
            if (methods.includes(property)) {
                return (...args)=>{
                    const result = Array.prototype[property].apply(target, args);
                    callback({ property });
                    return result;
                };
            }
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            if (!isNaN(parseInt(String(property)))) {
                callback({ property });
            }
            return Reflect.set(target, property, value, receiver);
        },
    };

    return new Proxy(arr, handler);
};

const createEmittingMethod = (prototype, methodName, event) => {
    const originalMethod = Object.getOwnPropertyDescriptor(prototype, methodName);
    Object.defineProperty(prototype, methodName, {
        value: function(...args) {
            const returnValue = originalMethod.value.call(this, ...args);
            this.eventSource.emit(event, this);
            return returnValue;
        },
        configurable: true,
        enumerable: true,
    });
};

const migrateQuickReplySet = (qrs)=>{
    qrs.isObservable = true;
    for (const qr of qrs.qrList) {
        migrateQuickReplyProperties(qr);
    }
    // automatically migrate new QRs
    qrs.qrList = createObservableArray(qrs.qrList, ()=>{
        for (const qr of qrs.qrList.filter(it=>!it.isObservable)) {
            migrateQuickReplyProperties(qr);
        }
    });
    for (const prop of ['name']) {
        let privateProp = `_${prop}`;
        Object.defineProperty(QuickReplySet.prototype, prop, {
            get() {
                if (Object.prototype.hasOwnProperty.call(this, prop)) {
                    this[privateProp] = this[prop];
                    delete this[prop];
                }
                return this[privateProp];
            },
            set(value) {
                const oldValue = this[privateProp];
                if (oldValue != value) {
                    this[privateProp] = value;
                    this.eventSource.emit(QRS_EVENT.PROP_CHANGED, this, { property:prop, oldValue, value });
                }
            },
            configurable: true,
            enumerable: true,
        });
        if (Object.prototype.hasOwnProperty.call(qrs, prop)) {
            const value = qrs[prop];
            delete qrs[prop];
            qrs[prop] = value;
        } else {
            const value = qrs[prop];
            if (!Object.prototype.hasOwnProperty.call(qrs, privateProp)) {
                qrs[privateProp] = value;
            }
        }
    }
};
const migrateQuickReplyProperties = (qr)=>{
    qr.isObservable = true;
    for (const prop of [...watchedProperties, ...watchedArrays]) {
        const privateProp = `_${prop}`;
        if (Object.prototype.hasOwnProperty.call(qr, prop)) {
            const value = qr[prop];
            delete qr[prop];
            qr[prop] = value;
        } else {
            const value = qr[prop];
            if (!Object.prototype.hasOwnProperty.call(qr, privateProp)) {
                qr[privateProp] = value;
            }
        }
    }
};


export const hookQuickReply = ()=>{
    // add event emitters
    Object.defineProperty(QuickReplySet, 'staticEventSource', {
        get() {
            if (!this._eventSource) {
                this._eventSource = new EventEmitter();
            }
            return this._eventSource;
        },
        set(value) {
            this._eventSource = value;
        },
        configurable: true,
        enumerable: true,
    });
    Object.defineProperty(QuickReplySet.prototype, 'eventSource', {
        get() {
            if (!this._eventSource) {
                this._eventSource = new EventEmitter();
            }
            return this._eventSource;
        },
        set(value) {
            this._eventSource = value;
        },
        configurable: true,
        enumerable: true,
    });
    Object.defineProperty(QuickReply.prototype, 'eventSource', {
        get() {
            if (!this._eventSource) {
                this._eventSource = new EventEmitter();
            }
            return this._eventSource;
        },
        set(value) {
            this._eventSource = value;
        },
        configurable: true,
        enumerable: true,
    });

    // simple properties
    for (const prop of watchedProperties) {
        let privateProp = `_${prop}`;
        Object.defineProperty(QuickReply.prototype, prop, {
            get() {
                if (Object.prototype.hasOwnProperty.call(this, prop)) {
                    this[privateProp] = this[prop];
                    delete this[prop];
                }
                return this[privateProp];
            },
            set(value) {
                const oldValue = this[privateProp];
                if (oldValue != value) {
                    this[privateProp] = value;
                    this.eventSource.emit(QR_EVENT.PROP_CHANGED, this, { property:prop, oldValue, value });
                }
            },
            configurable: true,
            enumerable: true,
        });
    }

    // arrays
    for (const prop of watchedArrays) {
        const privateProp = '_contextList';
        Object.defineProperty(QuickReply.prototype, prop, {
            get() {
                return this[privateProp];
            },
            set(value) {
                const oldValue = this[privateProp];
                if (oldValue != value) {
                    if (Array.isArray(value)) {
                        this[privateProp] = createObservableArray(value, ()=>this.eventSource.emit(QR_EVENT.ARRAY_CHANGED, this, { property:prop }));
                    } else {
                        this[privateProp] = value;
                    }
                    this.eventSource.emit(QR_EVENT.PROP_CHANGED, this, { property:prop, oldValue, value });
                }
            },
            configurable: true,
            enumerable: true,
        });
    }

    // migrate existing instances
    for (const qrs of QuickReplySet.list) {
        migrateQuickReplySet(qrs);
    }

    // automatically migrate instances in new QR Sets
    QuickReplySet.list = createObservableArray(QuickReplySet.list, ()=>{
        for (const qrs of /**@type {ObservableQuickReplySet[]}*/(QuickReplySet.list.filter(it=>!it.isObservable))) {
            migrateQuickReplySet(qrs);
            QuickReplySet.staticEventSource.emit(QRS_STATIC_EVENT.CREATE, qrs);
        }
    });

    // watch changes to globally active QR Sets
    quickReplyApi.settings.config.setList = createObservableArray(quickReplyApi.settings.config.setList, ()=>{
        for (const qrs of /**@type {ObservableQuickReplySet[]}*/(QuickReplySet.list)) {
            qrs.eventSource.emit(QRS_EVENT.GLOBAL_STATE);
        }
    });

    // watch changes to chat active QR Sets
    const originalChatConfigDescriptor = Object.getOwnPropertyDescriptor(QuickReplySettings.prototype, 'chatConfig');
    Object.defineProperty(QuickReplySettings.prototype, 'chatConfig', {
        get() {
            return originalChatConfigDescriptor.get.call(this);
        },
        /**
         * @param {QuickReplyConfig} value
         */
        set(value) {
            if (value) {
                value.setList = createObservableArray(value.setList, ()=>{
                    for (const qrs of /**@type {ObservableQuickReplySet[]}*/(QuickReplySet.list)) {
                        qrs.eventSource.emit(QRS_EVENT.CHAT_STATE);
                    }
                });
            }
            originalChatConfigDescriptor.set.call(this, value);
        },
        configurable: true,
        enumerable: true,
    });

    // watch changes to existing QR Set links
    const originalUpdate = Object.getOwnPropertyDescriptor(QuickReplySetLink.prototype, 'update');
    Object.defineProperty(QuickReplySetLink.prototype, 'update', {
        value: function(...args) {
            for (const qrs of /**@type {ObservableQuickReplySet[]}*/(QuickReplySet.list)) {
                qrs.eventSource.emit(QRS_EVENT.GLOBAL_STATE);
                qrs.eventSource.emit(QRS_EVENT.CHAT_STATE);
            }
            return originalUpdate.value.call(this, ...args);
        },
        configurable: true,
        enumerable: true,
    });

    // showEditor
    const originalShowEditor = Object.getOwnPropertyDescriptor(QuickReply.prototype, 'showEditor');
    Object.defineProperty(QuickReply.prototype, 'showEditor', {
        /**@this {ObservableQuickReply} */
        value: function(forceVanilla = false) {
            if (forceVanilla) return originalShowEditor.value.call(this);
            this.eventSource.emit(QR_EVENT.EDITOR, this);
        },
        configurable: true,
        enumerable: true,
    });

    // delete
    createEmittingMethod(QuickReply.prototype, 'delete', QR_EVENT.DELETE);
    createEmittingMethod(QuickReplySet.prototype, 'delete', QRS_EVENT.DELETE);
};
