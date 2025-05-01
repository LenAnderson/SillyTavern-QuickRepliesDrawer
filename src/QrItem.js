/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReply} QuickReply */

import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { Editor } from './Editor.js';
import { QR_EVENT } from './helper/hookQuickReply.js';


export class QrItem {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** open QR editor */
        EDITOR: 'editor',
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
    };



    /**
     * @param {QuickReply} qr
     */
    constructor(qr) {
        this.qr = qr;
        qr.eventSource.on(QR_EVENT.PROP_CHANGED, (qr, evt)=>this.handlePropChange(evt));
    }


    render() {
        if (!this.dom.qrItem) {
            const qrItem = document.createElement('div'); {
                this.dom.qrItem = qrItem;
                qrItem.classList.add('stqrd--qrItem');
                qrItem.addEventListener('click', ()=>this.eventSource.emit(QrItem.EVENT.EDITOR, this));
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
                        menuTrigger.classList.add('stqrd--action');
                        menuTrigger.classList.add('stqrd--context');
                        menuTrigger.classList.add('fa-solid', 'fa-fw', 'fa-ellipsis-vertical');
                        menuTrigger.addEventListener('click', (evt)=>{
                            evt.stopPropagation();
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
                                            this.qr.showEditor();
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
                                            toastr.warning('nope');
                                        });
                                        const i = document.createElement('i'); {
                                            i.classList.add('stqrd--icon');
                                            i.classList.add('fa-solid', 'fa-fw', 'fa-trash-can');
                                            del.append(i);
                                        }
                                        const txt = document.createElement('span'); {
                                            txt.classList.add('stqrd--label');
                                            txt.textContent = 'Delete Quick Reply';
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
                    qrItem.append(actions);
                }
            }
        }
        return this.dom.qrItem;
    }


    setActive(value) {
        this.dom.qrItem.classList[value ? 'add' : 'remove']('stqrd--isActive');
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
