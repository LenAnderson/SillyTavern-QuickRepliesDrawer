import { debounce } from '../../../../utils.js';
import { Browser } from './Browser.js';
import { Editor } from './Editor.js';

/**@typedef {import('../../../quick-reply/src/QuickReply.js').QuickReply} QuickReply */
/**@typedef {import('../../../quick-reply/src/QuickReplySet.js').QuickReplySet} QuickReplySet */


export class QuickRepliesDrawer {
    /**@type {Browser} */ browser;
    /**@type {Editor} */ editor;


    dom = {
        /**@type {HTMLElement} */
        drawer: undefined,
        /**@type {HTMLElement} */
        toggle: undefined,
        /**@type {HTMLElement} */
        icon: undefined,
        /**@type {HTMLElement} */
        panel: undefined,
        /**@type {HTMLElement} */
        body: undefined,
        qrSettings: {
            /**@type {HTMLElement} */
            root: undefined,
            /**@type {HTMLSelectElement} */
            qrs: undefined,
            /**@type {HTMLElement} */
            qrsCrumb: undefined,
        },
    };




    inject() {
        this.render();
        const anchor = document.querySelector('#extensions-settings-button');
        anchor.insertAdjacentElement('afterend', this.dom.drawer);
        $(this.dom.toggle).on('click', $._data(anchor.querySelector('.drawer-toggle'), 'events').click[0].handler);
    }

    render() {
        if (!this.dom.drawer) {
            const drawer = document.createElement('div'); {
                this.dom.drawer = drawer;
                drawer.classList.add('drawer');
                const toggle = document.createElement('div'); {
                    this.dom.toggle = toggle;
                    toggle.classList.add('drawer-toggle');
                    const icon = document.createElement('div'); {
                        this.dom.icon = icon;
                        icon.classList.add('drawer-icon', 'closedIcon');
                        icon.classList.add('fa-solid', 'fa-fw', 'fa-terminal');
                        icon.title = 'Quick Replies (drwr-v2)';
                        toggle.append(icon);
                    }
                    drawer.append(toggle);
                }
                const content = document.createElement('div'); {
                    content.id = 'stqrd--drawer-v2';
                    content.classList.add('drawer-content');
                    const layout = document.createElement('div'); {
                        layout.classList.add('stqrd--layout');
                        layout.classList.add('stqrd--showBrowser');
                        const panel = document.createElement('div'); {
                            this.dom.panel = panel;
                            panel.classList.add('stqrd--panel');
                            panel.style.setProperty('--width', localStorage.getItem('stqrd--panelWidth'));
                            const headWrap = document.createElement('div'); {
                                headWrap.classList.add('flex-container', 'alignItemsBaseline');
                                const title = document.createElement('h3'); {
                                    title.classList.add('stqrd--drawerTitle');
                                    title.classList.add('margin0', 'flex1', 'flex-container', 'alignItemsBaseline');
                                    title.textContent = 'Quick Replies (drwr-v2)';
                                    headWrap.append(title);
                                }
                                panel.append(headWrap);
                            }
                            const browser = new Browser(); {
                                this.browser = browser;
                                browser.eventSource.on(Browser.EVENT.QR_EDITOR, (qrsItem, qrItem)=>this.openEditor(qrItem.qr));
                                browser.eventSource.on(Browser.EVENT.QR_SET_SETTINGS, (qrs)=>this.openQrsSettings(qrs));
                                panel.append(browser.render());
                            }
                            layout.append(panel);
                        }
                        const resizeHandle = document.createElement('div'); {
                            resizeHandle.classList.add('stqrd--resizeHandle');
                            let isResizing = false;
                            resizeHandle.addEventListener('pointerdown', (evt)=>{
                                if (isResizing) return;
                                isResizing = true;
                                evt.preventDefault();
                                let resizeStart = evt.x;
                                let wStart = parseInt(
                                    this.dom.panel.style.getPropertyValue('--width')
                                    || window.getComputedStyle(this.dom.panel).getPropertyValue('--width')
                                    || '200'
                                    ,
                                );
                                let wEnd;
                                const dragListener = /**@type {(evt:PointerEvent)=>any} */(debounce((evt)=>{
                                    evt.preventDefault();
                                    wEnd = wStart + evt.x - resizeStart;
                                    this.dom.panel.style.setProperty('--width', `${wEnd}`);
                                }, 5));
                                window.addEventListener('pointerup', ()=>{
                                    window.removeEventListener('pointermove', dragListener);
                                    isResizing = false;
                                    if (!wEnd || wEnd <= 0) {
                                        const is = layout.classList.toggle('stqrd--showBrowser');
                                        if (!is) {
                                            this.dom.panel.style.setProperty('--width', '0');
                                        } else {
                                            this.dom.panel.style.setProperty('--width', localStorage.getItem('stqrd--panelWidth'));
                                        }
                                    } else if (wEnd > 0) {
                                        layout.classList.add('stqrd--showBrowser');
                                        localStorage.setItem('stqrd--panelWidth', wEnd.toString());
                                    }
                                }, { once:true });
                                window.addEventListener('pointermove', dragListener);
                            });
                            layout.append(resizeHandle);
                        }
                        const body = document.createElement('div'); {
                            this.dom.body = body;
                            body.classList.add('stqrd--body');
                            const qrSettingsContainer = /**@type {HTMLElement}*/(document.querySelector('#qr--settings')); {
                                /**@type {(HTMLElement&{color:string})[]}*/([...qrSettingsContainer.querySelectorAll('toolcool-color-picker')]).forEach(it=>it.setAttribute('color', it.color));
                                this.dom.qrSettings.root = qrSettingsContainer;
                                const qrs = /**@type {HTMLSelectElement}*/(document.querySelector('#qr--set')); {
                                    this.dom.qrSettings.qrs = qrs;
                                    const head = document.createElement('div'); {
                                        head.classList.add('stqrd--head');
                                        const crumbs = document.createElement('div'); {
                                            crumbs.classList.add('stqrd--crumbs');
                                            { // QRS
                                                const crumb = document.createElement('div'); {
                                                    crumb.classList.add('stqrd--crumb');
                                                    const icon = document.createElement('div'); {
                                                        icon.classList.add('stqrd--icon');
                                                        icon.classList.add('fa-solid', 'fa-layer-group');
                                                        crumb.append(icon);
                                                    }
                                                    const title = document.createElement('div'); {
                                                        this.dom.qrSettings.qrsCrumb = title;
                                                        title.classList.add('stqrd--title');
                                                        crumb.append(title);
                                                    }
                                                    crumbs.append(crumb);
                                                }
                                            }
                                            head.append(crumbs);
                                        }
                                        const actions = document.createElement('div'); {
                                            actions.classList.add('stqrd--actions');
                                            const close = document.createElement('div'); {
                                                close.classList.add('stqrd--action');
                                                close.classList.add('stqrd--close');
                                                close.classList.add('fa-solid', 'fa-fw', 'fa-times');
                                                close.title = 'Close editor';
                                                close.addEventListener('click', ()=>this.closeQrsSettings());
                                                actions.append(close);
                                            }
                                            head.append(actions);
                                        }
                                        qrSettingsContainer.prepend(head);
                                    }
                                }
                                body.append(qrSettingsContainer);
                            }
                            layout.append(body);
                        }
                        content.append(layout);
                    }
                    drawer.append(content);
                }
            }
        }
        return this.dom.drawer;
    }


    /**
     * @param {QuickReply} qr
     */
    async openEditor(qr) {
        this.closeQrsSettings();
        this.closeEditor();
        const editor = new Editor(qr);
        this.editor = editor;
        editor.eventSource.on(Editor.EVENT.CLOSE, ()=>{
            // TODO notify Browser / QRS / QR about active state
            this.browser.currentQrItem.setActive(false);
        });
        editor.eventSource.on(Editor.EVENT.POPOUT, async()=>{
            document.body.append(await editor.render());
            this.close();
        });
        editor.eventSource.on(Editor.EVENT.POPIN, async()=>{
            this.dom.body.append(await editor.render());
            this.open();
        });
        this.dom.body.append(await editor.render());
    }
    closeEditor() {
        if (this.editor) {
            this.editor.close();
            this.editor = null;
        }
    }

    /**
     * @param {QuickReplySet} qrs
     */
    openQrsSettings(qrs) {
        const sel = this.dom.qrSettings.qrs;
        sel.value = qrs.name;
        sel.dispatchEvent(new Event('change', { bubbles:true }));
        this.closeEditor();
        this.dom.qrSettings.qrsCrumb.textContent = qrs.name;
        this.dom.body.dataset.content = 'qrs';
    }
    closeQrsSettings() {
        this.dom.body.dataset.content = null;
        this.browser.currentQrsItem?.setActive(false);
    }


    open() {
        if (this.dom.icon.classList.contains('closedIcon')) {
            this.dom.toggle.click();
        }
    }
    close() {
        if (!this.dom.icon.classList.contains('closedIcon')) {
            this.dom.toggle.click();
        }
    }
}
