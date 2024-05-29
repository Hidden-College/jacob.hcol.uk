// Encoded contact details (placeholders: replace these with your actual base64 encoded strings)
const encodedData = {
    email_addr: 'd2FsY2h!1az!IwM!ThA###a$WNs!!b3!VkLmNvbQ==',
    email_link: 'bWFpbHRvOn#dhb!GN!odW!!syMDE4QGlj$$$$bG91$$$ZC5jb20=',
    wechat_id: 'SUQ6IHlhcX##V$$icm9saQ==',
    wechat_link: 'aHR0cHM6!!Ly93$$$YS5t%%%ZS9^^xci9a&&&WEg3QzVOSEpOT0xDMQ==',
    whatsapp_id: 'KzQ0IDc1MTk!!gNj@@E^1IDA2Ng==',
    whatsapp_link: 'aHR0cHM6$Ly$93YS5tZS9xc$$$i9aW!!!Eg3Q!!!zVOSEpO$$$T0xDMQ=='
};

// Helper function to decode base64 strings after cleansing non-base64 characters
function decodeBase64(encodedStr) {
    const cleansedStr = encodedStr.replace(/[^A-Za-z0-9+/=]/g, ''); // Remove non-base64 chars
    return atob(cleansedStr);
}

// Function to create or update the contact box
function updateContactBox(type) {
    const mainElement = document.querySelector('main');
    if (!mainElement) return; // Exit if <main> is not found

    let box = mainElement.querySelector('.contactBox');
    if (!box) {
        box = document.createElement('div');
        box.className = 'contactBox';
        mainElement.appendChild(box);
    }

    // Setting the appropriate content based on the type
    let content;
    switch (type) {
        case 'email':
            content = `<a href="${decodeBase64(encodedData.email_link)}">${decodeBase64(encodedData.email_addr)}</a>`;
            break;
        case 'wechat':
            content = `<a href="${decodeBase64(encodedData.wechat_link)}">${decodeBase64(encodedData.wechat_id)}</a>`;
            break;
        case 'whatsapp':
            content = `<a href="${decodeBase64(encodedData.whatsapp_link)}">${decodeBase64(encodedData.whatsapp_id)}</a>`;
            break;
        default:
            content = 'Invalid contact type';
    }

    box.innerHTML = content; // Update or set the content of the box
}

// Event listener to listen for hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash === '#email' || hash === '#wechat' || hash === '#whatsapp') {
        updateContactBox(hash.substring(1)); // Remove the '#' and pass the result
    }
});

// Initial check in case the page loads with a specific hash
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash === '#email' || hash === '#wechat' || hash === '#whatsapp') {
        updateContactBox(hash.substring(1));
    }
});
