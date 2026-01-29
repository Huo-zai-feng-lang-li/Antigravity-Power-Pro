/**
 * Cascade Panel 内容提取模块
 *
 * 本模块负责从 DOM 中提取格式化内容并转换为 Markdown 格式，
 * 用于复制功能。支持的内容类型包括：
 * - 代码块（带语言标识）
 * - 表格（转换为 Markdown 表格）
 * - 数学公式（恢复 LaTeX 源码）
 * - Mermaid 图表（恢复源码）
 *
 * 使用 TreeWalker 线性遍历 DOM，通过跳跃机制避免重复处理嵌套结构。
 */

import {
    BUTTON_CLASS,
    COMMON_LANGS,
    MERMAID_SOURCE_PROP,
    RAW_TEXT_PROP,
} from './constants.js';
import { getClassString } from './utils.js';

/**
 * 将表格节点转换为 Markdown 表格字符串
 * @param {HTMLTableElement} tableEl
 * @returns {string}
 * 边界：仅处理文本内容，忽略复杂单元格结构（合并单元格等）
 */
const extractTable = (tableEl) => {
    let markdown = '';
    const rows = tableEl.querySelectorAll('tr');

    rows.forEach((row, rowIdx) => {
        const cells = row.querySelectorAll('th, td');
        const cellContents = [];

        cells.forEach((cell) => {
            let cellText = cell.textContent || '';
            cellText = cellText.trim().replace(/\n/g, ' ').replace(/\|/g, '\\|');
            cellContents.push(cellText);
        });

        markdown += '| ' + cellContents.join(' | ') + ' |\n';

        if (rowIdx === 0 && row.querySelector('th')) {
            markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
        }
    });

    return markdown;
};

/**
 * 从 KaTeX 或 MathJax 的渲染结构中提取 LaTeX 源码
 * @param {Element} mathEl
 * @returns {string|null} 提取失败返回 null
 */
const extractLatexFromMath = (mathEl) => {
    const annotation = mathEl.querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
        const latex = annotation.textContent;
        const isDisplay = mathEl.closest('.katex-display') !== null;
        return isDisplay ? `$$${latex}$$` : `$${latex}$`;
    }

    if (mathEl.tagName === 'MJX-CONTAINER') {
        const ariaLabel = mathEl.getAttribute('aria-label');
        if (ariaLabel) {
            const isDisplay = mathEl.getAttribute('display') === 'true' ||
                mathEl.classList.contains('MathJax_Display');
            return isDisplay ? `$$${ariaLabel}$$` : `$${ariaLabel}$`;
        }
    }

    return null;
};

/**
 * 提取格式化内容（代码块、表格、数学公式、Mermaid 等）
 * @param {Element} element - 待提取的根节点
 * @param {boolean} [useRawText=true] - 是否优先使用缓存的原始文本
 * @returns {string}
 * 实现思路：使用 TreeWalker 线性遍历 DOM，遇到块级结构时输出对应 Markdown，
 * 并用 skipUntilEndOfBlock 跳过已处理节点，避免重复与嵌套干扰（性能优化）
 */
export const extractFormattedContent = (element, useRawText = true) => {
    const hasCodeBlock = element.querySelector(
        '[class*="language-"], .code-block, [aria-label^="highlighted-code"]'
    );
    const hasTable = element.querySelector('table');
    const hasMermaid = element.querySelector('.cascade-mermaid-container');

    if (!hasCodeBlock && !hasTable && !hasMermaid) {
        if (useRawText && element && element[RAW_TEXT_PROP] !== undefined) {
            return String(element[RAW_TEXT_PROP]).trim();
        }
    }

    let result = '';
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let currentNode;
    let skipUntilEndOfBlock = null;

    while ((currentNode = walker.nextNode())) {
        // 跳过已处理块级节点的内部子树，降低重复遍历成本
        if (skipUntilEndOfBlock && skipUntilEndOfBlock.contains(currentNode)) {
            continue;
        }
        skipUntilEndOfBlock = null;

        if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const classString = getClassString(currentNode);

            // 公式处理：优先从渲染 DOM 中恢复 LaTeX
            if (classString.includes('katex') && !classString.includes('katex-display')) {
                if (currentNode.classList.contains('katex')) {
                    const latex = extractLatexFromMath(currentNode);
                    if (latex) {
                        result += latex;
                        skipUntilEndOfBlock = currentNode;
                        continue;
                    }
                }
            }

            if (classString.includes('katex-display')) {
                const katexEl = currentNode.querySelector('.katex') || currentNode;
                const latex = extractLatexFromMath(katexEl);
                if (latex) {
                    result += `\n${latex}\n`;
                    skipUntilEndOfBlock = currentNode;
                    continue;
                }
            }

            if (currentNode.tagName === 'MJX-CONTAINER') {
                const latex = extractLatexFromMath(currentNode);
                if (latex) {
                    const isDisplay = currentNode.getAttribute('display') === 'true';
                    result += isDisplay ? `\n${latex}\n` : latex;
                    skipUntilEndOfBlock = currentNode;
                    continue;
                }
            }

            // Mermaid 容器：恢复源码，避免只复制 SVG
            if (classString.includes('cascade-mermaid-container')) {
                const source = currentNode[MERMAID_SOURCE_PROP];
                if (source) {
                    result += `\n\`\`\`mermaid\n${source}\n\`\`\`\n`;
                }
                skipUntilEndOfBlock = currentNode;
                continue;
            }

            if (currentNode.tagName === 'TABLE') {
                result += `\n${extractTable(currentNode)}\n`;
                skipUntilEndOfBlock = currentNode;
                continue;
            }

            // 代码块：保留语言标识与换行
            const langMatch = classString.match(/language-(\w+)/);
            if (langMatch) {
                const lang = langMatch[1];
                const codeBlock = currentNode.querySelector('.code-block');
                if (codeBlock) {
                    const lines = codeBlock.querySelectorAll('.line-content');
                    let codeContent = '';
                    lines.forEach((line, idx) => {
                        codeContent += line.textContent;
                        if (idx < lines.length - 1) codeContent += '\n';
                    });
                    result += `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n`;
                    skipUntilEndOfBlock = currentNode;
                }
                continue;
            }

            const ariaLabel = currentNode.getAttribute('aria-label') || '';
            if (ariaLabel.startsWith('highlighted-code') && !langMatch) {
                const codeBlock = currentNode.querySelector('.code-block');
                if (codeBlock) {
                    const lines = codeBlock.querySelectorAll('.line-content');
                    let codeContent = '';
                    lines.forEach((line, idx) => {
                        codeContent += line.textContent;
                        if (idx < lines.length - 1) codeContent += '\n';
                    });
                    result += `\n\`\`\`\n${codeContent}\n\`\`\`\n`;
                    skipUntilEndOfBlock = currentNode;
                }
            }
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
            const parent = currentNode.parentElement;
            if (parent) {
                // 跳过渲染器内部文本，避免重复或脏数据进入结果
                if (parent.closest('.katex, mjx-container, .MathJax, .cascade-mermaid-container')) {
                    continue;
                }
                if (parent.closest('[class*="language-"]')) {
                    continue;
                }

                const parentClassStr = getClassString(parent);
                if (
                    parentClassStr.includes('opacity-60') &&
                    parent.closest('pre')?.previousElementSibling
                ) {
                    continue;
                }

                const textContent = currentNode.textContent.trim().toLowerCase();
                if (
                    COMMON_LANGS.has(textContent) &&
                    parent.closest('pre')?.parentElement?.querySelector('[class*="language-"]')
                ) {
                    continue;
                }

                if (
                    parent.closest(`.${BUTTON_CLASS}`) ||
                    parent.closest('.custom-copy-btn')
                ) {
                    continue;
                }
            }
            result += currentNode.textContent;
        }
    }

    // 边界：最终统一 trim，避免首尾多余空白影响复制体验
    return result.trim();
};
