// 完整版: Hook fetch 请求, 收集 StreamCascadeReactiveUpdates 的二进制数据.
// 使用方法: 在浏览器控制台粘贴执行, 然后切换或重新加载对话.

(function () {
    console.log('[Hook] 开始监听...');

    const originalFetch = window.fetch;

    // 全局存储.
    window.__cascadeData = {
        requests: [],
        allBytes: [], // 所有原始字节.
    };

    window.fetch = async function (url, options) {
        const urlStr = typeof url === 'string' ? url : url.url || url.toString();

        if (urlStr.includes('StreamCascadeReactiveUpdates')) {
            console.log('[Hook] 🎯 捕获请求');

            const response = await originalFetch.apply(this, arguments);
            const clonedResponse = response.clone();

            (async () => {
                try {
                    const reader = clonedResponse.body.getReader();
                    let chunkCount = 0;
                    let totalBytes = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunkCount++;
                        totalBytes += value.length;

                        // 保存原始 Uint8Array.
                        window.__cascadeData.allBytes.push(value);

                        // 打印每个 chunk 的信息.
                        console.log(`[Hook] Chunk ${chunkCount}: ${value.length} bytes`);

                        // 显示前 50 字节的十六进制.
                        const hex = Array.from(value.slice(0, 50))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join(' ');
                        console.log(`[Hook] Hex: ${hex}`);

                        // 尝试找出可读文本 (跳过不可打印字符).
                        let readable = '';
                        for (let i = 0; i < value.length; i++) {
                            const byte = value[i];
                            if (byte >= 32 && byte < 127) {
                                readable += String.fromCharCode(byte);
                            } else if (readable.length > 0) {
                                readable += ' ';
                            }
                        }
                        if (readable.trim().length > 10) {
                            console.log(`[Hook] 可读文本: ${readable.slice(0, 200)}`);
                        }
                    }

                    console.log(`[Hook] ✅ 流结束，共 ${chunkCount} chunks, ${totalBytes} bytes`);

                } catch (e) {
                    console.error('[Hook] 读取失败:', e);
                }
            })();

            return response;
        }

        return originalFetch.apply(this, arguments);
    };

    // 工具函数.
    window.__cascadeUtils = {
        // 查看统计.
        stats: () => {
            const data = window.__cascadeData;
            const totalBytes = data.allBytes.reduce((sum, arr) => sum + arr.length, 0);
            console.log('Chunks 数:', data.allBytes.length);
            console.log('总字节数:', totalBytes);
        },

        // 合并所有 chunks 为单个 Uint8Array.
        getMergedBytes: () => {
            const chunks = window.__cascadeData.allBytes;
            const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
            const merged = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                merged.set(chunk, offset);
                offset += chunk.length;
            }
            return merged;
        },

        // 导出为 Base64 (方便分析).
        exportBase64: () => {
            const merged = window.__cascadeUtils.getMergedBytes();
            const binary = String.fromCharCode.apply(null, merged);
            const base64 = btoa(binary);
            console.log('Base64 长度:', base64.length);
            return base64;
        },

        // 下载二进制文件.
        downloadBinary: () => {
            const merged = window.__cascadeUtils.getMergedBytes();
            const blob = new Blob([merged], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cascade-data-' + Date.now() + '.bin';
            a.click();
            URL.revokeObjectURL(url);
            console.log('[Hook] 二进制文件已下载');
        },

        // 提取所有可读文本.
        extractReadableText: () => {
            const merged = window.__cascadeUtils.getMergedBytes();
            let readable = '';
            let currentWord = '';

            for (let i = 0; i < merged.length; i++) {
                const byte = merged[i];
                // 可打印 ASCII + 中文 UTF-8 (0x80+).
                if ((byte >= 32 && byte < 127) || byte >= 0x80) {
                    currentWord += String.fromCharCode(byte);
                } else {
                    if (currentWord.length > 3) {
                        readable += currentWord + '\n';
                    }
                    currentWord = '';
                }
            }

            console.log('可读文本片段:', readable.slice(0, 2000));
            return readable;
        },

        // 分析 protobuf 结构 (简化版).
        analyzeProtobuf: () => {
            const merged = window.__cascadeUtils.getMergedBytes();
            console.log('分析 protobuf 结构...');
            console.log('总长度:', merged.length);

            // 统计特殊字节.
            let zeros = 0, highBytes = 0;
            for (let i = 0; i < merged.length; i++) {
                if (merged[i] === 0) zeros++;
                if (merged[i] >= 0x80) highBytes++;
            }
            console.log('零字节数:', zeros);
            console.log('高位字节数 (>=0x80):', highBytes);

            // 查找常见的 protobuf field 标签.
            // protobuf 字段格式: (field_number << 3) | wire_type.
            // wire_type: 0=varint, 2=length-delimited.
            const fieldTags = new Map();
            for (let i = 0; i < Math.min(merged.length, 1000); i++) {
                const byte = merged[i];
                if (byte < 0x80) { // 单字节 varint.
                    const fieldNum = byte >> 3;
                    const wireType = byte & 0x07;
                    if (fieldNum > 0 && fieldNum < 20 && wireType <= 2) {
                        const key = `field ${fieldNum}, type ${wireType}`;
                        fieldTags.set(key, (fieldTags.get(key) || 0) + 1);
                    }
                }
            }
            console.log('可能的 protobuf 字段:', Object.fromEntries(fieldTags));
        },

        // 清空.
        clear: () => {
            window.__cascadeData = { requests: [], allBytes: [] };
            console.log('[Hook] 数据已清空');
        }
    };

    console.log('[Hook] ✅ Hook 已安装');
    console.log('工具: __cascadeUtils.stats() / .downloadBinary() / .extractReadableText() / .analyzeProtobuf()');
})();
