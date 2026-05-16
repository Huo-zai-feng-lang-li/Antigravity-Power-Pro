/**
 * Manager Panel 通用 DOM 工具。
 */

export function querySelectorAllDeep(selector, root = document) {
    const list = [];
    function traverse(node) {
        if (!node?.querySelectorAll) return;
        node.querySelectorAll(selector).forEach((el) => list.push(el));
        node.querySelectorAll("*").forEach((child) => {
            if (child.shadowRoot) traverse(child.shadowRoot);
        });
    }
    traverse(root);
    return list;
}
