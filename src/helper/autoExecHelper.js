const checkboxList = [];

let loadPromise;
/**
 * @returns {Promise<{id: string, icon: string, label: string }[]>}
 */
export const getCheckboxList = async()=>{
    if (!loadPromise) {
        loadPromise = new Promise(async(resolve, reject)=>{
            const response = await fetch('/scripts/extensions/quick-reply/html/qrEditor.html', { cache: 'no-store' });
            if (!response.ok) {
                loadPromise = null;
                reject();
            } else {
                const template = document.createRange().createContextualFragment(await response.text()).querySelector('#qr--modalEditor');
                checkboxList.push(
                    ...[...template.querySelectorAll('#qr--autoExec > .checkbox_label')]
                        .map(it=>({
                            id: it.querySelector('input').id,
                            icon: [...it.querySelector('.fa-solid').classList].find(it=>it.startsWith('fa-') && !['fa-solid', 'fa-fw'].includes(it)),
                            label: it.querySelector('.fa-solid + span').textContent,
                        })),
                );
                resolve(checkboxList);
            }
        });
    }
    return await loadPromise;
};
