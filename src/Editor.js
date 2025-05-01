import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { AutoComplete } from '../../../../autocomplete/AutoComplete.js';
import { setSlashCommandAutoComplete } from '../../../../slash-commands.js';
import { SlashCommandAbortController } from '../../../../slash-commands/SlashCommandAbortController.js';
import { SlashCommandDebugController } from '../../../../slash-commands/SlashCommandDebugController.js';
import { SlashCommandParserError } from '../../../../slash-commands/SlashCommandParserError.js';
import { accountStorage } from '../../../../util/AccountStorage.js';
import { debounce } from '../../../../utils.js';
import { QuickReplySet } from '../../../quick-reply/src/QuickReplySet.js';
import { defaultCommands } from '../lib/prism-code-editor/extensions/commands.js';
import { indentGuides } from '../lib/prism-code-editor/extensions/guides.js';
import { highlightBracketPairs } from '../lib/prism-code-editor/extensions/matchBrackets/highlight.js';
import { matchBrackets } from '../lib/prism-code-editor/extensions/matchBrackets/index.js';
import { createEditor, languageMap } from '../lib/prism-code-editor/index.js';
import { languages } from '../lib/prism-code-editor/prism/index.js';
import { getCheckboxList } from './helper/autoExecHelper.js';

/**@typedef {import('../../../quick-reply/src/QuickReply.js').QuickReply} QuickReply */
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


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        crumbs: undefined,
        /**@type {HTMLElement} */
        body: undefined,
        /**@type {HTMLElement} */
        runResult: undefined,
        /**@type {HTMLElement} */
        runError: undefined,
    };




    /**
     * @param {QuickReply} qr
     */
    constructor(qr) {
        this.qr = qr;
        this.qrs = QuickReplySet.list.find(it=>it.qrList.includes(this.qr));
    }


    async render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stqrd--editorPanel');
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
                    for (const topic of ['Icon & Label', 'Title', 'Display', 'Context Menu']) {
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            const title = document.createElement('h4'); {
                                title.textContent = topic;
                                block.append(title);
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
                                        inp.type = 'checkbox';
                                        inp.checked = this.qr[auto.id.slice(4)];
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
                            options.append(block);
                        }
                    }
                    root.append(options);
                }
                const runResult = document.createElement('div'); {
                    this.dom.runResult = runResult;
                    runResult.classList.add('stqrd--runResult');
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
                    const debugContainer = document.createElement('div'); {
                        debugContainer.classList.add('stqrd--debugContainer');
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
                                playbackControls.append(stop);
                            }
                            debugContainer.append(playbackControls);
                        }
                        const debugControls = document.createElement('div'); {
                            debugControls.classList.add('stqrd--debugControls');
                            const resume = document.createElement('div'); {
                                resume.classList.add('stqrd--button');
                                resume.classList.add('stqrd--resume');
                                resume.title = 'Resume';
                                debugControls.append(resume);
                            }
                            const stepOver = document.createElement('div'); {
                                stepOver.classList.add('stqrd--button');
                                stepOver.classList.add('stqrd--stepOver');
                                stepOver.title = 'Step over';
                                debugControls.append(stepOver);
                            }
                            const stepInto = document.createElement('div'); {
                                stepInto.classList.add('stqrd--button');
                                stepInto.classList.add('stqrd--stepInto');
                                stepInto.title = 'Step into';
                                debugControls.append(stepInto);
                            }
                            const stepOut = document.createElement('div'); {
                                stepOut.classList.add('stqrd--button');
                                stepOut.classList.add('stqrd--stepOut');
                                stepOut.title = 'Step out';
                                debugControls.append(stepOut);
                            }
                            debugContainer.append(debugControls);
                        }
                        footer.append(debugContainer);
                    }
                    const actions = document.createElement('div'); {
                        actions.classList.add('stqrd--actions');
                        for (const auto of await getCheckboxList()) {
                            const toggle = document.createElement('div'); {
                                toggle.classList.add('stqrd--autoExecToggle');
                                toggle.classList.add(`stqrd--${auto.id.slice(4)}`);
                                toggle.classList.add('fa-solid', auto.icon);
                                if (this.qr[auto.id.slice(4)]) toggle.classList.add('stqrd--isActive');
                                toggle.title = auto.label;
                                actions.append(toggle);
                            }
                        }
                        const optionsToggle = document.createElement('div'); {
                            optionsToggle.classList.add('stqrd--action');
                            optionsToggle.classList.add('stqrd--optionsToggle');
                            optionsToggle.classList.add('fa-solid', 'fa-wrench');
                            optionsToggle.title = 'Quick Reply options\n---\n- Context Menu\n- Auto Execute';
                            optionsToggle.addEventListener('click', ()=>{
                                const is = root.classList.toggle('stqrd--showOptions');
                                optionsToggle.classList[is ? 'add' : 'remove']('stqrd--isActive');
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
                    onUpdate: /**@type {(value:string)=>void}*/(debounce((value)=>this.qr.updateMessage(value))),
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
                    this.run();
                }
            });
        }
    }

    unrender() {
        this.dom.root?.remove();
    }


    async run() {
        this.editor.setOptions({ readOnly:true });
        this.dom.root.classList.remove('stqrd--hasResult');
        this.dom.root.classList.remove('stqrd--hasError');
        try {
            const abortController = new SlashCommandAbortController();
            const debugController = new SlashCommandDebugController();
            this.qr.abortController = abortController;
            this.qr.debugController = debugController;
            this.qr.editorExecuteProgress = document.createElement('div');
            debugController.onBreakPoint = async(closure, executor)=>{
                const isStepping = debugController.awaitContinue();
                return isStepping;
            };
            const result = await this.qrs.debug(this.qr);
            this.dom.runResult.textContent = this.tryParseAndFormat(result?.toString());
            this.dom.root.classList.add('stqrd--hasResult');
        } catch (ex) {
            this.dom.root.classList.add('stqrd--hasError');
            if (ex instanceof SlashCommandParserError) {
                this.dom.runError.innerHTML = `
                    <div>${ex.message}</div>
                    <div>Line: ${ex.line} Column: ${ex.column}</div>
                    <pre style="text-align:left;">${ex.hint}</pre>
                `;
            } else {
                this.dom.runError.innerHTML = `<div>${ex.message}</div>`;
            }
        }
        this.editor.setOptions({ readOnly:false });
    }

    tryParseAndFormat(str) {
        try {
            const parsed = JSON.parse(str);
            return JSON.stringify(parsed, null, 4);
        } catch {
            return str;
        }
    }

    close() {
        this.unrender();
        this.eventSource.emit(Editor.EVENT.CLOSE);
    }
}
