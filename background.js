chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabID: tab.id},
        files: ['content.js']
    })
})