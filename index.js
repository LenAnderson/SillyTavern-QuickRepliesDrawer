import { extension_settings } from '../../../extensions.js';
import { getCheckboxList } from './src/helper/autoExecHelper.js';
import { hookQuickReply } from './src/helper/hookQuickReply.js';
import { applyTweaks } from './src/helper/performance.js';
import { QuickRepliesDrawer } from './src/QuickRepliesDrawer.js';

const init = ()=>{
    applyTweaks();
    hookQuickReply();
    getCheckboxList();
    const drawer = new QuickRepliesDrawer();
    drawer.inject();
};
if (!extension_settings.disabledExtensions.includes('third-party/SillyTavern-QuickRepliesDrawer')) init();
