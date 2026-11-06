// ==UserScript==
// @name         Kinopoisk → Flicksbar
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Добавляет справа от «Буду смотреть» и «Купить и смотреть» кнопку-клон с иконкой play, ведущую на kinokino.red
// @match        https://www.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const LABEL = 'Смотреть на Flicksbar';
    const MARK = 'data-kk-clone';
    const WRAP = 'data-kk-wrap';

    // Тексты кнопок-«оригиналов», рядом с которыми нужно вставить клон
    const ORIGINAL_TEXTS = [
        'Буду смотреть',
        'Купить и смотреть'
    ];

    // Ищем кнопки по ТЕКСТУ (классы/title обфусцированы)
    function findOriginals() {
        const result = [];
        for (const el of document.querySelectorAll('button, [role="button"]')) {
            if (el.hasAttribute(MARK)) continue;
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (ORIGINAL_TEXTS.includes(text)) result.push(el);
        }
        return result;
    }

    // Иконка play — инлайновый SVG, чтобы не зависеть от обфусцированных классов
    function makePlayIcon(size = 16) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.flexShrink = '0';
        svg.style.display = 'block';
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M8 5v14l11-7z');
        svg.appendChild(path);
        return svg;
    }

    function makeClone(original) {
        const clone = original.cloneNode(true);
        clone.setAttribute(MARK, '1');
        clone.setAttribute('type', 'button');
        clone.removeAttribute('title');
        clone.removeAttribute('aria-pressed');
        clone.removeAttribute('id');
        clone.removeAttribute('data-tid');
        clone.style.flexShrink = '0';

        // Запоминаем класс-обёртку иконки (style_iconLeft__*) — он задаёт отступы/размеры
        const origIconWrap = original.querySelector('[class*="iconLeft"]');
        const iconWrapClass = origIconWrap ? origIconWrap.className : '';

        // Сбрасываем содержимое и собираем заново: иконка + текст
        clone.textContent = '';

        const iconWrap = document.createElement('span');
        if (iconWrapClass) iconWrap.className = iconWrapClass;
        iconWrap.style.cssText =
            'display:inline-flex;align-items:center;justify-content:center;';
        iconWrap.appendChild(makePlayIcon(16));
        clone.appendChild(iconWrap);

        const text = document.createElement('span');
        text.textContent = LABEL;
        clone.appendChild(text);

        clone.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = new URL(location.href);
            url.hostname = 'kinokino.red';
            window.open(url.toString(), '_blank', 'noopener');
        });

        return clone;
    }

    function inject() {
        for (const original of findOriginals()) {
            const parent = original.parentNode;
            if (!parent) continue;
            if (parent.hasAttribute(WRAP)) continue;

            const wrap = document.createElement('div');
            wrap.setAttribute(WRAP, '1');
            wrap.style.cssText =
                'display:inline-flex;gap:8px;align-items:center;vertical-align:middle;';

            parent.insertBefore(wrap, original);
            wrap.appendChild(original);
            wrap.appendChild(makeClone(original));
        }
    }

    const obs = new MutationObserver(() => inject());
    obs.observe(document.documentElement, { childList: true, subtree: true });

    inject();
})();
