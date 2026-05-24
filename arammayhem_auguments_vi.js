// ==UserScript==
// @name         ARAM Mayhem Augments - Vietnamese Translator
// @namespace    https://github.com/sirhvd/arammayhem_auguments_vi
// @version      1.2
// @description  Việt hóa tên và mô tả các Lõi (Augments) trên MetaSrc.
// @author       HVD
// @match        https://www.metasrc.com/lol/arena/build/*
// @match        https://www.metasrc.com/lol/mayhem/build/*
// @match        https://www.metasrc.com/lol/arena/tier-list/augments
// @match        https://www.metasrc.com/lol/mayhem/tier-list/augments
// @match        https://arammayhem.com/augments/
// @match        https://arammayhem.com/build/*
// @match        https://arammayhem.com/combo/*
// @match        https://arammayhem.com/tools/ryze-simulator/
// @match        https://arammayhem.com/tools/vladimir-simulator/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=metasrc.com
// @homepageURL  https://github.com/sirhvd/arammayhem_auguments_vi
// @downloadURL  https://raw.githubusercontent.com/sirhvd/arammayhem_auguments_vi/main/arammayhem_auguments_vi.js
// @updateURL    https://raw.githubusercontent.com/sirhvd/arammayhem_auguments_vi/main/arammayhem_auguments_vi.meta.js
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const JSON_URL = 'https://raw.githubusercontent.com/sirhvd/arammayhem_auguments_vi/main/augments.json';

    const replaceText = (el, info) => {
        if (!el || el.dataset.translated) return;
        el.innerText = `${el.innerText}\n${info.vn_name}`;
        el.dataset.translated = "true";
    };

    const fetchAugmentData = new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: JSON_URL,
            onload: (res) => {
                const data = JSON.parse(res.responseText);
                const idMap = new Map();
                const nameMap = new Map();

                data.forEach(item => {
                    idMap.set(Number(item.id), item);
                    if (item.en_name) {
                      nameMap.set(item.en_name.toLowerCase().replace(/[\s]/g, ''), item);
                      nameMap.set(item.en_name.toLowerCase().replace(/[\s']/g, ''), item);
                    }
                });

                resolve({ idMap, nameMap });
            },
            onerror: reject
        });
    });

    const Translator = {
        metaSrc(maps) {
            const uiSelector = 'div._je89v2-3._cn8bui div[data-tooltip^="augment-"]';
            document.querySelectorAll(uiSelector).forEach(el => {
                const augId = Number(el.getAttribute('data-tooltip').split('-').pop());
                const info = maps.idMap.get(augId);
                const strong = el.querySelector('strong');
                if (info && strong && !strong.dataset.translated) {
                    strong.innerText = `${info.vn_name} (${info.en_name})`;
                    strong.dataset.translated = "true";
                }
            });

            document.querySelectorAll('#augmentSelect option').forEach(opt => {
                const info = maps.idMap.get(Number(opt.value));
                if (info && !opt.dataset.translated) {
                    opt.textContent = `${info.vn_name} (${opt.textContent})`;
                    opt.dataset.translated = "true";
                }
            });

            let attempts = 0;
            const checkTooltips = setInterval(() => {
                const tooltips = unsafeWindow.Tooltips?.tooltips;
                if (tooltips) {
                    Object.keys(tooltips).forEach(key => {
                        if (key.startsWith('augment-')) {
                            const augId = Number(key.split('-').pop());
                            const info = maps.idMap.get(augId);
                            if (info && tooltips[key].vars) {
                                tooltips[key].vars.name = `${info.vn_name} (${info.en_name})`;
                                if (info.desc) {
                                    tooltips[key].vars.description = `<div>${info.desc}</div>`;
                                }
                            }
                        }
                    });
                    clearInterval(checkTooltips);
                }
                if (++attempts > 20) clearInterval(checkTooltips);
            }, 500);
        },

        aramMayhem(maps) {

            GM_addStyle('.font-medium { text-wrap: auto !important; }');

            const path = location.pathname;
            let selector = "";

            if (path.includes('/build/')) {
                selector = 'a:is([href*="/augments/"], [href*="/combo/"]) span.font-medium:not([data-slot], [class*="text-stat-"])';
            } else if (path.endsWith('/combo/')) {
                selector = 'div.flex-1.min-w-0 > a > div > span:nth-child(1)';
            } else if (path.endsWith('/augments/')) {
                selector = 'a[href*="/augments/"] h3';
            } else if (path.includes('-simulator/')) {
                selector = 'div.flex.items-center.justify-between.gap-2 > div > div';
            }

            if (selector) {
                document.querySelectorAll(selector).forEach(el => {

                    if (el.innerText === "Void Immolation") el.innerText = "Quest: Icathia's Fall";
                    const info = maps.nameMap.get(el.innerText.toLowerCase().replace(/[\s]/g, ''));
                    if (info) replaceText(el, info);
                });
            }
        }
    };

    fetchAugmentData.then(maps => {
        setTimeout(() => {
            if (location.host.includes('metasrc.com')) {
                Translator.metaSrc(maps);
            } else if (location.host.includes('arammayhem.com')) {
                Translator.aramMayhem(maps);
            }
        }, 500);
    }).catch(err => console.error("Translator Error:", err));

})();
