const init = ()=>{
    let toggle;
    const drawer = document.createElement('div'); {
        drawer.classList.add('drawer');
        toggle = document.createElement('div'); {
            toggle.classList.add('drawer-toggle');
            const icon = document.createElement('div'); {
                icon.classList.add('drawer-icon', 'closedIcon');
                icon.classList.add('fa-solid', 'fa-fw', 'fa-code');
                icon.title = 'Quick Replies';
                toggle.append(icon);
            }
            drawer.append(toggle);
        }
        const content = document.createElement('div'); {
            content.classList.add('drawer-content');
            // const title = document.createElement('h3'); {
            //     title.textContent = 'Quick Replies';
            //     content.append(title);
            // }
            const qrContainer = document.querySelector('#qr_container');
            qrContainer.querySelector('.inline-drawer-toggle').dispatchEvent(new Event('click', { bubbles:true }));
            content.append(qrContainer);
            drawer.append(content);
        }
    }
    const anchor = document.querySelector('#extensions-settings-button');
    anchor.insertAdjacentElement('afterend', drawer);
    $(toggle).on('click', $._data(anchor.querySelector('.drawer-toggle'), 'events').click[0].handler);
};
init();
