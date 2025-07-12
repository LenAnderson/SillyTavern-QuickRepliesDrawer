/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReply} QuickReply */

import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { Popup, POPUP_RESULT } from '../../../../popup.js';
import { Editor } from './Editor.js';
import { QR_EVENT } from './helper/hookQuickReply.js';


export class QrItem {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** QR has been deleted */
        DELETE: 'delete',
        /** open QR editor */
        EDITOR: 'editor',
        /** started dragging this item */
        DRAG_START: 'drag_start',
        /** dropped a QR onto this item */
        DROP: 'drop',
    };




    /**@type {QuickReply} */ qr;


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        qrItem: undefined,
        /**@type {HTMLElement} */
        icon: undefined,
        /**@type {HTMLElement} */
        title: undefined,
        /**@type {HTMLElement} */
        menuTrigger: undefined,
    };



    /**
     * @param {QuickReply} qr
     */
    constructor(qr) {
        this.qr = qr;
        qr.eventSource.on(QR_EVENT.PROP_CHANGED, (qr, evt)=>this.handlePropChange(evt));
        qr.eventSource.on(QR_EVENT.EDITOR, (qr, options)=>this.openEditor(options));
        qr.eventSource.on(QR_EVENT.DELETE, (qr)=>this.delete());
    }


    render() {
        if (!this.dom.qrItem) {
            const qrItem = document.createElement('div'); {
                this.dom.qrItem = qrItem;
                qrItem.classList.add('stqrd--qrItem');
                qrItem.draggable = true;
                qrItem.addEventListener('click', ()=>this.openEditor());
                qrItem.addEventListener('contextmenu', (evt)=>this.showContextMenu(evt, true));
                qrItem.addEventListener('dragstart', (evt)=>{
                    evt.dataTransfer.setData('text/plain', qrItem.textContent);
                    evt.dataTransfer.effectAllowed = 'copyMove';
                    this.eventSource.emit(QrItem.EVENT.DRAG_START, this);
                });
                qrItem.addEventListener('dragover', (evt)=>{
                    evt.preventDefault();
                    qrItem.classList.add('stqrd--isDragTarget');
                    evt.dataTransfer.dropEffect = evt.ctrlKey ? 'copy' : 'move';
                });
                qrItem.addEventListener('dragleave', (evt)=>{
                    qrItem.classList.remove('stqrd--isDragTarget');
                });
                qrItem.addEventListener('drop', (evt)=>{
                    qrItem.classList.remove('stqrd--isDragTarget');
                    evt.dataTransfer.dropEffect = evt.ctrlKey ? 'copy' : 'move';
                    this.eventSource.emit(QrItem.EVENT.DROP, evt, this);
                });
                const icon = document.createElement('div'); {
                    this.dom.icon = icon;
                    icon.classList.add('stqrd--icon');
                    icon.classList.add('fa-solid', 'fa-fw');
                    if (this.qr.icon) icon.classList.add(this.qr.icon);
                    qrItem.append(icon);
                }
                const title = document.createElement('div'); {
                    this.dom.title = title;
                    title.classList.add('stqrd--title');
                    title.textContent = this.qr.label;
                    qrItem.append(title);
                }
                const actions = document.createElement('div'); {
                    actions.classList.add('stqrd--actions');
                    const menuTrigger = document.createElement('div'); {
                        this.dom.menuTrigger = menuTrigger;
                        menuTrigger.classList.add('stqrd--action');
                        menuTrigger.classList.add('stqrd--context');
                        menuTrigger.classList.add('fa-solid', 'fa-fw', 'fa-ellipsis-vertical');
                        menuTrigger.addEventListener('click', (evt)=>this.showContextMenu(evt));
                        actions.append(menuTrigger);
                    }
                    qrItem.append(actions);
                }
            }
        }
        return this.dom.qrItem;
    }

    unrender() {
        this.dom.qrItem.remove();
    }
    hide() {
        this.dom.qrItem?.classList.add('stqrd--isHidden');
    }
    unhide() {
        this.dom.qrItem?.classList.remove('stqrd--isHidden');
    }


    openEditor(options) {
        this.eventSource.emit(QrItem.EVENT.EDITOR, this, options);
    }
    setActive(value) {
        this.dom.qrItem.classList[value ? 'add' : 'remove']('stqrd--isActive');
    }

    delete() {
        this.unrender();
        this.eventSource.emit(QrItem.EVENT.DELETE, this);
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
                        this.qr.showEditor(true);
                    });
                    const i = document.createElement('i'); {
                        i.classList.add('stqrd--icon');
                        i.classList.add('fa-solid', 'fa-fw', 'fa-pen-to-square');
                        config.append(i);
                    }
                    const txt = document.createElement('span'); {
                        txt.classList.add('stqrd--label');
                        txt.textContent = 'Open vanilla editor';
                        config.append(txt);
                    }
                    menu.append(config);
                }
                const del = document.createElement('div'); {
                    del.classList.add('stqrd--item');
                    del.classList.add('stqrd--delete');
                    del.addEventListener('click', async(evt)=>{
                        const result = await Popup.show.confirm(
                            'Remove Quick Reply',
                            'Are you sure you want to remove this Quick Reply?',
                        );
                        if (result != POPUP_RESULT.AFFIRMATIVE) {
                            return;
                        }
                        this.qr.delete();
                    });
                    const i = document.createElement('i'); {
                        i.classList.add('stqrd--icon');
                        i.classList.add('fa-solid', 'fa-fw', 'fa-trash-can');
                        del.append(i);
                    }
                    const txt = document.createElement('span'); {
                        txt.classList.add('stqrd--label');
                        txt.textContent = 'Delete Quick Reply...';
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
        if (!this.dom.qrItem) return;
        switch (property) {
            case 'icon': {
                this.dom.icon.classList.remove([...this.dom.icon.classList].find(it=>it.startsWith('fa-') && !['fa-solid', 'fa-fw'].includes(it)));
                if (value?.length) {
                    this.dom.icon.classList.add(value);
                }
                break;
            }
            case 'label': {
                this.dom.title.textContent = value;
                break;
            }
            // rest of props -> editor
        }
    }
}
