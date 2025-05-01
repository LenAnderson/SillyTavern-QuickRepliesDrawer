/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReplySet} QuickReplySet */

import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { quickReplyApi } from '../../../quick-reply/index.js';
import { QRS_EVENT } from './helper/hookQuickReply.js';
import { QrItem } from './QrItem.js';

export class QrsItem {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** open QR editor */
        QR_EDITOR: 'qr_editor',
        /** open QR Set settings */
        QR_SET_SETTINGS: 'qr_set_settings',
    };




    /**@type {QuickReplySet} */ qrs;


    get isActiveGlobal() {
        return quickReplyApi.listGlobalSets().includes(this.qrs.name);
    }
    get isActiveChat() {
        return quickReplyApi.listChatSets().includes(this.qrs.name);
    }


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        title: undefined,
        /**@type {HTMLElement} */
        global: undefined,
        /**@type {HTMLElement} */
        chat: undefined,
        /**@type {HTMLElement} */
        collapseToggle: undefined,
        /**@type {HTMLElement} */
        qrList: undefined,
    };



    /**
     * @param {QuickReplySet} qrs
     */
    constructor(qrs) {
        this.qrs = qrs;
        qrs.eventSource.on(QRS_EVENT.PROP_CHANGED, (qrs, evt)=>this.handlePropChange(evt));
        qrs.eventSource.on(QRS_EVENT.GLOBAL_STATE, (qrs)=>this.handleGlobalStateChange());
        qrs.eventSource.on(QRS_EVENT.CHAT_STATE, (qrs)=>this.handleChatStateChange());
    }




    render() {
        const qrsItem = document.createElement('div'); {
            this.dom.root = qrsItem;
            qrsItem.classList.add('stqrd--qrsItem');
            const head = document.createElement('div'); {
                head.classList.add('stqrd--head');
                const title = document.createElement('div'); {
                    this.dom.title = title;
                    title.classList.add('stqrd--title');
                    title.textContent = this.qrs.name;
                    title.addEventListener('click', ()=>this.toggle());
                    head.append(title);
                }
                const actions = document.createElement('div'); {
                    actions.classList.add('stqrd--actions');
                    const global = document.createElement('div'); {
                        this.dom.global = global;
                        global.classList.add('stqrd--action');
                        global.classList.add('stqrd--global');
                        if (this.isActiveGlobal) global.classList.add('stqrd--isActive');
                        global.classList.add('fa-solid', 'fa-fw', 'fa-globe');
                        global.addEventListener('click', ()=>{
                            const is = this.isActiveGlobal;
                            if (!is) quickReplyApi.addGlobalSet(this.qrs.name);
                            else quickReplyApi.removeGlobalSet(this.qrs.name);
                            global.classList[is ? 'remove' : 'add']('stqrd--isActive');
                        });
                        actions.append(global);
                    }
                    const chat = document.createElement('div'); {
                        this.dom.chat = chat;
                        chat.classList.add('stqrd--action');
                        chat.classList.add('stqrd--chat');
                        if (this.isActiveChat) chat.classList.add('stqrd--isActive');
                        chat.classList.add('fa-solid', 'fa-fw', 'fa-comments');
                        chat.addEventListener('click', ()=>{
                            const is = this.isActiveChat;
                            if (!is) quickReplyApi.addChatSet(this.qrs.name);
                            else quickReplyApi.removeChatSet(this.qrs.name);
                            chat.classList[is ? 'remove' : 'add']('stqrd--isActive');
                        });
                        actions.append(chat);
                    }
                    const menuTrigger = document.createElement('div'); {
                        menuTrigger.classList.add('stqrd--action');
                        menuTrigger.classList.add('stqrd--context');
                        menuTrigger.classList.add('fa-solid', 'fa-fw', 'fa-ellipsis-vertical');
                        menuTrigger.addEventListener('click', ()=>{
                            menuTrigger.style.anchorName = '--stqrd--ctxAnchor';
                            const blocker = document.createElement('div'); {
                                blocker.classList.add('stqrd--blocker');
                                blocker.addEventListener('mousedown', (evt)=>{
                                    evt.stopPropagation();
                                });
                                blocker.addEventListener('pointerdown', (evt)=>{
                                    evt.stopPropagation();
                                });
                                blocker.addEventListener('touchstart', (evt)=>{
                                    evt.stopPropagation();
                                });
                                blocker.addEventListener('click', (evt)=>{
                                    evt.stopPropagation();
                                    blocker.remove();
                                    menuTrigger.style.anchorName = '';
                                });
                                const menu = document.createElement('div'); {
                                    menu.classList.add('stqrd--menu');
                                    const config = document.createElement('div'); {
                                        config.classList.add('stqrd--item');
                                        config.classList.add('stqrd--config');
                                        config.addEventListener('click', async(evt)=>{
                                            this.eventSource.emit(QrsItem.EVENT.QR_SET_SETTINGS, this, this.qrs);
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-cog');
                                            config.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Quick Reply Set configuration';
                                            config.append(txt);
                                        }
                                        menu.append(config);
                                    }
                                    const rename = document.createElement('div'); {
                                        rename.classList.add('stqrd--item');
                                        rename.classList.add('stqrd--rename');
                                        rename.addEventListener('click', async(evt)=>{
                                            //TODO cheeky monkey
                                            // const sel = /**@type {HTMLSelectElement}*/(document.querySelector('#world_editor_select'));
                                            // sel.value = /**@type {HTMLOptionElement[]}*/([...sel.children]).find(it=>it.textContent == name).value;
                                            // sel.dispatchEvent(new Event('change', { bubbles:true }));
                                            // await delay(500);
                                            // document.querySelector('#world_popup_name_button').click();
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-pencil');
                                            rename.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Rename Quick Reply Set';
                                            rename.append(txt);
                                        }
                                        menu.append(rename);
                                    }
                                    const exp = document.createElement('div'); {
                                        exp.classList.add('stqrd--item');
                                        exp.classList.add('stqrd--export');
                                        exp.addEventListener('click', async(evt)=>{
                                            //TODO cheeky monkey
                                            const sel = /**@type {HTMLSelectElement}*/(document.querySelector('#qr--set'));
                                            sel.value = qrs.name;
                                            sel.dispatchEvent(new Event('change', { bubbles:true }));
                                            await delay(500);
                                            document.querySelector('#qr--set-export').click();
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-file-export');
                                            exp.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Export Quick Reply Set';
                                            exp.append(txt);
                                        }
                                        menu.append(exp);
                                    }
                                    const dup = document.createElement('div'); {
                                        dup.classList.add('stqrd--item');
                                        dup.classList.add('stqrd--duplicate');
                                        dup.addEventListener('click', async(evt)=>{
                                            //TODO cheeky monkey
                                            const sel = /**@type {HTMLSelectElement}*/(document.querySelector('#qr--set'));
                                            sel.value = qrs.name;
                                            sel.dispatchEvent(new Event('change', { bubbles:true }));
                                            await delay(500);
                                            document.querySelector('#qr--set-duplicate').click();
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-paste');
                                            dup.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Duplicate Quick Reply Set';
                                            dup.append(txt);
                                        }
                                        menu.append(dup);
                                    }
                                    const del = document.createElement('div'); {
                                        del.classList.add('stqrd--item');
                                        del.classList.add('stqrd--delete');
                                        del.addEventListener('click', async(evt)=>{
                                            //TODO cheeky monkey
                                            const sel = /**@type {HTMLSelectElement}*/(document.querySelector('#qr--set'));
                                            sel.value = qrs.name;
                                            sel.dispatchEvent(new Event('change', { bubbles:true }));
                                            await delay(500);
                                            document.querySelector('#qr--set-delete').click();
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-trash-can');
                                            del.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Delete Quick Reply Set';
                                            del.append(txt);
                                        }
                                        menu.append(del);
                                    }
                                    blocker.append(menu);
                                }
                                document.body.append(blocker);
                            }
                        });
                        actions.append(menuTrigger);
                    }
                    const collapseToggle = document.createElement('div'); {
                        this.dom.collapseToggle = collapseToggle;
                        collapseToggle.classList.add('stqrd--action');
                        collapseToggle.classList.add('stqrd--collapseToggle');
                        collapseToggle.classList.add('fa-solid', 'fa-fw', 'fa-chevron-down');
                        collapseToggle.addEventListener('click', ()=>this.toggle());
                        actions.append(collapseToggle);
                    }
                    head.append(actions);
                }
                qrsItem.append(head);
            }
            const qrList = document.createElement('div'); {
                this.dom.qrList = qrList;
                qrList.classList.add('stqrd--qrList');
                qrList.classList.add('stqrd--isCollapsed');
                for (const qr of this.qrs.qrList) {
                    const qrItem = new QrItem(qr);
                    qrItem.eventSource.on(QrItem.EVENT.EDITOR, (src)=>this.eventSource.emit(QrsItem.EVENT.QR_EDITOR, this, src));
                    qrList.append(qrItem.render());
                }
                qrsItem.append(qrList);
            }
        }
        return this.dom.root;
    }


    toggle() {
        const is = this.dom.qrList.classList.toggle('stqrd--isCollapsed');
        this.dom.collapseToggle.classList[is ? 'remove' : 'add']('fa-chevron-up');
        this.dom.collapseToggle.classList[is ? 'add' : 'remove']('fa-chevron-down');
    }


    setActive(value) {
        this.dom.root.classList[value ? 'add' : 'remove']('stqrd--isActive');
    }

    handlePropChange({ property, oldValue, value }) {
        if (!this.dom.root) return;
        switch (property) {
            case 'name': {
                this.dom.title.textContent = value;
                break;
            }
        }
    }

    handleGlobalStateChange() {
        this.dom.global.classList[this.isActiveGlobal ? 'add' : 'remove']('stqrd--isActive');
    }
    handleChatStateChange() {
        this.dom.chat.classList[this.isActiveChat ? 'add' : 'remove']('stqrd--isActive');
    }
}
