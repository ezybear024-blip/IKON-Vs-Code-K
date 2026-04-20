let editor;

require.config({
 paths:{
  'vs':'https://unpkg.com/monaco-editor@0.45.0/min/vs'
 }
});

require(['vs/editor/editor.main'], function(){
    editor = monaco.editor.create(document.getElementById('editor'),{
        value:'',
        language:'javascript',
        theme:'vs',
        automaticLayout:true,
        fontSize: 14,
        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        wordWrap: 'on',
        minimap: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        formatOnPaste: true,
        formatOnType: true
    });

    // HTML tag suggestions (e.g., <h1>, <head>, <div>)
    monaco.languages.registerCompletionItemProvider('html', {
        triggerCharacters: ['<'],
        provideCompletionItems: () => {
            const tags = [
                'html','head','body','div','span','h1','h2','h3','h4','h5','h6',
                'p','a','ul','ol','li','section','article','header','footer','nav','main',
                'script','style','link','meta','title','img','button','input','form','label',
                'table','thead','tbody','tr','td','th','br','hr'
            ];
            return {
                suggestions: tags.map(tag => {
                    const isSelfClosing = ['br','hr','img','meta','link','input'].includes(tag);
                    const insertText = isSelfClosing ? `<${tag} />` : `<${tag}>$1</${tag}>`;
                    return {
                        label: tag,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'HTML tag',
                        documentation: `Insert <${tag}> tag`
                    };
                })
            };
        }
    });
    
    editor.onDidChangeModelContent(() => {
        if(activeTabId){
            const activeTab = openTabs.find(t => t.id === activeTabId);
            if(activeTab){
                activeTab.content = editor.getValue();
            }
        }
    });

    initEditorSync();
    renderEditor();
    
    // Sync theme with Monaco
    const savedTheme = localStorage.getItem('vscode-theme') || 'light';
    setTheme(savedTheme);
});

document.addEventListener('DOMContentLoaded', () => {
    initResizers();
    renderExplorer();
    initActivityBar();
    initTerminal();
    initKeyboardShortcuts();
    initContextMenu();
    initDropdowns();
    initTheme();
});

// --- File System State ---
const fileSystem = {
    id: "root",
    name: "vscode-clone-project",
    type: "folder",
    expanded: true,
    children: [
        { id: "1", name: "index.html", type: "file", language: "html", content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Clone</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>" },
        { id: "2", name: "style.css", type: "file", language: "css", content: "body {\n  background-color: #1e1e1e;\n  color: #d4d4d4;\n}" },
        { id: "3", name: "script.js", type: "file", language: "javascript", content: "console.log('Welcome to JS');\n\nfunction init() {\n  // do something\n}" },
        { id: "4", name: "lib", type: "folder", expanded: true, children: [
            { id: "5", name: "main.dart", type: "file", language: "dart", content: "import 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(const MyApp());\n}\n\nclass MyApp extends StatelessWidget {\n  const MyApp({super.key});\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(\n      home: Scaffold(\n        appBar: AppBar(title: const Text('Flutter App')),\n        body: const Center(child: Text('Hello World')),\n      ),\n    );\n  }\n}" }
        ]}
    ]
};

let openTabs = [];
let activeTabId = null;

// --- Resizers ---
function initResizers() {
    const sidebar = document.getElementById('sidebar');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const bottomPanel = document.getElementById('bottom-panel');
    const panelResizer = document.getElementById('panel-resizer');
    
    let isResizingSidebar = false;
    let isResizingPanel = false;

    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizingSidebar = true;
        sidebarResizer.classList.add('active');
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
    });

    panelResizer.addEventListener('mousedown', (e) => {
        isResizingPanel = true;
        panelResizer.classList.add('active');
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (isResizingSidebar) {
            const newWidth = e.clientX - 48; // 48px is the activity bar width
            if (newWidth > 150 && newWidth < 600) {
                sidebar.style.width = newWidth + 'px';
            }
        } else if (isResizingPanel) {
            const bottomOffset = window.innerHeight - e.clientY - 22; // 22px is the status bar
            if (bottomOffset > 100 && bottomOffset < window.innerHeight - 200) {
                bottomPanel.style.height = bottomOffset + 'px';
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isResizingSidebar) {
            isResizingSidebar = false;
            sidebarResizer.classList.remove('active');
            document.body.style.cursor = 'default';
        }
        if (isResizingPanel) {
            isResizingPanel = false;
            panelResizer.classList.remove('active');
            document.body.style.cursor = 'default';
        }
    });
}

// --- Explorer Rendering ---
function renderExplorer() {
    const sidebarContent = document.getElementById('sidebar-content');
    sidebarContent.innerHTML = ''; 
    const rootEl = createTreeNode(fileSystem, 0);
    sidebarContent.appendChild(rootEl);
}

function createTreeNode(node, depth) {
    const el = document.createElement('div');
    el.className = 'tree-node';
    
    const nodeRow = document.createElement('div');
    nodeRow.className = 'tree-node-row';
    nodeRow.style.paddingLeft = (depth * 15 + 10) + 'px';
    
    const iconEl = document.createElement('i');
    if (node.type === 'folder') {
        iconEl.className = node.expanded ? 'fa-solid fa-chevron-down folder-icon' : 'fa-solid fa-chevron-right folder-icon';
        iconEl.style.marginRight = '5px';
        iconEl.style.width = '12px';
    } else {
        if (node.name.endsWith('.html')) iconEl.className = 'fa-brands fa-html5 file-icon html-icon';
        else if (node.name.endsWith('.css')) iconEl.className = 'fa-brands fa-css3-alt file-icon css-icon';
        else if (node.name.endsWith('.js')) iconEl.className = 'fa-brands fa-js file-icon js-icon';
        else if (node.name.endsWith('.dart')) iconEl.className = 'fa-brands fa-flutter file-icon dart-icon';
        else iconEl.className = 'fa-regular fa-file file-icon';
        
        iconEl.style.marginRight = '5px';
        iconEl.style.width = '14px';
        iconEl.style.textAlign = 'center';
    }
    
    const nameEl = document.createElement('span');
    nameEl.textContent = node.name;
    
    nodeRow.appendChild(iconEl);
    nodeRow.appendChild(nameEl);
    el.appendChild(nodeRow);
    
    nodeRow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (node.type === 'folder') {
            node.expanded = !node.expanded;
            renderExplorer();
        } else {
            openFile(node);
        }
    });
    
    if (node.type === 'folder' && node.expanded && node.children) {
        const childrenContainer = document.createElement('div');
        node.children.forEach(child => {
            childrenContainer.appendChild(createTreeNode(child, depth + 1));
        });
        el.appendChild(childrenContainer);
    }
    return el;
}

// --- Editor and Tabs ---
function openFile(node) {
    const existingIndex = openTabs.findIndex(t => t.id === node.id);
    if (existingIndex === -1) {
        openTabs.push(node);
    }
    activeTabId = node.id;
    renderTabs();
    renderEditor();
}

function renderTabs() {
    const tabsContainer = document.getElementById('editor-tabs');
    tabsContainer.innerHTML = '';
    
    openTabs.forEach(tabData => {
        const tabEl = document.createElement('div');
        tabEl.className = 'tab ' + (tabData.id === activeTabId ? 'active' : '');
        
        let iconClass = 'fa-regular fa-file';
        let iconColor = '#555555';
        if (tabData.name.endsWith('.html')) { iconClass = 'fa-brands fa-html5'; iconColor = '#e34c26'; }
        if (tabData.name.endsWith('.css')) { iconClass = 'fa-brands fa-css3-alt'; iconColor = '#264de4'; }
        if (tabData.name.endsWith('.js')) { iconClass = 'fa-brands fa-js'; iconColor = '#f7df1e'; }
        if (tabData.name.endsWith('.dart')) { iconClass = 'fa-brands fa-flutter'; iconColor = '#0175C2'; }
        
        tabEl.innerHTML = `
            <i class="tab-icon ${iconClass}" style="color: ${iconColor}"></i>
            <span>${tabData.name}</span>
            <i class="fa-solid fa-xmark tab-close"></i>
        `;
        
        tabEl.addEventListener('click', () => {
            activeTabId = tabData.id;
            renderTabs();
            renderEditor();
        });
        
        const closeBtn = tabEl.querySelector('.tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabData.id);
        });
        
        tabsContainer.appendChild(tabEl);
    });
}

function closeTab(id) {
    const index = openTabs.findIndex(t => t.id === id);
    if (index !== -1) {
        openTabs.splice(index, 1);
        if (openTabs.length > 0) {
            activeTabId = openTabs[Math.max(0, index - 1)].id;
        } else {
            activeTabId = null;
        }
        renderTabs();
        renderEditor();
    }
}

function renderEditor() {
 const langStatus = document.getElementById('status-language');

 if (activeTabId && editor) {
  const activeTab = openTabs.find(t => t.id === activeTabId);
  editor.setValue(activeTab.content || '');
  const lang = activeTab.language || "plaintext";
  monaco.editor.setModelLanguage(editor.getModel(), lang);
  langStatus.textContent = lang.toUpperCase();
 } else if(editor){
  editor.setValue('');
 }
}

// --- Editor Sync ---
function initEditorSync() {
    const statusLineCol = document.getElementById('status-line-col');
    
    if (!editor) return;

    editor.onDidChangeCursorPosition((e) => {
        statusLineCol.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });
}

// --- Terminal ---
function initTerminal() {
    const termInput = document.getElementById('terminal-input');
    const termOutput = document.getElementById('terminal-output');
    const panelContent = document.getElementById('terminal-content');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const bottomPanel = document.getElementById('bottom-panel');

    closePanelBtn.addEventListener('click', () => {
        bottomPanel.style.display = 'none';
    });

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = termInput.value.trim();
            if (cmd) {
                termOutput.innerHTML += `<div><span class="prompt">PS C:\\User\\Dev&gt;</span> ${escapeHtml(cmd)}</div>`;
                processCommand(cmd, termOutput);
                termInput.value = '';
                panelContent.scrollTop = panelContent.scrollHeight;
            }
        }
    });
}

function processCommand(cmd, outputEl) {
    const args = cmd.split(' ');
    const command = args[0].toLowerCase();
    const outputDiv = document.createElement('div');
    outputDiv.style.marginBottom = '5px';

    if (command === 'help') {
        outputDiv.innerHTML = `Available commands:<br> help  - Show this message<br> clear - Clear the terminal<br> echo  - Print text to the terminal`;
    } else if (command === 'clear') {
        outputEl.innerHTML = '';
        return; 
    } else if (command === 'echo') {
        outputDiv.textContent = args.slice(1).join(' ');
    } else {
        outputDiv.innerHTML = `<span style="color: #f48771;">${escapeHtml(command)} : The term '${escapeHtml(command)}' is not recognized.</span>`;
    }
    
    if (outputDiv.innerHTML) {
        outputEl.appendChild(outputDiv);
    }
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// --- Activity Bar ---
function initActivityBar() {
    const activityIcons = document.querySelectorAll('.activity-top .activity-icon');
    const sidebarTitle = document.getElementById('sidebar-title');
    const sidebarContent = document.getElementById('sidebar-content');

    activityIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            activityIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            
            const panel = icon.getAttribute('data-panel');
            sidebarTitle.textContent = panel.replace('-', ' ').toUpperCase();
            
            if (panel === 'explorer') {
                renderExplorer();
            } else {
                sidebarContent.innerHTML = `<div style="padding: 20px; text-align: center; color: #858585;">
                    <i class="${icon.querySelector('i').className}" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p>This is the mock ${panel} panel.</p>
                </div>`;
            }
        });
    });
}

// --- Context Menu ---
function initContextMenu() {
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
        <div class="context-item" id="ctx-new-file">New File</div>
        <div class="context-item" id="ctx-new-folder">New Folder</div>
        <div class="context-separator"></div>
        <div class="context-item" id="ctx-delete">Delete</div>
    `;
    document.body.appendChild(contextMenu);

    let activeNodeForContext = null;

    document.getElementById('sidebar-content').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const row = e.target.closest('.tree-node-row');
        if (row) {
            document.querySelectorAll('.tree-node-row').forEach(r => r.classList.remove('active'));
            row.classList.add('active');
            const nameNode = row.querySelector('span');
            if (nameNode) {
                 activeNodeForContext = findNodeByName(fileSystem, nameNode.textContent);
            }
        } else {
            activeNodeForContext = fileSystem;
        }

        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
    });

    document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        document.querySelectorAll('.tree-node-row').forEach(r => r.classList.remove('active'));
    });

    document.getElementById('ctx-new-file').addEventListener('click', () => {
        const name = prompt("Enter file name (e.g., test.js):");
        if (name && activeNodeForContext) {
            const parent = activeNodeForContext.type === 'folder' ? activeNodeForContext : fileSystem;
            if(!parent.children) parent.children = [];
            parent.children.push({
                id: Date.now().toString(), name: name, type: 'file', content: ''
            });
            renderExplorer();
        }
    });

    document.getElementById('ctx-delete').addEventListener('click', () => {
        if (activeNodeForContext && activeNodeForContext.id !== 'root') {
            if (confirm(`Delete '${activeNodeForContext.name}'?`)) {
                removeNode(fileSystem, activeNodeForContext.id);
                closeTab(activeNodeForContext.id);
                renderExplorer();
            }
        }
    });
}

function findNodeByName(node, name) {
    if (node.name === name) return node;
    if (node.children) {
        for (let child of node.children) {
            const found = findNodeByName(child, name);
            if (found) return found;
        }
    }
    return null;
}

function removeNode(parent, id) {
    if (parent.children) {
        const index = parent.children.findIndex(c => c.id === id);
        if (index > -1) {
            parent.children.splice(index, 1);
            return true;
        }
        for (let child of parent.children) {
            if (removeNode(child, id)) return true;
        }
    }
    return false;
}

// --- Keyboard Shortcuts ---
function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    const statusBar = document.querySelector('.status-bar');
                    statusBar.style.opacity = '0.5';
                    setTimeout(() => statusBar.style.opacity = '1', 150);
                    break;
                case '\`':
                    e.preventDefault();
                    const panel = document.getElementById('bottom-panel');
                    if (panel) {
                        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
                    }
                    break;
            }
        }
    });
}

// --- Dropdown Menus ---
const menuData = {
    'menu-file': [{ label: 'New File...', shortcut: 'Ctrl+N' }, { label: 'Save', shortcut: 'Ctrl+S' }, { type: 'separator' }, { label: 'Exit' }],
    'menu-edit': [{ label: 'Undo', shortcut: 'Ctrl+Z' }, { label: 'Redo', shortcut: 'Ctrl+Y' }],
    'menu-view': [{ label: 'Explorer', shortcut: 'Ctrl+Shift+E' }, { label: 'Terminal', shortcut: 'Ctrl+`' }],
    'menu-help': [{ label: 'Welcome' }, { label: 'Documentation' }],
    'manage-menu-btn': [
        { label: 'Color Theme' },
        { type: 'separator' },
        { label: 'Settings', shortcut: 'Ctrl+,' }
    ]
};

function initDropdowns() {
    const menuItems = document.querySelectorAll('.title-bar-menu .menu-item');
    let activeDropdown = null;

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const menuId = item.id;
            if (activeDropdown && activeDropdown.id === `dropdown-${menuId}`) {
                closeDropdown();
            } else {
                showDropdown(item, menuId);
            }
        });

        item.addEventListener('mouseenter', () => {
            if (activeDropdown && !item.id.includes('manage')) {
                showDropdown(item, item.id);
            }
        });
    });

    const manageBtn = document.getElementById('manage-menu-btn');
    if (manageBtn) {
        manageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (activeDropdown && activeDropdown.id === 'dropdown-manage-menu-btn') {
                closeDropdown();
            } else {
                showDropdown(manageBtn, 'manage-menu-btn', true);
            }
        });
    }

    document.addEventListener('click', closeDropdown);

    function showDropdown(anchor, menuId, isBottom = false) {
        closeDropdown();
        const data = menuData[menuId];
        if (!data) return;

        anchor.classList.add('active');
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu active';
        dropdown.id = `dropdown-${menuId}`;
        
        const rect = anchor.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        
        if (isBottom) {
            dropdown.style.bottom = (window.innerHeight - rect.top) + 'px';
            dropdown.style.top = 'auto';
            dropdown.style.borderRadius = '4px 4px 0 0';
        } else {
            dropdown.style.top = rect.bottom + 'px';
        }

        data.forEach(entry => {
            if (entry.type === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'dropdown-separator';
                dropdown.appendChild(sep);
            } else {
                const row = document.createElement('div');
                row.className = 'dropdown-item';
                row.innerHTML = `<span>${entry.label}</span>${entry.shortcut ? `<span class="shortcut">${entry.shortcut}</span>` : ''}`;
                row.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleMenuAction(entry.label);
                    closeDropdown();
                });
                dropdown.appendChild(row);
            }
        });

        document.body.appendChild(dropdown);
        activeDropdown = dropdown;
    }

    function handleMenuAction(label) {
        if (label === 'Color Theme') {
            toggleTheme();
        }
    }

    function closeDropdown() {
        if (activeDropdown) {
            activeDropdown.remove();
            activeDropdown = null;
        }
        document.querySelectorAll('.menu-item, .activity-icon').forEach(m => m.classList.remove('active'));
    }
}

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('vscode-theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (editor) monaco.editor.setTheme('vs-dark');
    } else {
        document.body.classList.remove('dark-mode');
        if (editor) monaco.editor.setTheme('vs');
    }
    localStorage.setItem('vscode-theme', theme);
}