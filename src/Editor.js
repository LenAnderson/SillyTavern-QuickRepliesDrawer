import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { setSlashCommandAutoComplete } from '../../../../slash-commands.js';
import { SlashCommandAbortController } from '../../../../slash-commands/SlashCommandAbortController.js';
import { SlashCommandDebugController } from '../../../../slash-commands/SlashCommandDebugController.js';
import { SlashCommandParserError } from '../../../../slash-commands/SlashCommandParserError.js';
import { accountStorage } from '../../../../util/AccountStorage.js';
import { debounce, showFontAwesomePicker } from '../../../../utils.js';
import { QuickReplySet } from '../../../quick-reply/src/QuickReplySet.js';
import { defaultCommands } from '../lib/prism-code-editor/extensions/commands.js';
import { indentGuides } from '../lib/prism-code-editor/extensions/guides.js';
import { highlightBracketPairs } from '../lib/prism-code-editor/extensions/matchBrackets/highlight.js';
import { matchBrackets } from '../lib/prism-code-editor/extensions/matchBrackets/index.js';
import { createEditor, languageMap } from '../lib/prism-code-editor/index.js';
import { languages } from '../lib/prism-code-editor/prism/index.js';
import { getCheckboxList } from './helper/autoExecHelper.js';
import { QR_EVENT } from './helper/hookQuickReply.js';
import { tryParse, tryParseAndFormat } from './lib/json.js';
import { JsonView } from './lib/JsonView/JsonView.js';
import { SlashCommandDebugger } from './SlashCommandDebugger.js';

/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReply} QuickReply */
/**@typedef {import('../lib/prism-code-editor/types.js').PrismEditor} PrismEditor */


export class Editor {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** close QR editor */
        CLOSE: 'close',
        /** popout QR editor into side panel */
        POPOUT: 'popout',
        /** pop QR editor from side panel back into drawer */
        POPIN: 'POPIN',
    };




    /**@type {QuickReply} */ qr;
    /**@type {QuickReplySet} */ qrs;

    /**@type {PrismEditor} */ editor;
    /**@type {SlashCommandDebugger} */ scriptDebugger;

    /**@type {boolean} */ isDebugging = false;


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        crumbs: {
            /**@type {HTMLElement} */
            qrs: undefined,
            /**@type {HTMLElement} */
            qr: undefined,
        },
        /**@type {HTMLElement} */
        body: undefined,
        options: {
            /**@type {HTMLElement} */
            icon: undefined,
            /**@type {HTMLInputElement} */
            label: undefined,
            /**@type {HTMLInputElement} */
            showLabel: undefined,
            /**@type {HTMLInputElement} */
            title: undefined,
            /**@type {HTMLInputElement} */
            automationId: undefined,
        },
        /**@type {HTMLElement} */
        runResult: undefined,
        /**@type {HTMLElement} */
        runError: undefined,
        /**@type {{[id:string]:{ toggle:HTMLElement, checkbox:HTMLInputElement}}} */
        auto: {},
        debugger: {
            /**@type {HTMLElement} */
            highlight: undefined,
            /**@type {HTMLElement} */
            hoverHighlight: undefined,
        },
    };




    /**
     * @param {QuickReply} qr
     */
    constructor(qr) {
        this.qrs = QuickReplySet.list.find(it=>it.qrList.includes(qr));
        this.qr = qr;
        qr.eventSource.on(QR_EVENT.PROP_CHANGED, (qr, evt)=>this.handlePropChanged(evt));
        qr.eventSource.on(QR_EVENT.DELETE, (qr, evt)=>this.close());

        this.scriptDebugger = new SlashCommandDebugger(qr);
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.START, ()=>this.handleDebugStart());
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.PAUSE, (_, evt)=>this.handleDebugPause(evt));
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.RESUME, ()=>this.handleDebugResume());
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.STOP, ()=>this.handleDebugStop());
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.RESULT, (_, result)=>this.handleDebugResult(result));
        this.scriptDebugger.eventSource.on(SlashCommandDebugger.EVENT.ERROR, (_, error)=>this.handleDebugError(error));
    }


    async render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stqrd--editorPanel');
                root.classList[JSON.parse(accountStorage.getItem('stqrd--showOptions') ?? 'false') ? 'add' : 'remove']('stqrd--showOptions');
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
                                    this.dom.crumbs.qrs = title;
                                    title.classList.add('stqrd--title');
                                    title.textContent = this.qrs.name;
                                    crumb.append(title);
                                }
                                crumbs.append(crumb);
                            }
                        }
                        const separator = document.createElement('div'); {
                            separator.classList.add('stqrd--separator');
                            separator.classList.add('fa-solid', 'fa-fw', 'fa-chevron-right');
                            crumbs.append(separator);
                        }
                        { // QR
                            const crumb = document.createElement('div'); {
                                crumb.classList.add('stqrd--crumb');
                                const icon = document.createElement('div'); {
                                    icon.classList.add('stqrd--icon');
                                    icon.classList.add('fa-solid', 'fa-file-code');
                                    crumb.append(icon);
                                }
                                const title = document.createElement('div'); {
                                    this.dom.crumbs.qr = title;
                                    title.classList.add('stqrd--title');
                                    title.textContent = this.qr.label;
                                    crumb.append(title);
                                }
                                crumbs.append(crumb);
                            }
                        }
                        head.append(crumbs);
                    }
                    const actions = document.createElement('div'); {
                        actions.classList.add('stqrd--actions');
                        const popout = document.createElement('div'); {
                            popout.classList.add('stqrd--action');
                            popout.classList.add('stqrd--popout');
                            popout.classList.add('fa-solid', 'fa-fw', 'fa-up-right-from-square');
                            popout.title = 'Pop out editor';
                            popout.addEventListener('click', ()=>{
                                if (this.dom.root.parentElement == document.body) {
                                    this.eventSource.emit(Editor.EVENT.POPIN);
                                } else {
                                    this.eventSource.emit(Editor.EVENT.POPOUT);
                                }
                            });
                            actions.append(popout);
                        }
                        const close = document.createElement('div'); {
                            close.classList.add('stqrd--action');
                            close.classList.add('stqrd--close');
                            close.classList.add('fa-solid', 'fa-fw', 'fa-times');
                            close.title = 'Close editor';
                            close.addEventListener('click', ()=>{
                                this.eventSource.emit(Editor.EVENT.CLOSE, this);
                                this.unrender();
                            });
                            actions.append(close);
                        }
                        head.append(actions);
                    }
                    root.append(head);
                }
                const body = document.createElement('div'); {
                    this.dom.body = body;
                    body.classList.add('stqrd--body');
                    this.renderCodeEditor();
                    root.append(body);
                }
                const options = document.createElement('div'); {
                    options.classList.add('stqrd--options');
                    { // button (icon, label, title, display)
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            block.classList.add('stqrd--button');
                            const title = document.createElement('h4'); {
                                title.textContent = 'Button';
                                block.append(title);
                            }
                            { // icon|label|showLabel row
                                const row = document.createElement('div'); {
                                    row.classList.add('stqrd--row');
                                    { // icon
                                        const inputWrap = document.createElement('label'); {
                                            inputWrap.classList.add('stqrd--inputWrap');
                                            const lbl = document.createElement('div'); {
                                                lbl.classList.add('stqrd--text');
                                                lbl.textContent = 'Icon';
                                                inputWrap.append(lbl);
                                            }
                                            const inp = document.createElement('div'); {
                                                this.dom.options.icon = inp;
                                                inp.classList.add('stqrd--icon');
                                                inp.classList.add('stqrd--input');
                                                inp.classList.add('menu_button');
                                                inp.classList.add('fa-solid', 'fa-fw');
                                                this.updateIcon();
                                                inp.addEventListener('click', async()=>{
                                                    let value = await showFontAwesomePicker();
                                                    if (value === null) return;
                                                    this.qr.updateIcon(value);
                                                });
                                                inputWrap.append(inp);
                                            }
                                            row.append(inputWrap);
                                        }
                                    }
                                    { // label
                                        const inputWrap = document.createElement('label'); {
                                            inputWrap.classList.add('stqrd--inputWrap');
                                            const lbl = document.createElement('div'); {
                                                lbl.classList.add('stqrd--text');
                                                lbl.textContent = 'Label';
                                                inputWrap.append(lbl);
                                            }
                                            const inp = document.createElement('input'); {
                                                this.dom.options.label = inp;
                                                inp.classList.add('stqrd--label');
                                                inp.classList.add('stqrd--input');
                                                inp.classList.add('text_pole');
                                                inp.value = this.qr.label;
                                                inp.placeholder = 'Button Label Text';
                                                inp.addEventListener('input', ()=>{
                                                    this.qr.updateLabel(inp.value);
                                                });
                                                inputWrap.append(inp);
                                            }
                                            row.append(inputWrap);
                                        }
                                    }
                                    { // show label
                                        const inputWrap = document.createElement('label'); {
                                            inputWrap.classList.add('stqrd--inputWrap');
                                            inputWrap.title = 'Show label even with icon';
                                            const lbl = document.createElement('div'); {
                                                lbl.classList.add('stqrd--text');
                                                lbl.textContent = 'Show';
                                                inputWrap.append(lbl);
                                            }
                                            const inp = document.createElement('input'); {
                                                this.dom.options.showLabel = inp;
                                                inp.classList.add('stqrd--showLabel');
                                                inp.classList.add('stqrd--input');
                                                inp.type = 'checkbox';
                                                inp.checked = this.qr.showLabel;
                                                inp.addEventListener('click', ()=>{
                                                    this.qr.updateShowLabel(inp.checked);
                                                });
                                                inputWrap.append(inp);
                                            }
                                            row.append(inputWrap);
                                        }
                                    }
                                    block.append(row);
                                }
                            }
                            { // title row
                                const row = document.createElement('div'); {
                                    row.classList.add('stqrd--row');
                                    { // title
                                        const inputWrap = document.createElement('label'); {
                                            inputWrap.classList.add('stqrd--inputWrap');
                                            const lbl = document.createElement('div'); {
                                                lbl.classList.add('stqrd--text');
                                                lbl.textContent = 'Title';
                                                inputWrap.append(lbl);
                                            }
                                            const inp = document.createElement('input'); {
                                                this.dom.options.title = inp;
                                                inp.classList.add('stqrd--label');
                                                inp.classList.add('stqrd--input');
                                                inp.classList.add('text_pole');
                                                inp.value = this.qr.title;
                                                inp.placeholder = 'Title / Tooltip';
                                                inp.addEventListener('input', ()=>{
                                                    this.qr.updateTitle(inp.value);
                                                });
                                                inputWrap.append(inp);
                                            }
                                            row.append(inputWrap);
                                        }
                                    }
                                    block.append(row);
                                }
                            }
                            options.append(block);
                        }
                    }
                    { // context menu
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            const title = document.createElement('h4'); {
                                title.textContent = 'Context Menu';
                                block.append(title);
                            }
                            { // btn row
                                const row = document.createElement('div'); {
                                    row.classList.add('stqrd--row');
                                    { // btn
                                        const btn = document.createElement('div'); {
                                            btn.classList.add('menu_button');
                                            btn.classList.add('menu_button_icon');
                                            const i = document.createElement('div'); {
                                                i.classList.add('fa-solid', 'fa-pen-to-square');
                                                btn.append(i);
                                            }
                                            const t = document.createElement('div'); {
                                                t.textContent = 'Open Vanilla Editor';
                                                btn.append(t);
                                            }
                                            btn.addEventListener('click', ()=>this.qr.showEditor(true));
                                            row.append(btn);
                                        }
                                    }
                                    block.append(row);
                                }
                            }
                            options.append(block);
                        }
                    }
                    { // auto-exec
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            block.classList.add('stqrd--autoExec');
                            const title = document.createElement('h4'); {
                                title.textContent = 'Auto-Execute';
                                block.append(title);
                            }
                            for (const auto of await getCheckboxList()) {
                                const toggle = document.createElement('label'); {
                                    toggle.classList.add('stqrd--autoExecToggle');
                                    toggle.classList.add(`stqrd--${auto.id.slice(4)}`);
                                    const inp = document.createElement('input'); {
                                        this.dom.auto[auto.id] = { toggle:undefined, checkbox:inp };
                                        inp.type = 'checkbox';
                                        inp.checked = this.qr[auto.id.slice(4)];
                                        inp.addEventListener('click', ()=>{
                                            this.qr[auto.id.slice(4)] = inp.checked;
                                            this.qr.updateContext();
                                        });
                                        toggle.append(inp);
                                    }
                                    const icon = document.createElement('div'); {
                                        icon.classList.add('stqrd--icon');
                                        icon.classList.add('fa-solid', 'fa-fw', auto.icon);
                                        toggle.append(icon);
                                    }
                                    const lbl = document.createElement('div'); {
                                        lbl.classList.add('stqrd--label');
                                        lbl.textContent = auto.label;
                                        toggle.append(lbl);
                                    }
                                    block.append(toggle);
                                }
                            }
                            { // automation id row
                                const row = document.createElement('div'); {
                                    row.classList.add('stqrd--row');
                                    { // automation id
                                        const inputWrap = document.createElement('label'); {
                                            inputWrap.classList.add('stqrd--inputWrap');
                                            const lbl = document.createElement('div'); {
                                                lbl.classList.add('stqrd--text');
                                                lbl.textContent = 'Automation ID';
                                                inputWrap.append(lbl);
                                            }
                                            const inp = document.createElement('input'); {
                                                this.dom.options.automationId = inp;
                                                inp.classList.add('stqrd--label');
                                                inp.classList.add('stqrd--input');
                                                inp.classList.add('text_pole');
                                                inp.value = this.qr.automationId;
                                                inp.placeholder = '( None )';
                                                inp.addEventListener('input', ()=>{
                                                    this.qr.automationId = inp.value;
                                                    this.qr.updateContext();
                                                });
                                                inputWrap.append(inp);
                                            }
                                            row.append(inputWrap);
                                        }
                                    }
                                    block.append(row);
                                }
                            }
                            options.append(block);
                        }
                    }
                    root.append(options);
                }
                const debuggerWrap = document.createElement('div'); {
                    debuggerWrap.classList.add('stqrd--debuggerWrap');
                    const resizeHandle = document.createElement('div'); {
                        resizeHandle.classList.add('stqrd--resizeHandle');
                        let isResizing = false;
                        resizeHandle.addEventListener('pointerdown', (evt)=>{
                            if (isResizing) return;
                            isResizing = true;
                            evt.preventDefault();
                            let resizeStart = evt.x;
                            let wStart = debuggerWrap.offsetWidth;
                            let wEnd;
                            const dragListener = /**@type {(evt:PointerEvent)=>any} */(debounce((evt)=>{
                                evt.preventDefault();
                                wEnd = wStart - (evt.x - resizeStart);
                                debuggerWrap.style.setProperty('--width', `${wEnd}px`);
                            }, 5));
                            window.addEventListener('pointerup', ()=>{
                                window.removeEventListener('pointermove', dragListener);
                                isResizing = false;
                                if (!wEnd || wEnd <= 0) {
                                    const is = debuggerWrap.classList.toggle('stqrd--hideDebugger');
                                    if (is) {
                                        debuggerWrap.style.setProperty('--width', '0');
                                    } else {
                                        debuggerWrap.style.setProperty('--width', `${localStorage.getItem('stqrd--debugger-panelWidth')}px`);
                                    }
                                } else if (wEnd > 0) {
                                    debuggerWrap.classList.remove('stqrd--hideDebugger');
                                    localStorage.setItem('stqrd--debugger-panelWidth', wEnd.toString());
                                }
                            }, { once:true });
                            window.addEventListener('pointermove', dragListener);
                        });
                        debuggerWrap.append(resizeHandle);
                    }
                    debuggerWrap.append(this.scriptDebugger.render());
                    root.append(debuggerWrap);
                }
                const runResult = document.createElement('div'); {
                    runResult.classList.add('stqrd--runResult');
                    const head = document.createElement('div'); {
                        head.classList.add('stqrd--head');
                        head.textContent = 'Result:';
                        runResult.append(head);
                    }
                    const body = document.createElement('div'); {
                        this.dom.runResult = body;
                        body.classList.add('stqrd--body');
                        runResult.append(body);
                    }
                    root.append(runResult);
                }
                const runError = document.createElement('div'); {
                    this.dom.runError = runError;
                    runError.classList.add('stqrd--runError');
                    root.append(runError);
                }
                const footer = document.createElement('div'); {
                    this.dom.footer = footer;
                    footer.classList.add('stqrd--footer');
                    const editorConfig = document.createElement('div'); {
                        editorConfig.classList.add('stqrd--editorConfig');
                        const wrap = document.createElement('div'); {
                            wrap.classList.add('stqrd--option');
                            wrap.classList.add('stqrd--wrap');
                            wrap.addEventListener('click', ()=>{
                                const is = JSON.parse(accountStorage.getItem('qr--wrap') ?? 'false');
                                accountStorage.setItem('qr--wrap', JSON.stringify(!is));
                                cb.classList[is ? 'remove' : 'add']('fa-square-check');
                                cb.classList[is ? 'add' : 'remove']('fa-square');
                                this.editor.setOptions({ wordWrap:!is });
                            });
                            const cb = document.createElement('div'); {
                                cb.classList.add('stqrd--icon');
                                cb.classList.add('fa-solid');
                                const is = JSON.parse(accountStorage.getItem('qr--wrap') ?? 'false');
                                cb.classList.add(is ? 'fa-square-check' : 'fa-square');
                                wrap.append(cb);
                            }
                            const lbl = document.createElement('div'); {
                                lbl.textContent = 'Word Wrap';
                                wrap.append(lbl);
                            }
                            editorConfig.append(wrap);
                        }
                        const indent = document.createElement('div'); {
                            indent.classList.add('stqrd--option');
                            indent.classList.add('stqrd--indent');
                            const type = document.createElement('div'); {
                                type.classList.add('stqrd--subOption');
                                const is = JSON.parse(accountStorage.getItem('qr--spaces') ?? 'false');
                                type.textContent = is ? 'Spaces:' : 'Tabs:';
                                type.addEventListener('click', ()=>{
                                    const is = !JSON.parse(accountStorage.getItem('qr--spaces') ?? 'false');
                                    type.textContent = is ? 'Spaces:' : 'Tabs:';
                                    accountStorage.setItem('qr--spaces', JSON.stringify(is));
                                    this.editor.setOptions({ insertSpaces:is });
                                });
                                indent.append(type);
                            }
                            const width = document.createElement('input'); {
                                width.classList.add('stqrd--subOption');
                                width.classList.add('stqrd--width');
                                width.type = 'number';
                                width.min = '1';
                                width.max = '99';
                                width.value = accountStorage.getItem('qr--indent') ?? '4';
                                width.addEventListener('change', ()=>{
                                    accountStorage.setItem('qr--indent', width.value);
                                    this.editor.setOptions({ tabSize: parseInt(width.value) });
                                });
                                indent.append(width);
                            }
                            editorConfig.append(indent);
                        }
                        footer.append(editorConfig);
                    }
                    const playbackContainer = document.createElement('div'); {
                        playbackContainer.classList.add('stqrd--debugContainer');
                        const playbackControls = document.createElement('div'); {
                            playbackControls.classList.add('stqrd--playbackControls');
                            const play = document.createElement('div'); {
                                play.classList.add('stqrd--button');
                                play.classList.add('stqrd--play');
                                play.classList.add('fa-solid', 'fa-play');
                                play.title = 'Execute script';
                                play.addEventListener('click', ()=>this.run());
                                playbackControls.append(play);
                            }
                            const playPause = document.createElement('div'); {
                                playPause.classList.add('stqrd--button');
                                playPause.classList.add('stqrd--playPause');
                                playPause.title = 'Pause / resume script execution';
                                playPause.addEventListener('click', ()=>{
                                    if (this.qr.abortController.signal.paused) {
                                        this.qr.abortController.continue();
                                    } else {
                                        this.qr.abortController.pause();
                                    }
                                });
                                const icon1 = document.createElement('div'); {
                                    icon1.classList.add('stqrd--icon1');
                                    icon1.classList.add('fa-solid', 'fa-play');
                                    playPause.append(icon1);
                                }
                                const icon2 = document.createElement('div'); {
                                    icon2.classList.add('stqrd--icon2');
                                    icon2.classList.add('fa-solid', 'fa-pause');
                                    playPause.append(icon2);
                                }
                                playbackControls.append(playPause);
                            }
                            const stop = document.createElement('div'); {
                                stop.classList.add('stqrd--button');
                                stop.classList.add('stqrd--stop');
                                stop.classList.add('fa-solid', 'fa-stop');
                                stop.title = 'Stop script execution';
                                stop.addEventListener('click', ()=>{
                                    this.qr.abortController.abort();
                                });
                                playbackControls.append(stop);
                            }
                            playbackContainer.append(playbackControls);
                        }
                        footer.append(playbackContainer);
                    }
                    const actions = document.createElement('div'); {
                        actions.classList.add('stqrd--actions');
                        const autoWrap = document.createElement('div'); {
                            autoWrap.classList.add('stqrd--autoExec');
                            for (const auto of await getCheckboxList()) {
                                const toggle = document.createElement('div'); {
                                    this.dom.auto[auto.id].toggle = toggle;
                                    toggle.classList.add('stqrd--autoExecToggle');
                                    toggle.classList.add(`stqrd--${auto.id.slice(4)}`);
                                    toggle.classList.add('fa-solid', auto.icon);
                                    if (this.qr[auto.id.slice(4)]) toggle.classList.add('stqrd--isActive');
                                    toggle.title = auto.label;
                                    toggle.addEventListener('click', ()=>{
                                        this.qr[auto.id.slice(4)] = !this.qr[auto.id.slice(4)];
                                        this.qr.updateContext();
                                    });
                                    autoWrap.append(toggle);
                                }
                            }
                            actions.append(autoWrap);
                        }
                        const optionsToggle = document.createElement('div'); {
                            optionsToggle.classList.add('stqrd--action');
                            optionsToggle.classList.add('stqrd--optionsToggle');
                            optionsToggle.classList.add('fa-solid', 'fa-wrench');
                            optionsToggle.classList[JSON.parse(accountStorage.getItem('stqrd--showOptions') ?? 'false') ? 'add' : 'remove']('stqrd--isActive');
                            optionsToggle.title = 'Quick Reply options\n---\n- Context Menu\n- Auto Execute';
                            optionsToggle.addEventListener('click', ()=>{
                                const is = root.classList.toggle('stqrd--showOptions');
                                optionsToggle.classList[is ? 'add' : 'remove']('stqrd--isActive');
                                accountStorage.setItem('stqrd--showOptions', JSON.stringify(is));
                            });
                            actions.append(optionsToggle);
                        }
                        footer.append(actions);
                    }
                    root.append(footer);
                }
            }
        }
        return this.dom.root;
    }

    async renderCodeEditor() {
        languages.stscript = {
            'comment': [
                { pattern: /\/\/.*?\|/, greedy: true },
                { pattern: /\/#.*?\|/, greedy: true },
                { pattern: /\/\*[\s\S]*?\*\|/, greedy: true },
            ],

            'macro': {
                pattern: /\{\{.*?\}\}/,
                inside: {
                    'macro-dynamic': {
                        pattern: /(::)(var|getvar|getglobalvar)::[a-zA-Z0-9_-]+/,
                        lookbehind: true,
                    },
                    'punctuation': /\{\{|\}\}|::/,
                },
            },

            // Match just the `{:` and `:}` braces
            'closure-brace': {
                pattern: /(\{:|:\})/,
                alias: 'punctuation',
            },

            'variable-declaration': {
                pattern: /\/let\s+(?:[a-zA-Z_]\w*|key=\w*)(?:\s+[^|]+)?/,
                inside: {
                    'keyword': /\/let/,
                    'key': /\w+(?==)/,
                    'variable': /\b\w+\b/,
                },
            },

            'variable-use': {
                pattern: /\/var\s+(?:\w+=)?\w+(?:\s+.+)?/,
                inside: {
                    'keyword': /\/var/,
                    'key': /\w+(?==)/,
                    'variable': /\b\w+\b/,
                },
            },

            'global-var': {
                pattern: /\/(?:set|get)(?:global)?var\s+key=\w+(?:\s+\S+)?/,
                inside: {
                    'keyword': /\/(?:set|get)(?:global)?var/,
                    'key': /\bkey=\w+\b/,
                },
            },

            'closure-call': {
                pattern: /\/:[a-zA-Z0-9_-]+/,
                alias: 'function',
            },

            'special-command': {
                pattern: /\/(?:abort|breakpoint)\b/,
                alias: 'important',
            },

            'command': {
                pattern: /\/[a-zA-Z0-9_-]+(?=\s|$)((\s|\n)+[a-zA-Z_][a-zA-Z0-9_-]*=.*(?=\s|$))*/,
                // alias: 'function',
                inside: {
                    'function': /\/[a-zA-Z0-9_-]+(?=\s|$)/,
                    'variable': /\w+(?==)/,
                },
            },

            'pipe-break': {
                pattern: /\|\|/,
                // alias: 'operator',
            },
            'pipe': {
                pattern: /\|/,
                // alias: 'operator',
            },

            'number': /\b\d+(\.\d+)?\b/,

            'operator': /[-+*/=<>!]+/,

            'punctuation': /[{}[\];(),.:]/,

            // 'keyword': /\b(if|else|return|then)\b/,
        };





        languageMap.stscript = {
            comments: {
                block: ['/*', '*|'],
            },
            autoIndent: [
                // Whether to indent
                ([start], value) => /\{:(?!(\n|:\}))*$/.test(value.slice(0, start)),
                // Whether to add an extra line
                ([start, end], value) => /\{::\}/.test(value[start - 1] + value[end]),
            ],
        };
        const codeEditor = document.createElement('div'); {
            codeEditor.classList.add('stqrd--codeEditor');
            this.editor = createEditor(
                codeEditor,
                {
                    value: this.qr.message,

                    insertSpaces: false,
                    language: 'stscript',
                    lineNumbers: true,
                    readOnly: false,
                    tabSize: parseInt(accountStorage.getItem('qr--tabSize') ?? '4'),
                    wordWrap: JSON.parse(accountStorage.getItem('qr--wrap') ?? 'false'),
                    onUpdate: /**@type {(value:string)=>void}*/(debounce((value)=>{
                        if (this.isDebugging) return;
                        if (value != this.qr.message) {
                            this.qr.updateMessage(value);
                        }
                    })),
                },
                highlightBracketPairs(),
                // searchWidget(),
                // highlightSelectionMatches(),
                matchBrackets(true, '{', '}'),
                indentGuides(),
                defaultCommands([['{:', ':}']]),
            );
            this.dom.body.append(codeEditor);
            const ac = await setSlashCommandAutoComplete(this.editor.textarea, true);
            this.editor.textarea.addEventListener('keydown', (evt)=>{
                if (evt.ctrlKey && evt.key == 'Enter') {
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                    evt.preventDefault();
                    this.run();
                } else {
                    ac.handleKeyDown(evt);
                }
            }, { capture:true });
        }
    }

    unrender() {
        this.dom.root?.remove();
    }


    getEditorPosition(start, end, message = null) {
        const scrollRect = this.editor.scrollContainer.getBoundingClientRect();
        const inputRect = this.editor.textarea.getBoundingClientRect();
        const style = window.getComputedStyle(this.editor.textarea);
        if (!this.clone) {
            this.clone = document.createElement('div');
            for (const key of style) {
                this.clone.style[key] = style[key];
            }
            this.clone.style.position = 'fixed';
            this.clone.style.visibility = 'hidden';
            const mo = new MutationObserver(muts=>{
                if (muts.find(it=>[...it.removedNodes].includes(this.editor.textarea) || [...it.removedNodes].find(n=>n.contains(this.editor.textarea)))) {
                    this.clone?.remove();
                    this.clone = null;
                }
            });
            mo.observe(document.body, { childList:true });
        }
        document.body.append(this.clone);
        this.clone.style.width = `${inputRect.width}px`;
        this.clone.style.height = `${inputRect.height}px`;
        this.clone.style.left = `${inputRect.left}px`;
        this.clone.style.top = `${inputRect.top}px`;
        this.clone.style.whiteSpace = style.whiteSpace;
        this.clone.style.tabSize = style.tabSize;
        const text = message ?? this.editor.value;
        const before = text.slice(0, start);
        this.clone.textContent = before;
        const locator = document.createElement('span');
        locator.textContent = text.slice(start, end);
        this.clone.append(locator);
        this.clone.append(text.slice(end));
        this.clone.scrollTop = this.editor.textarea.scrollTop;
        this.clone.scrollLeft = this.editor.textarea.scrollLeft;
        const locatorRect = locator.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const location = {
            left: locatorRect.left - bodyRect.left + (inputRect.left - scrollRect.left),
            right: locatorRect.right - bodyRect.left + (inputRect.left - scrollRect.left),
            top: locatorRect.top - bodyRect.top + (inputRect.top - scrollRect.top),
            bottom: locatorRect.bottom - bodyRect.top + (inputRect.top - scrollRect.top),
        };
        // this.clone.remove();
        return location;
    }
    async run() {
        this.qr.updateMessage(this.editor.value);
        await this.scriptDebugger.run();
    }

    close() {
        this.unrender();
        this.eventSource.emit(Editor.EVENT.CLOSE);
    }

    updateIcon() {
        this.dom.options.icon.classList.remove([...this.dom.options.icon.classList].find(it=>it.startsWith('fa-') && !['fa-solid', 'fa-fw'].includes(it)));
        if (this.qr.icon?.length) {
            this.dom.options.icon.classList.remove('stqrd--noIcon');
            this.dom.options.icon.classList.add(this.qr.icon);
        } else {
            this.dom.options.icon.classList.add('stqrd--noIcon');
        }
    }


    handlePropChanged({ property, oldValue, value }) {
        switch (property) {
            case 'icon': {
                this.updateIcon();
                break;
            }
            case 'label': {
                this.dom.crumbs.qr.textContent = value;
                if (this.dom.options.label.value != value) {
                    this.dom.options.label.value = value;
                }
                break;
            }
            case 'showLabel': {
                if (this.dom.options.showLabel.checked != value) {
                    this.dom.options.showLabel.checked = value;
                }
                break;
            }
            case 'title': {
                if (this.dom.options.title.value != value) {
                    this.dom.options.title.value = value;
                }
                break;
            }
            case 'message': {
                break;
            }
            case 'preventAutoExecute':
            case 'isHidden':
            case 'executeOnStartup':
            case 'executeOnUser':
            case 'executeOnAi':
            case 'executeOnChatChange':
            case 'executeOnGroupMemberDraft':
            case 'executeOnNewChat': {
                this.dom.auto[`qr--${property}`].checkbox.checked = value;
                this.dom.auto[`qr--${property}`].toggle.classList[value ? 'add' : 'remove']('stqrd--isActive');
                break;
            }
            case 'automationId': {
                this.dom.automationId.value = value;
                break;
            }
        }
    }


    handleDebugStart() {
        this.isDebugging = true;
        this.editor.setOptions({ readOnly:true });
        this.dom.root.classList.remove('stqrd--hasResult');
        this.dom.root.classList.remove('stqrd--hasError');
        this.dom.root.classList.add('stqrd--isDebugging');
    }
    /**
     *
     * @param {{start:number, end:number, fullText:string, qrs:string, qr:string, isResolved:boolean}} evt
     */
    handleDebugPause(evt) {
        this.dom.root.classList.add('stqrd--isPaused');
        this.editor.setOptions({ value: evt.fullText });
        this.dom.crumbs.qrs.textContent = evt.qrs;
        this.dom.crumbs.qr.textContent = evt.qr;
        // highlight line
        this.dom.debugger.highlight?.remove();
        const hi = document.createElement('div'); {
            this.dom.debugger.highlight = hi;
            const loc = this.getEditorPosition(evt.start, evt.end, evt.fullText);
            const layer = this.editor.textarea.getBoundingClientRect();
            hi.classList.add('stqrd--highlight');
            if (!evt.isResolved) {
                hi.classList.add('stqrd--unresolved');
            }
            hi.style.left = `${loc.left - layer.left}px`;
            hi.style.width = `${loc.right - loc.left}px`;
            hi.style.top = `${loc.top - layer.top + this.editor.scrollContainer.scrollTop}px`;
            hi.style.height = `${loc.bottom - loc.top}px`;
            this.editor.scrollContainer.append(hi);
        }
    }
    handleDebugResume() {
        this.dom.debugger.highlight?.remove();
        this.dom.debugger.highlight = null;
        this.dom.root.classList.remove('stqrd--isPaused');
    }
    handleDebugStop() {
        this.editor.setOptions({ value: this.qr.message });
        this.dom.crumbs.qrs.textContent = this.qrs.name;
        this.dom.crumbs.qr.textContent = this.qr.label;
        this.dom.root.classList.remove('stqrd--isDebugging');
        this.dom.root.classList.remove('stqrd--isPaused');
        this.editor.setOptions({ readOnly:false });
        this.isDebugging = false;
    }
    handleDebugResult(result) {
        this.dom.runResult.innerHTML = '';
        this.dom.runResult.append(new JsonView(tryParse(result) ?? result).render());
        // this.dom.runResult.textContent = tryParseAndFormat(result?.toString());
        this.dom.root.classList.add('stqrd--hasResult');
    }
    handleDebugError(error) {
        this.dom.root.classList.add('stqrd--hasError');
        if (error instanceof SlashCommandParserError) {
            this.dom.runError.innerHTML = `
                <div>${error.message}</div>
                <div>Line: ${error.line} Column: ${error.column}</div>
                <pre style="text-align:left;">${error.hint}</pre>
            `;
        } else {
            this.dom.runError.innerHTML = `<div>${error.message}</div>`;
        }
    }
}
