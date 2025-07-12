import { extension_settings } from '../../../extensions.js';
import { getCheckboxList } from './src/helper/autoExecHelper.js';
import { hookQuickReply } from './src/helper/hookQuickReply.js';
import { applyTweaks } from './src/helper/performance.js';
import { QuickRepliesDrawer } from './src/QuickRepliesDrawer.js';

export const NAME = new URL(import.meta.url).pathname.split('/').at(-2);
const watchCss = async()=>{
    if (new URL(import.meta.url).pathname.split('/').includes('reload')) return;
    try {
        const FilesPluginApi = (await import('../SillyTavern-FilesPluginApi/api.js')).FilesPluginApi;
        // watch CSS for changes
        const style = document.createElement('style');
        document.body.append(style);
        const path = [
            '~',
            'extensions',
            NAME,
            'style.css',
        ].join('/');
        const ev = await FilesPluginApi.watch(path);
        ev.addEventListener('message', async(/**@type {boolean}*/exists)=>{
            if (!exists) return;
            style.innerHTML = await (await FilesPluginApi.get(path)).text();
            document.querySelector(`#third-party_${NAME}-css`)?.remove();
        });
    } catch { /* empty */ }
};

/**@type {QuickRepliesDrawer} */
export let drawer;

const init = ()=>{
    watchCss();
    applyTweaks();
    hookQuickReply();
    getCheckboxList();
    drawer = new QuickRepliesDrawer();
    drawer.inject();
};
if (!extension_settings.disabledExtensions.includes(`third-party/${NAME}`)) init();
