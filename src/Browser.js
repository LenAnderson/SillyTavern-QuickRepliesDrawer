import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { quickReplyApi } from '../../../quick-reply/index.js';
import { QuickReplySet } from '../../../quick-reply/src/QuickReplySet.js';
import { QRS_STATIC_EVENT } from './helper/hookQuickReply.js';
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




    /**@type {QrsItem[]} */ qrsItemList = [];

    /**@type {QrsItem} */ currentQrsItem;
    /**@type {QrItem} */ currentQrItem;

    currentDrag = {
        /**@type {QrsItem} */
        qrs: undefined,
        /**@type {QrItem} */
        qr: undefined,
    };

    filter = {
        query: '',
        options: {
            'qrsItem.isActive': false,
            'qrs.name': false,
            'qr.label': true,
            'qr.title': false,
            'qr.message': false,
        },
    };


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




    constructor() {
        QuickReplySet.staticEventSource.on(QRS_STATIC_EVENT.CREATE, (qrs)=>this.addQrs(qrs));
    }




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
                        addQrs.title = 'Create new Quick Reply Set...';
                        addQrs.addEventListener('click', ()=>{
                            quickReplyApi.settingsUi.addQrSet();
                        });
                        controlPanel.append(addQrs);
                    }
                    const importQrs = document.createElement('div'); {
                        importQrs.classList.add('stqrd--action');
                        importQrs.classList.add('stqrd--importQrs');
                        importQrs.classList.add('menu_button');
                        importQrs.classList.add('fa-solid', 'fa-fw', 'fa-file-import');
                        importQrs.title = 'Import Quick Reply Set...';
                        importQrs.addEventListener('click', ()=>{
                            //TODO cheeky monkey
                            document.querySelector('#qr--set-importFile').click();
                        });
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
                        query.addEventListener('input', ()=>{
                            this.updateFilter('query', query.value.trim());
                        });
                        filterPanel.append(query);
                    }
                    const toggleWrap = document.createElement('div'); {
                        toggleWrap.classList.add('stqrd--toggles');
                        const toggles = [
                            { label:'Search Quick Reply Sets (names)', icon:'layer-group', value:'qrs.name' },
                            { label:'Search Quick Replies (labels)', icon:'file-code', value:'qr.label' },
                            { label:'Search Quick Reply contents (message / code)', icon:'align-left', value:'qr.message' },
                            { label:'Only show active Quick Reply Sets (global or chat bound)', icon:'check-to-slot', value:'qrsItem.isActive' },
                        ];
                        for (const { label, icon, value } of toggles) {
                            const toggle = document.createElement('div'); {
                                toggle.classList.add('stqrd--toggle');
                                toggle.classList.add('fa-solid', 'fa-fw', `fa-${icon}`);
                                if (this.filter.options[value]) toggle.classList.add('stqrd--isActive');
                                toggle.title = label;
                                toggle.addEventListener('click', ()=>{
                                    const is = toggle.classList.toggle('stqrd--isActive');
                                    this.updateFilter(value, is);
                                });
                                toggleWrap.append(toggle);
                            }
                        }
                        filterPanel.append(toggleWrap);
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

    addQrs(qrs) {
        const qrsItem = new QrsItem(qrs);
        qrsItem.eventSource.on(QrsItem.EVENT.RENAME, (qrsItem)=>{
            const idx = this.qrsItemList.indexOf(qrsItem);
            if (idx < 0) return;
            this.qrsItemList.splice(idx, 1);
            qrsItem.unrender();
            const qrs = qrsItem.qrs;
            const before = this.qrsItemList.find(it=>it.qrs.name.toLowerCase().localeCompare(qrs.name.toLowerCase()) == 1);
            if (before) {
                this.qrsItemList.splice(this.qrsItemList.indexOf(before), 0, qrsItem);
                before.dom.root.insertAdjacentElement('beforebegin', qrsItem.render());
            } else {
                this.qrsItemList.push(qrsItem);
                this.dom.qrsList.append(qrsItem.render());
            }
        });
        qrsItem.eventSource.on(QrsItem.EVENT.DELETE, (src)=>{
            const idx = this.qrsItemList.indexOf(src);
            if (idx > -1) {
                this.qrsItemList.splice(idx, 1);
            }
        });
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
        qrsItem.eventSource.on(QrsItem.EVENT.QR_DRAG_START, (src, qrItem)=>{
            document.title = `drag: ${src.qrs.name} > ${qrItem.qr.label}`;
            this.currentDrag.qrs = src;
            this.currentDrag.qr = qrItem;
        });
        qrsItem.eventSource.on(QrsItem.EVENT.QR_DROP, (/**@type {DragEvent}*/evt, /**@type {QrsItem}*/dstQrsItem, /**@type {QrItem}*/dstQrItem)=>{
            const srcQrsItem = this.currentDrag.qrs;
            const srcQrItem = this.currentDrag.qr;
            const srcQrs = this.currentDrag.qrs.qrs;
            const srcQr = this.currentDrag.qr.qr;

            const dstQrs = dstQrsItem.qrs;
            const dstQr = dstQrItem?.qr;

            this.currentDrag.qrs = null;
            this.currentDrag.qr = null;

            let dstIdx = dstQr ? dstQrs.qrList.indexOf(dstQr) + 1 : 0;
            let newQr;

            if (srcQrs == dstQrs) {
                if (evt.dataTransfer.dropEffect == 'copy') {
                    dstQrs.addQuickReply(srcQr.toJSON());
                    newQr = dstQrs.qrList.at(-1);
                } else {
                    newQr = srcQr;
                }
            } else {
                dstQrs.addQuickReply(srcQr.toJSON());
                newQr = dstQrs.qrList.at(-1);
                if (evt.dataTransfer.dropEffect == 'move') {
                    srcQr.delete();
                    srcQrs.save();
                }
            }
            let curIdx = dstQrs.qrList.indexOf(newQr);
            if (curIdx != dstIdx) {
                dstQrs.qrList.splice(curIdx, 1);
                if (curIdx < dstIdx) dstIdx--;
                dstQrs.qrList.splice(dstIdx, 0, newQr);
            }
            dstQrs.save();
            dstQrsItem.addQr(newQr, dstIdx);
        });

        const before = this.qrsItemList.find(it=>it.qrs.name.toLowerCase().localeCompare(qrs.name.toLowerCase()) == 1);
        if (before) {
            this.qrsItemList.splice(this.qrsItemList.indexOf(before), 0, qrsItem);
            before.dom.root.insertAdjacentElement('beforebegin', qrsItem.render());
        } else {
            this.qrsItemList.push(qrsItem);
            this.dom.qrsList.append(qrsItem.render());
        }
    }

    async load() {
        for (const qrs of QuickReplySet.list.toSorted((a,b)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase()))) {
            this.addQrs(qrs);
        }
        this.dom.qrsList.classList.remove('stqrd--isLoading');
    }


    updateFilter(target, value) {
        switch (target) {
            case 'query': {
                this.filter.query = value;
                break;
            }
            default: {
                this.filter.options[target] = value;
                break;
            }
        }

        const onlyActive = this.filter.options['qrsItem.isActive'];
        let applyFilter = true;
        /**@type {(()=>void)[]} */
        let filterList;
        const query = this.filter.query.toLowerCase();
        if (!query.length && !onlyActive) {
            applyFilter = false;
        } else {
            filterList = Object.entries(this.filter.options)
                .filter(([target, include])=>include)
                .map(([target])=>()=>{
                    const [obj, prop] = target.split('.');
                    switch (obj) {
                        case 'qrs': {
                            qrsList.push(...this.qrsItemList.filter((qrsItem)=>qrsItem.qrs[prop]?.toString().toLowerCase().includes(query.toLowerCase())));
                            break;
                        }
                        case 'qr': {
                            qrList.push(
                                ...this.qrsItemList
                                    .map((qrsItem)=>({
                                        qrsItem,
                                        qrItemList: qrsItem.qrItemList.filter((qrItem)=>qrItem.qr[prop]?.toLowerCase().includes(query))
                                    }))
                                    .filter(it=>it.qrItemList.length > 0)
                                ,
                            );
                            break;
                        }
                    }
                })
            ;
            applyFilter = filterList.length > 0 || onlyActive;
        }
        if (!applyFilter) {
            for (const qrsItem of this.qrsItemList) {
                qrsItem.unhide();
                for (const qrItem of qrsItem.qrItemList) {
                    qrItem.unhide();
                }
            }
            return;
        }

        let qrsList = [];
        let qrList = [];
        for (const filter of filterList) {
            filter();
        }
        qrsList = qrsList.filter((it,idx,list)=>list.indexOf(it) == idx);
        for (const qrsItem of this.qrsItemList) {
            if (!query.length) {
                if (onlyActive) {
                    if (qrsItem.isActive) {
                        qrsItem.unhide();
                        for (const qrItem of qrsItem.qrItemList) {
                            qrItem.unhide();
                        }
                    } else {
                        qrsItem.hide();
                    }
                } else {
                    qrsItem.unhide();
                }
                continue;
            }
            if (qrsList.includes(qrsItem) && (!onlyActive || qrsItem.isActive)) {
                qrsItem.unhide();
                for (const qrItem of qrsItem.qrItemList) {
                    qrItem.unhide();
                }
                continue;
            }
            const matches = qrList.filter(it=>it.qrsItem == qrsItem).map(it=>it.qrItemList).flat();
            if (matches.length && (!onlyActive || qrsItem.isActive)) {
                // qrsItem.open();
                qrsItem.unhide();
                for (const qrItem of qrsItem.qrItemList) {
                    if (matches.includes(qrItem)) {
                        qrItem.unhide();
                    } else {
                        qrItem.hide();
                    }
                }
            } else {
                qrsItem.hide();
            }
        }
    }
}
