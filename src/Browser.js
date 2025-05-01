import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { QuickReplySet } from '../../../quick-reply/src/QuickReplySet.js';
import { QrItem } from './QrItem.js';
import { QrsItem } from './QrsItem.js';

export class Browser {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** open QR editor */
        QR_EDITOR: 'qr_editor',
        /** open QR Set settings */
        QR_SET_SETTINGS: 'qr_set_settings',
    };




    /**@type {QrItem} */ currentQrItem;
    /**@type {QrsItem} */ currentQrsItem;


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        controlPanel: undefined,
        /**@type {HTMLElement} */
        filterPanel: undefined,
        /**@type {HTMLElement} */
        qrsList: undefined,
    };




    render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stqrd--browser');
                const controlPanel = document.createElement('div'); {
                    this.dom.controlPanel = controlPanel;
                    controlPanel.classList.add('stqrd--controlPanel');
                    const addQrs = document.createElement('div'); {
                        addQrs.classList.add('stqrd--action');
                        addQrs.classList.add('stqrd--addQrs');
                        addQrs.classList.add('menu_button');
                        addQrs.classList.add('fa-solid', 'fa-fw', 'fa-add');
                        controlPanel.append(addQrs);
                    }
                    const importQrs = document.createElement('div'); {
                        importQrs.classList.add('stqrd--action');
                        importQrs.classList.add('stqrd--importQrs');
                        importQrs.classList.add('menu_button');
                        importQrs.classList.add('fa-solid', 'fa-fw', 'fa-file-import');
                        controlPanel.append(importQrs);
                    }
                    root.append(controlPanel);
                }
                const filterPanel = document.createElement('div'); {
                    this.dom.filterPanel = filterPanel;
                    filterPanel.classList.add('stqrd--filterPanel');
                    const query = document.createElement('input'); {
                        query.classList.add('stqrd--qrsQuery');
                        query.classList.add('text_pole');
                        query.type = 'search';
                        query.placeholder = 'Search QRs and Sets';
                        filterPanel.append(query);
                    }
                    root.append(filterPanel);
                }
                const qrsList = document.createElement('div'); {
                    this.dom.qrsList = qrsList;
                    qrsList.classList.add('stqrd--qrsList');
                    qrsList.classList.add('stqrd--isLoading');
                    root.append(qrsList);
                }
            }
            this.load();
        }
        return this.dom.root;
    }

    async load() {
        for (const qrs of QuickReplySet.list.toSorted((a,b)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase()))) {
            const qrsItem = new QrsItem(qrs);
            qrsItem.eventSource.on(QrsItem.EVENT.QR_EDITOR, (src, qrItem)=>{
                this.eventSource.emit(Browser.EVENT.QR_EDITOR, src, qrItem);
                this.currentQrsItem?.setActive(false);
                this.currentQrItem?.setActive(false);
                this.currentQrItem = qrItem;
                this.currentQrItem?.setActive(true);
            });
            qrsItem.eventSource.on(QrsItem.EVENT.QR_SET_SETTINGS, (src, qrs)=>{
                this.eventSource.emit(Browser.EVENT.QR_SET_SETTINGS, qrs);
                this.currentQrItem?.setActive(false);
                this.currentQrsItem?.setActive(false);
                this.currentQrsItem = src;
                this.currentQrsItem?.setActive(true);
            });
            this.dom.qrsList.append(qrsItem.render());
        }
        this.dom.qrsList.classList.remove('stqrd--isLoading');
    }
}
