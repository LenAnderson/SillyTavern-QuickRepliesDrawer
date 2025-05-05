import { EventEmitter } from '../../../../../lib/eventemitter.js';
import { SlashCommandAbortController } from '../../../../slash-commands/SlashCommandAbortController.js';
import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';
import { SlashCommandDebugController } from '../../../../slash-commands/SlashCommandDebugController.js';
import { SlashCommandExecutor } from '../../../../slash-commands/SlashCommandExecutor.js';
import { SlashCommandScope } from '../../../../slash-commands/SlashCommandScope.js';
import { QuickReplySet } from '../../../quick-reply/src/QuickReplySet.js';
import { tryParse } from './lib/json.js';
import { JsonView } from './lib/JsonView/JsonView.js';

/**@typedef {import('./helper/hookQuickReply.js').ObservableQuickReply} QuickReply */


export class SlashCommandDebugger {
    /** @readonly */
    /** @enum {string} */
    static EVENT = {
        /** Debugger starts running, script is executing. */
        START: 'start',
        /** Debugger has paused on a breakpoint. */
        PAUSE: 'pause',
        /** Debugger has resumed execution after a breakpoint. */
        RESUME: 'resume',
        /** Debugger stops running, script is no longer executing. */
        STOP: 'stop',
        /** Script has finished successfully. */
        RESULT: 'result',
        /** Script has finished with errors. */
        ERROR: 'error',
    };




    /**@type {QuickReplySet} */ qrs;
    /**@type {QuickReply} */ qr;

    get abortController() {
        return this.qr.abortController;
    }
    set abortController(value) {
        this.qr.abortController = value;
    }

    get debugController() {
        return this.qr.debugController;
    }
    set debugController(value) {
        this.qr.debugController = value;
    }


    eventSource = new EventEmitter();


    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        scope: undefined,
        /**@type {HTMLElement} */
        callStack: undefined,
    };




    constructor(qr) {
        this.qrs = QuickReplySet.list.find(it=>it.qrList.includes(qr));
        this.qr = qr;
    }




    render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stqrd--SlashCommandDebugger');
                root.style.setProperty('--width', `${localStorage.getItem('stqrd--debugger-panelWidth')}px`);
                { // controls
                    const blockContent = document.createElement('div'); {
                        blockContent.classList.add('stqrd--controls');
                        const resume = document.createElement('div'); {
                            resume.classList.add('stqrd--button');
                            resume.classList.add('stqrd--resume');
                            resume.classList.add('menu_button');
                            resume.title = 'Resume';
                            resume.addEventListener('click', ()=>{
                                this.qr.debugController?.resume();
                            });
                            blockContent.append(resume);
                        }
                        const stepOver = document.createElement('div'); {
                            stepOver.classList.add('stqrd--button');
                            stepOver.classList.add('stqrd--stepOver');
                            stepOver.classList.add('menu_button');
                            stepOver.title = 'Step over';
                            stepOver.addEventListener('click', ()=>{
                                this.qr.debugController?.step();
                            });
                            blockContent.append(stepOver);
                        }
                        const stepInto = document.createElement('div'); {
                            stepInto.classList.add('stqrd--button');
                            stepInto.classList.add('stqrd--stepInto');
                            stepInto.classList.add('menu_button');
                            stepInto.title = 'Step into';
                            stepInto.addEventListener('click', ()=>{
                                this.qr.debugController?.stepInto();
                            });
                            blockContent.append(stepInto);
                        }
                        const stepOut = document.createElement('div'); {
                            stepOut.classList.add('stqrd--button');
                            stepOut.classList.add('stqrd--stepOut');
                            stepOut.classList.add('menu_button');
                            stepOut.title = 'Step out';
                            stepOut.addEventListener('click', ()=>{
                                this.qr.debugController?.stepOut();
                            });
                            blockContent.append(stepOut);
                        }
                        root.append(blockContent);
                    }
                }
                const blockWrap = document.createElement('div'); {
                    blockWrap.classList.add('stqrd--blockWrap');
                    { // scope
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            const title = document.createElement('h4'); {
                                title.textContent = 'Scope';
                                block.append(title);
                            }
                            const blockContent = document.createElement('div'); {
                                this.dom.scope = blockContent;
                                blockContent.classList.add('stqrd--blockContent');
                                blockContent.classList.add('stqrd--scope');
                                block.append(blockContent);
                            }
                            blockWrap.append(block);
                        }
                    }
                    { // call stack
                        const block = document.createElement('div'); {
                            block.classList.add('stqrd--block');
                            const title = document.createElement('h4'); {
                                title.textContent = 'Call Stack';
                                block.append(title);
                            }
                            const blockContent = document.createElement('div'); {
                                this.dom.callStack = blockContent;
                                blockContent.classList.add('stqrd--blockContent');
                                blockContent.classList.add('stqrd--callStack');
                                block.append(blockContent);
                            }
                            blockWrap.append(block);
                        }
                    }
                    root.append(blockWrap);
                }
            }
        }
        return this.dom.root;
    }


    async run() {
        await this.eventSource.emit(SlashCommandDebugger.EVENT.START, this);
        try {
            this.abortController = new SlashCommandAbortController();
            this.debugController = new SlashCommandDebugController();

            // dummy element to avoid null errors
            this.qr.editorExecuteProgress = document.createElement('div');

            this.debugController.onBreakPoint = (closure, executor)=>this.handleBreakPoint(closure, executor);

            const result = await this.qrs.debug(this.qr);
            this.eventSource.emit(SlashCommandDebugger.EVENT.RESULT, this, result);
        }
        catch(ex) {
            console.error('SlashCommandDebugger (handled)', ex);
            this.eventSource.emit(SlashCommandDebugger.EVENT.ERROR, this, ex);
        }
        await this.eventSource.emit(SlashCommandDebugger.EVENT.STOP, this);
    }

    /**
     *
     * @param {SlashCommandClosure} closure
     * @param {SlashCommandExecutor} executor
     * @returns {Promise<boolean>}
     */
    async handleBreakPoint(closure, executor) {
        this.dom.root.classList.add('stqrd--isPaused');
        const uuidCheck = /^[0-9a-z]{8}(-[0-9a-z]{4}){3}-[0-9a-z]{12}$/;
        let qrsName;
        let qrName;
        if (uuidCheck.test(closure.source)) {
            qrsName = 'anonymous';
            qrName = closure.source;
        } else {
            const parts = closure.source.split('.');
            for (let idx = 0; idx + 1 < parts.length; idx++) {
                qrsName = parts.slice(0, idx + 1).join('.');
                qrName = parts.slice(idx + 1).join('.');
                if (QuickReplySet.list.some(qrs=>qrs.name == qrsName && qrs.qrList.some(qr=>qr.label == qrName))) {
                    break;
                }
            }
        }
        this.eventSource.emit(SlashCommandDebugger.EVENT.PAUSE, this, {
            start: Math.max(0, executor.start - 1),
            end: executor.end,
            fullText: closure.fullText,
            qrs: qrsName ?? ' -- ??? -- ',
            qr: qrName ?? ' -- ??? -- ',
            isResolved: this.debugController.namedArguments !== undefined,
        });

        this.dom.scope.innerHTML = '';
        this.buildScope(closure.scope, [], [], -1, true);

        this.dom.callStack.innerHTML = '';
        this.buildStack(closure);
        const isStepping = await this.debugController.awaitContinue();
        this.dom.root.classList.remove('stqrd--isPaused');
        return isStepping;
    }


    /**
     *
     * @param {'variable'|'macro'|'argument'|'pipe'} type
     * @param {string} titleText
     * @param {[key:string,value:string|SlashCommandClosure,resolvedValue?:string|SlashCommandClosure][]} kvPairs
     * @param {string[]} shadowNames
     */
    buildSubScope(type, titleText, kvPairs, shadowNames = []) {
        const hasResolved = (kvPairs.at(0)?.length ?? 0) > 2;
        const subScope = document.createElement('div'); {
            subScope.classList.add('stqrd--subScope');
            const title = document.createElement('div'); {
                title.classList.add('stqrd--title');
                title.textContent = titleText;
                //TODO highlight (emit event)
                subScope.append(title);
            }
            for (const [key, val, valResolved] of kvPairs) {
                const isHidden = shadowNames.includes(key);
                if (!isHidden) shadowNames.push(key);
                const item = document.createElement('div'); {
                    item.classList.add('stqrd--scopeItem');
                    item.dataset.type = type;
                    if (isHidden) item.classList.add('stqrd--isHidden');
                    const k = document.createElement('div'); {
                        k.classList.add('stqrd--key');
                        k.textContent = key;
                        item.append(k);
                    }
                    const makeValue = (val, hasResolved = false, isResolved = false)=>{
                        const v = document.createElement('div'); {
                            v.classList.add('stqrd--value');
                            if (hasResolved) {
                                if (isResolved) {
                                    v.classList.add('stqrd--resolved');
                                } else {
                                    v.classList.add('stqrd--unresolved');
                                }
                            }
                            if (val instanceof SlashCommandClosure) {
                                v.classList.add('stqrd--closure');
                                v.title = val.rawText;
                                v.textContent = val.toString();
                            } else if (val === undefined) {
                                v.classList.add('stqrd--undefined');
                                v.textContent = 'undefined';
                            } else {
                                let jsonVal = tryParse(val);
                                if (jsonVal && typeof jsonVal == 'object') {
                                    v.append(new JsonView(jsonVal).render());
                                } else {
                                    v.textContent = val;
                                    v.classList.add('stqrd--simple');
                                }
                            }
                        }
                        return v;
                    };
                    item.append(makeValue(val, hasResolved));
                    if (hasResolved) {
                        item.append(makeValue(valResolved, hasResolved, true));
                    }
                    subScope.append(item);
                }
            }
            this.dom.scope.append(subScope);
        }
    }

    /**
     *
     * @param {SlashCommandScope} scope
     * @param {string[]} varNames
     * @param {string[]} macroNames
     * @param {number} ci
     * @param {boolean} isCurrent
     */
    buildScope(scope, varNames = [], macroNames = [], ci = -1, isCurrent = false) {
        if (!isCurrent) {
            ci--;
        }
        const c = this.qr.debugController.stack.at(ci);
        if (isCurrent) {
            // named args
            const executor = this.qr.debugController.cmdStack.at(-1);
            const keys = [...new Set([...Object.keys(this.qr.debugController.namedArguments ?? {}), ...(executor.namedArgumentList ?? []).map(it=>it.name)])]
                .filter(it=>it[0] != '_')
            ;
            this.buildSubScope(
                'argument',
                `Named Arguments - /${executor.name}`,
                keys.map(key=>[
                    key,
                    executor.namedArgumentList.find(it=>it.name == key)?.value,
                    this.qr.debugController.namedArguments?.[key],
                ]),
            );
            // unnamed args
            let unnamed = this.qr.debugController.unnamedArguments ?? [];
            if (!Array.isArray(unnamed)) unnamed = [unnamed];
            while (unnamed.length < (executor.unnamedArgumentList?.length ?? 0)) unnamed.push(undefined);
            this.buildSubScope(
                'argument',
                `Unnamed Arguments - /${executor.name}`,
                unnamed.map((it,idx)=>[
                    idx.toString(),
                    executor.unnamedArgumentList?.[idx]?.value,
                    it,
                ]),
            );
        }
        { // current scope
            this.buildSubScope(
                'variable',
                isCurrent ? 'Current Scope' : 'Parent Scope',
                Object.entries(scope.variables),
                varNames,
            );
            this.buildSubScope(
                'macro',
                'Macros',
                Object.entries(scope.macros),
                macroNames,
            );
            this.buildSubScope(
                'pipe',
                'Pipe',
                [['pipe', scope.pipe]],
                [],
            );
        }
        if (scope.parent) {
            this.buildScope(
                scope.parent,
                varNames,
                macroNames,
                ci,
            );
        }
    }


    /**
     * @param {SlashCommandClosure} closure
     */
    buildStack(closure) {
        let ei = -1;
        const cmdStack = this.qr.debugController.cmdStack.toReversed();
        const stack = this.qr.debugController.stack.toReversed();
        for (const executor of cmdStack) {
            ei++;
            const c = stack.at(ei);
            const item = document.createElement('div'); {
                item.classList.add('stqrd--stackItem');
                //TODO add highlight
                const cmd = document.createElement('div'); {
                    cmd.classList.add('stqrd--cmd');
                    cmd.textContent = `/${executor.name}`;
                    if (executor.command.name == 'run') {
                        cmd.textContent += `${(executor.name == ':' ? '' : ' ')}${executor.unnamedArgumentList[0]?.value}`;
                    }
                    item.append(cmd);
                }
                const src = document.createElement('div'); {
                    src.classList.add('stqrd--src');
                    const line = closure.fullText.slice(0, executor.start).split('\n').length;
                    if (false) {
                        //TODO handle UUID
                    } else {
                        src.textContent = `${executor.source}:${line}`;
                    }
                    item.append(src);
                }
                this.dom.callStack.append(item);
            }
        }
    }
}
