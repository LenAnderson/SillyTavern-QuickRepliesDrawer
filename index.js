import { getRequestHeaders } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { getCheckboxList } from './src/helper/autoExecHelper.js';
import { hookQuickReply } from './src/helper/hookQuickReply.js';
import { QuickRepliesDrawer } from './src/QuickRepliesDrawer.js';

const watchCss = async()=>{
    // watch CSS for changes
    const style = document.createElement('style');
    document.body.append(style);
    const path = [
        '~',
        'extensions',
        'SillyTavern-QuickRepliesDrawer-v2',
        'style.css',
    ].join('/');
    while (true) {
        const watchResponse = await fetch('/api/plugins/files/watch', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                path,
                interval: 500,
            }),
        });
        if (!watchResponse.ok) {
            alert('something went wrong');
            break;
        }
        style.innerHTML = await watchResponse.text();
        document.querySelector('#third-party_SillyTavern-QuickRepliesDrawer-v2-css')?.remove();
    }
};

const init = ()=>{
    watchCss();
    hookQuickReply();
    getCheckboxList();
    const drawer = new QuickRepliesDrawer();
    drawer.inject();
};
if (!extension_settings.disabledExtensions.includes('third-party/SillyTavern-QuickRepliesDrawer-v2')) init();
