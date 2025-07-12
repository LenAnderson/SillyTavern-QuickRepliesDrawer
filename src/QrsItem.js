/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReplySet} QuickReplySet */

import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { event_types, eventSource as globalEventSource } from '../../../../../script.js';
import { delay } from '../../../../utils.js';
import { quickReplyApi } from '../../../quick-reply/index.js';
import { QRS_EVENT } from './helper/hookQuickReply.js';
import { QrItem } from './QrItem.js';

export class QrsItem {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** QRS has been renamed */
        RENAME: 'rename',
        /** QRS has been deleted */
        DELETE: 'delete',
        /** open QR editor */
        QR_EDITOR: 'qr_editor',
        /** open QR Set settings */
        QR_SET_SETTINGS: 'qr_set_settings',
        /** started dragging a QR */
        QR_DRAG_START: 'qr_drag_start',
        /** QR has been dropped onto / into this QrsItem */
        QR_DROP: 'qr_drop',
    };




    /**@type {QuickReplySet} */ qrs;

    /**@type {QrItem[]} */ qrItemList = [];


    get isActiveGlobal() {
        return quickReplyApi.listGlobalSets().includes(this.qrs.name);
    }
    get isActiveChat() {
        return quickReplyApi.listChatSets().includes(this.qrs.name);
    }
    get isActive() {
        return this.isActiveGlobal || this.isActiveChat;
    }

    get isOpen() {
        return !this.dom.qrList.classList.contains('stqrd--isCollapsed');
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
        menuTrigger: undefined,
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
        qrs.eventSource.on(QRS_EVENT.DELETE, (qrs, evt)=>{
            this.unrender();
            this.eventSource.emit(QrsItem.EVENT.DELETE, this);
        });
        qrs.eventSource.on(QRS_EVENT.PROP_CHANGED, (qrs, evt)=>this.handlePropChange(evt));
        qrs.eventSource.on(QRS_EVENT.GLOBAL_STATE, (qrs)=>this.handleGlobalStateChange());
        qrs.eventSource.on(QRS_EVENT.CHAT_STATE, (qrs)=>this.handleChatStateChange());
        qrs.eventSource.on(QRS_EVENT.QR_CREATE, (qrs, { qr })=>this.addQr(qr));
        globalEventSource.on(event_types.CHAT_CHANGED, ()=>this.handleChatStateChange());
        globalEventSource.once(event_types.APP_READY, ()=>this.handleChatStateChange());
    }




    render() {
        const qrsItem = document.createElement('div'); {
            this.dom.root = qrsItem;
            qrsItem.classList.add('stqrd--qrsItem');
            qrsItem.addEventListener('contextmenu', (evt)=>this.showContextMenu(evt, true));
            const head = document.createElement('div'); {
                head.classList.add('stqrd--head');
                let dragTargetTimer;
                head.addEventListener('dragover', (evt)=>{
                    evt.preventDefault();
                    head.classList.add('stqrd--isDragTarget');
                    evt.dataTransfer.dropEffect = evt.ctrlKey ? 'copy' : 'move';
                    if (!this.isOpen && !dragTargetTimer) {
                        dragTargetTimer = window.setTimeout(()=>this.open(), 1000);
                    }
                });
                head.addEventListener('dragleave', (evt)=>{
                    head.classList.remove('stqrd--isDragTarget');
                    if (dragTargetTimer) {
                        window.clearTimeout(dragTargetTimer);
                        dragTargetTimer = null;
                    }
                });
                head.addEventListener('drop', (evt)=>{
                    head.classList.remove('stqrd--isDragTarget');
                    evt.dataTransfer.dropEffect = evt.ctrlKey ? 'copy' : 'move';
                    if (dragTargetTimer) {
                        window.clearTimeout(dragTargetTimer);
                        dragTargetTimer = null;
                    }
                    this.open();
                    this.eventSource.emit(QrsItem.EVENT.QR_DROP, evt, this);
                });
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
                            if (quickReplyApi.settings.chatConfig) {
                                const is = this.isActiveChat;
                                if (!is) quickReplyApi.addChatSet(this.qrs.name);
                                else quickReplyApi.removeChatSet(this.qrs.name);
                                chat.classList[is ? 'remove' : 'add']('stqrd--isActive');
                            }
                        });
                        actions.append(chat);
                    }
                    const add = document.createElement('div'); {
                        this.dom.add = add;
                        add.classList.add('stqrd--action');
                        add.classList.add('stqrd--add');
                        if (this.isActiveChat) add.classList.add('stqrd--isActive');
                        add.classList.add('fa-solid', 'fa-fw', 'fa-plus');
                        add.addEventListener('click', ()=>{
                            this.qrs.addQuickReply();
                            const qrItem = this.addQr(this.qrs.qrList.at(-1));
                            this.eventSource.emit(QrsItem.EVENT.QR_EDITOR, this, qrItem);
                        });
                        actions.append(add);
                    }
                    const menuTrigger = document.createElement('div'); {
                        this.dom.menuTrigger = menuTrigger;
                        menuTrigger.classList.add('stqrd--action');
                        menuTrigger.classList.add('stqrd--context');
                        menuTrigger.classList.add('fa-solid', 'fa-fw', 'fa-ellipsis-vertical');
                        menuTrigger.addEventListener('click', (evt)=>this.showContextMenu(evt));
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
                    this.addQr(qr);
                }
                qrsItem.append(qrList);
            }
        }
        return this.dom.root;
    }
    unrender() {
        this.dom.root?.remove();
    }
    hide() {
        this.dom.root?.classList.add('stqrd--isHidden');
    }
    unhide() {
        this.dom.root?.classList.remove('stqrd--isHidden');
    }

    addQr(qr, idx = null) {
        let qrItem = this.qrItemList.find(it=>it.qr == qr);
        if (!qrItem) {
            qrItem = new QrItem(qr);
            this.qrItemList.push(qrItem);
            qrItem.eventSource.on(QrItem.EVENT.EDITOR, (src, options)=>this.eventSource.emit(QrsItem.EVENT.QR_EDITOR, this, src, options));
            qrItem.eventSource.on(QrItem.EVENT.DELETE, (src)=>{
                const idx = this.qrItemList.indexOf(src);
                if (idx > -1) {
                    this.qrItemList.splice(idx, 1);
                }
            });
            qrItem.eventSource.on(QrItem.EVENT.DRAG_START, (src)=>{
                this.eventSource.emit(QrsItem.EVENT.QR_DRAG_START, this, src);
            });
            qrItem.eventSource.on(QrItem.EVENT.DROP, (evt, src)=>{
                this.eventSource.emit(QrsItem.EVENT.QR_DROP, evt, this, src);
            });
        }
        if (idx === null || idx >= this.qrItemList.length - 1) {
            this.dom.qrList.append(qrItem.render());
        } else if (idx == 0) {
            this.dom.qrList.prepend(qrItem.render());
        } else {
            this.dom.qrList.children[idx].insertAdjacentElement('beforebegin', qrItem.render());
        }
        return qrItem;
    }


    toggle() {
        const is = this.dom.qrList.classList.toggle('stqrd--isCollapsed');
        this.dom.collapseToggle.classList[is ? 'remove' : 'add']('fa-chevron-up');
        this.dom.collapseToggle.classList[is ? 'add' : 'remove']('fa-chevron-down');
    }

    open() {
        if (!this.isOpen) {
            this.toggle();
        }
    }
    close() {
        if (this.isOpen) {
            this.toggle();
        }
    }


    setActive(value) {
        this.dom.root.classList[value ? 'add' : 'remove']('stqrd--isActive');
    }

    showContextMenu(evt, atCursor = false) {
        evt.stopPropagation();
        evt.preventDefault();
        this.dom.menuTrigger.style.anchorName = '--stqrd--ctxAnchor';
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
                this.dom.menuTrigger.style.anchorName = '';
            });
            const menu = document.createElement('div'); {
                menu.classList.add('stqrd--menu');
                if (atCursor) {
                    const rect = this.dom.menuTrigger.getBoundingClientRect();
                    menu.style.setProperty('--offset', `${evt.x - rect.right}`);
                }
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
                        const sel = /**@type {HTMLSelectElement}*/(document.querySelector('#qr--set'));
                        sel.value = this.qrs.name;
                        sel.dispatchEvent(new Event('change', { bubbles:true }));
                        await delay(500);
                        document.querySelector('#qr--set-rename').click();
                    });
                    const i = document.createElement('i'); {
                        i.classList.add('stqrd--icon');
                        i.classList.add('fa-solid', 'fa-fw', 'fa-pencil');
                        rename.append(i);
                    }
                    const txt = document.createElement('span'); {
                        txt.classList.add('stqrd--label');
                        txt.textContent = 'Rename Quick Reply Set...';
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
                        sel.value = this.qrs.name;
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
                        sel.value = this.qrs.name;
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
                        txt.textContent = 'Duplicate Quick Reply Set...';
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
                        sel.value = this.qrs.name;
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
                        txt.textContent = 'Delete Quick Reply Set...';
                        del.append(txt);
                    }
                    menu.append(del);
                }
                blocker.append(menu);
            }
            document.body.append(blocker);
        }
    }

    handlePropChange({ property, oldValue, value }) {
        if (!this.dom.root) return;
        switch (property) {
            case 'name': {
                this.dom.title.textContent = value;
                this.eventSource.emit(QrsItem.EVENT.RENAME, this);
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
