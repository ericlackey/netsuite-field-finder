/*
*
* This script runs in the background and communicates Chrome storage changes to other windows
*
*/

// Listen for changes to field filter fields that could be coming from other iFrames or browsers
chrome.storage.onChanged.addListener(function (changes, namespace) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, changes, function(response) {});  
    });
    return;
});