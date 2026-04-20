// Toggle folders in sidebar
const folderToggles = document.querySelectorAll('.folder-toggle');
folderToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        // Find the next sibling that is folder-content
        let content = toggle.nextElementSibling;
        const chevron = toggle.querySelector('.chevron');
        
        if (content && content.classList.contains('folder-content')) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                chevron.textContent = '▼';
                chevron.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                chevron.textContent = '▶';
                chevron.classList.add('collapsed');
            }
        }
    });
});

// File click handling
const files = document.querySelectorAll('.tree-item.file');
const tabsContainer = document.querySelector('.tabs-container');
const editorContents = document.querySelector('#editor-container');


files.forEach(file => {
    file.addEventListener('click', () => {
        const filename = file.dataset.file;
        if (!filename) return;
        
        // highlight sidebar
        document.querySelectorAll('.tree-item.file').forEach(f => f.classList.remove('selected'));
        file.classList.add('selected');

        openFile(filename);
    });
});

function openFile(filename) {
    // Make tab active or create new if not exists
    let tabs = document.querySelectorAll('.tab');
    let exists = false;

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.file === filename) {
            tab.classList.add('active');
            exists = true;
        }
    });

    if (!exists && filename) {
        const tabHTML = document.createElement('div');
        tabHTML.className = 'tab active';
        tabHTML.dataset.file = filename;
        tabHTML.innerHTML = `<i>📄</i> ${filename} <span class="tab-close">✕</span>`;
        tabsContainer.appendChild(tabHTML);
        
        // Add close event
        tabHTML.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tabHTML);
        });

        // Add click event
        tabHTML.addEventListener('click', () => {
            document.querySelectorAll('.tree-item.file').forEach(f => {
                f.classList.remove('selected');
                if(f.dataset.file === filename) f.classList.add('selected');
            });
            openFile(filename);
        });
    }

    // Hide welcome message and show editor
    document.getElementById('welcome-message').style.display = 'none';
    editorContents.style.display = 'block';

    // Update breadcrumb
    const breadcrumbFile = document.getElementById('editor-breadcrumb') ? document.getElementById('editor-breadcrumb').querySelector('span:last-child') : null;
    if(breadcrumbFile) {
        breadcrumbFile.textContent = filename;
    }

    // Set the editor content
    if (window.editor) {
        let language = 'plaintext';
        const extension = filename.split('.').pop();
        if (extension === 'js' || extension === 'jsx') {
            language = 'javascript';
        } else if (extension === 'css') {
            language = 'css';
        } else if (extension === 'html') {
            language = 'html';
        }

        // For this example, we'll just set some dummy content based on the file name.
        // In a real application, you would fetch the file content from a server or the local filesystem.
        let content = `// ${filename}\n\n`;
        if (language === 'javascript') {
            content += 'console.log("Hello, world!");';
        } else if (language === 'css') {
            content += 'body {\n  font-family: sans-serif;\n}';
        } else if (language === 'html') {
            content += '<h1>Hello, world!</h1>';
        }

        window.editor.setValue(content);
        monaco.editor.setModelLanguage(window.editor.getModel(), language);
    }
}

function closeTab(tabElement) {
    const filename = tabElement.dataset.file;
    const isActive = tabElement.classList.contains('active');
    tabElement.remove();

    if (isActive) {
        const remainingTabs = document.querySelectorAll('.tab');
        if (remainingTabs.length > 0) {
            const lastTab = remainingTabs[remainingTabs.length - 1];
            const nextFilename = lastTab.dataset.file;
            document.querySelectorAll('.tree-item.file').forEach(f => {
                f.classList.remove('selected');
                if(f.dataset.file === nextFilename) f.classList.add('selected');
            });
            openFile(nextFilename);
        } else {
            // no tabs open, show welcome message and hide editor
            document.getElementById('welcome-message').style.display = 'flex';
            editorContents.style.display = 'none';
            const breadcrumbFile = document.getElementById('editor-breadcrumb') ? document.getElementById('editor-breadcrumb').querySelector('span:last-child') : null;
            if(breadcrumbFile) breadcrumbFile.textContent = '';
        }
    }
}

// Bind close event to initial tabs
document.querySelectorAll('.tab-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(e.target.closest('.tab'));
    });
});

// Bind click event to initial tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const filename = tab.dataset.file;
        if (!filename) return;
        document.querySelectorAll('.tree-item.file').forEach(f => {
            f.classList.remove('selected');
            if(f.dataset.file === filename) f.classList.add('selected');
        });
        openFile(filename);
    });
});

// Activity bar Icons
const activityIcons = document.querySelectorAll('.activity-icon[data-view]');
const sidebarHeader = document.querySelector('.sidebar-header');
const sidebarViews = document.querySelectorAll('.sidebar-view');

const viewTitles = {
    'explorer': '📂 EXPLORER · WEB-PROJECT',
    'search': '🔍 SEARCH',
    'scm': '⎇ SOURCE CONTROL',
    'debug': '▶ RUN AND DEBUG',
    'extensions': '🔌 EXTENSIONS',
    'settings': '⚙ SETTINGS'
};

activityIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        // Remove active class from all icons
        document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
        icon.classList.add('active');
        
        const viewName = icon.dataset.view;
        if (!viewName) return;

        // Hide all views
        sidebarViews.forEach(view => {
            view.style.display = 'none';
        });

        // Show specific view
        const activeView = document.getElementById('view-' + viewName);
        if (activeView) {
            activeView.style.display = 'block';
        }

        // Update title
        if (sidebarHeader) {
            sidebarHeader.textContent = viewTitles[viewName] || viewName.toUpperCase();
        }
    });
});

// Menu bar
const menuItems = document.querySelectorAll('.window-menu .menu-item');
const dropdownMenus = document.querySelectorAll('.dropdown-menu');

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuName = item.dataset.menu;
        const dropdown = document.getElementById(menuName + '-menu');
        
        // Check if this dropdown is already visible
        const isVisible = dropdown.style.display === 'block';
        
        // Hide all dropdowns
        dropdownMenus.forEach(menu => menu.style.display = 'none');
        
        // Show the clicked dropdown only if it wasn't already visible
        if (dropdown && !isVisible) {
            dropdown.style.display = 'block';
            const rect = item.getBoundingClientRect();
            dropdown.style.left = rect.left + 'px';
        }
    });
});

// Hide dropdowns when clicking outside
document.addEventListener('click', () => {
    dropdownMenus.forEach(menu => menu.style.display = 'none');
});

// Dropdown menu items
const dropdownItems = document.querySelectorAll('.dropdown-menu .menu-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.textContent.split(' ')[0].toLowerCase(); // Get first word as action
        
        // Hide dropdown after click
        item.closest('.dropdown-menu').style.display = 'none';
        
        // Handle different menu actions
        switch(action) {
            case 'new':
                if (item.textContent.includes('File')) {
                    alert('Creating new file... (Ctrl+N)');
                } else if (item.textContent.includes('Window')) {
                    alert('Opening new window... (Ctrl+Shift+N)');
                }
                break;
            case 'open':
                if (item.textContent.includes('File')) {
                    alert('Opening file dialog... (Ctrl+O)');
                } else if (item.textContent.includes('Folder')) {
                    alert('Opening folder dialog... (Ctrl+K Ctrl+O)');
                }
                break;
            case 'save':
                if (item.textContent.includes('All')) {
                    alert('Saving all files... (Ctrl+K S)');
                } else {
                    alert('Saving file... (Ctrl+S)');
                }
                break;
            case 'exit':
                if (confirm('Exit VS Code?')) {
                    window.close();
                }
                break;
            case 'undo':
                alert('Undoing last action... (Ctrl+Z)');
                break;
            case 'redo':
                alert('Redoing last action... (Ctrl+Y)');
                break;
            case 'cut':
                alert('Cutting selection... (Ctrl+X)');
                break;
            case 'copy':
                alert('Copying selection... (Ctrl+C)');
                break;
            case 'paste':
                alert('Pasting from clipboard... (Ctrl+V)');
                break;
            case 'find':
                alert('Opening find dialog... (Ctrl+F)');
                break;
            case 'replace':
                alert('Opening replace dialog... (Ctrl+H)');
                break;
            case 'select':
                alert('Selecting all... (Ctrl+A)');
                break;
            case 'expand':
                alert('Expanding selection... (Shift+Alt+Right)');
                break;
            case 'shrink':
                alert('Shrinking selection... (Shift+Alt+Left)');
                break;
            case 'copy':
                if (item.textContent.includes('Up')) {
                    alert('Copying line up... (Shift+Alt+Up)');
                } else if (item.textContent.includes('Down')) {
                    alert('Copying line down... (Shift+Alt+Down)');
                }
                break;
            case 'move':
                if (item.textContent.includes('Up')) {
                    alert('Moving line up... (Alt+Up)');
                } else if (item.textContent.includes('Down')) {
                    alert('Moving line down... (Alt+Down)');
                }
                break;
            case 'command':
                alert('Opening command palette... (Ctrl+Shift+P)');
                break;
            case 'open':
                alert('Opening view...');
                break;
            case 'explorer':
                document.querySelector('[data-view="explorer"]').click();
                break;
            case 'search':
                document.querySelector('[data-view="search"]').click();
                break;
            case 'source':
                document.querySelector('[data-view="scm"]').click();
                break;
            case 'run':
                document.querySelector('[data-view="debug"]').click();
                break;
            case 'extensions':
                document.querySelector('[data-view="extensions"]').click();
                break;
            case 'terminal':
                alert('Opening terminal... (Ctrl+`)');
                break;
            case 'problems':
                alert('Showing problems panel... (Ctrl+Shift+M)');
                break;
            case 'output':
                alert('Showing output panel... (Ctrl+Shift+U)');
                break;
            case 'back':
                alert('Going back... (Alt+Left)');
                break;
            case 'forward':
                alert('Going forward... (Alt+Right)');
                break;
            case 'go':
                if (item.textContent.includes('File')) {
                    alert('Opening go to file... (Ctrl+P)');
                } else if (item.textContent.includes('Symbol')) {
                    alert('Opening go to symbol... (Ctrl+Shift+O)');
                } else if (item.textContent.includes('Line')) {
                    alert('Opening go to line... (Ctrl+G)');
                }
                break;
            case 'next':
                alert('Switching to next editor... (Ctrl+PageDown)');
                break;
            case 'previous':
                alert('Switching to previous editor... (Ctrl+PageUp)');
                break;
            case 'start':
                document.querySelector('#view-debug button').click();
                break;
            case 'run':
                if (item.textContent.includes('Without')) {
                    alert('Running without debugging... (Ctrl+F5)');
                }
                break;
            case 'stop':
                alert('Stopping debug session... (Shift+F5)');
                break;
            case 'open':
                if (item.textContent.includes('Configurations')) {
                    alert('Opening debug configurations...');
                }
                break;
            case 'add':
                alert('Adding debug configuration...');
                break;
            case 'new':
                if (item.textContent.includes('Terminal')) {
                    alert('Creating new terminal... (Ctrl+Shift+`)');
                }
                break;
            case 'split':
                alert('Splitting terminal... (Ctrl+Shift+5)');
                break;
            case 'run':
                if (item.textContent.includes('Task')) {
                    alert('Running task...');
                }
                break;
            case 'configure':
                alert('Configuring tasks...');
                break;
            case 'clear':
                alert('Clearing terminal...');
                break;
            case 'welcome':
                alert('Opening welcome page...');
                break;
            case 'show':
                alert('Showing all commands... (Ctrl+Shift+P)');
                break;
            case 'documentation':
                alert('Opening documentation...');
                break;
            case 'release':
                alert('Opening release notes...');
                break;
            case 'keyboard':
                alert('Opening keyboard shortcuts... (Ctrl+K Ctrl+S)');
                break;
            case 'about':
                alert('Showing about dialog...');
                break;
            default:
                alert(`Action: ${item.textContent.trim()}`);
        }
    });
});

// Search functionality
const searchInput = document.querySelector('#view-search input:first-child');
const replaceInput = document.querySelector('#view-search input:nth-child(2)');
const searchResults = document.querySelector('#view-search div:last-child');

if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        if (query.length > 0) {
            searchResults.textContent = `Searching for "${query}"... Found 3 matches in 2 files.`;
        } else {
            searchResults.textContent = 'Search details will appear here. No results found.';
        }
    });
}

// SCM functionality
const commitInput = document.querySelector('#view-scm input');
const commitBtn = document.querySelector('#view-scm button');
const changesHeader = document.querySelector('#view-scm div:nth-child(3)');
const changesList = document.querySelector('#view-scm div:nth-child(4)');

if (commitBtn) {
    commitBtn.addEventListener('click', () => {
        const message = commitInput.value;
        if (message.trim()) {
            alert(`Committed with message: "${message}"`);
            commitInput.value = '';
        } else {
            alert('Please enter a commit message');
        }
    });
}

if (changesHeader) {
    changesHeader.addEventListener('click', () => {
        const chevron = changesHeader.querySelector('.chevron');
        if (changesList.style.display === 'none') {
            changesList.style.display = 'flex';
            chevron.textContent = '▼';
        } else {
            changesList.style.display = 'none';
            chevron.textContent = '▶';
        }
    });
}

// Debug functionality
const runBtn = document.querySelector('#view-debug button');
if (runBtn) {
    runBtn.addEventListener('click', () => {
        alert('Starting debug session...');
    });
}

// Extensions functionality
const extSearchInput = document.querySelector('#view-extensions input');
if (extSearchInput) {
    extSearchInput.addEventListener('input', () => {
        const query = extSearchInput.value;
        if (query.length > 0) {
            alert(`Searching for extensions: "${query}"`);
        }
    });
}

// Settings functionality
const themeSelect = document.querySelector('#view-settings select:first-of-type');
const fontSizeInput = document.querySelector('#view-settings input');
const wordWrapSelect = document.querySelector('#view-settings select:last-of-type');

if (themeSelect) {
    themeSelect.addEventListener('change', () => {
        alert(`Theme changed to: ${themeSelect.value}`);
    });
}

if (fontSizeInput) {
    fontSizeInput.addEventListener('change', () => {
        alert(`Font size changed to: ${fontSizeInput.value}px`);
    });
}

if (wordWrapSelect) {
    wordWrapSelect.addEventListener('change', () => {
        alert(`Word wrap set to: ${wordWrapSelect.value}`);
    });
}

// Terminal tabs
const terminalTabs = document.querySelectorAll('.terminal-header span');
terminalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.terminal-header span').forEach(t => t.classList.remove('terminal-tab-active'));
        tab.classList.add('terminal-tab-active');
        alert(`Switched to: ${tab.textContent}`);
    });
});

// Theme switching
const themeToggle = document.getElementById('theme-toggle');
const themePicker = document.getElementById('theme-picker');
const themeItems = document.querySelectorAll('.theme-item');
const themeOrder = ['vs-dark', 'vs-light', 'hc-black'];
let currentTheme = 'vs-dark';

function labelForTheme(theme) {
    switch (theme) {
        case 'vs-light': return 'Light';
        case 'hc-black': return 'High Contrast';
        default: return 'Dark';
    }
}

function applyThemeToRoot(theme) {
    const root = document.documentElement;

    if (theme === 'vs-light') {
        root.style.setProperty('--vscode-editor-background', '#ffffff');
        root.style.setProperty('--vscode-editor-foreground', '#000000');
        root.style.setProperty('--vscode-activityBar-background', '#f3f3f3');
        root.style.setProperty('--vscode-activityBar-foreground', '#000000');
        root.style.setProperty('--vscode-activityBar-activeBorder', '#007acc');
        root.style.setProperty('--vscode-sideBar-background', '#f3f3f3');
        root.style.setProperty('--vscode-statusBar-background', '#007acc');
        root.style.setProperty('--vscode-statusBar-foreground', '#ffffff');
        root.style.setProperty('--vscode-titleBar-activeBackground', '#dddddd');
        root.style.setProperty('--vscode-titleBar-activeForeground', '#000000');
        root.style.setProperty('--vscode-tab-activeBackground', '#ffffff');
        root.style.setProperty('--vscode-tab-inactiveBackground', '#f3f3f3');
        root.style.setProperty('--vscode-panel-background', '#ffffff');
        root.style.setProperty('--vscode-panel-border', '#e0e0e0');
    } else if (theme === 'hc-black') {
        root.style.setProperty('--vscode-editor-background', '#000000');
        root.style.setProperty('--vscode-editor-foreground', '#ffffff');
        root.style.setProperty('--vscode-activityBar-background', '#000000');
        root.style.setProperty('--vscode-activityBar-foreground', '#ffffff');
        root.style.setProperty('--vscode-activityBar-activeBorder', '#ffff00');
        root.style.setProperty('--vscode-sideBar-background', '#000000');
        root.style.setProperty('--vscode-statusBar-background', '#ffffff');
        root.style.setProperty('--vscode-statusBar-foreground', '#000000');
        root.style.setProperty('--vscode-titleBar-activeBackground', '#000000');
        root.style.setProperty('--vscode-titleBar-activeForeground', '#ffffff');
        root.style.setProperty('--vscode-tab-activeBackground', '#000000');
        root.style.setProperty('--vscode-tab-inactiveBackground', '#111111');
        root.style.setProperty('--vscode-panel-background', '#000000');
        root.style.setProperty('--vscode-panel-border', '#444444');
    } else {
        // default: vs-dark
        root.style.setProperty('--vscode-editor-background', '#1e1e1e');
        root.style.setProperty('--vscode-editor-foreground', '#cccccc');
        root.style.setProperty('--vscode-activityBar-background', '#333333');
        root.style.setProperty('--vscode-activityBar-foreground', '#cccccc');
        root.style.setProperty('--vscode-activityBar-activeBorder', '#007acc');
        root.style.setProperty('--vscode-sideBar-background', '#252526');
        root.style.setProperty('--vscode-statusBar-background', '#007acc');
        root.style.setProperty('--vscode-statusBar-foreground', '#ffffff');
        root.style.setProperty('--vscode-titleBar-activeBackground', '#323233');
        root.style.setProperty('--vscode-titleBar-activeForeground', '#cccccc');
        root.style.setProperty('--vscode-tab-activeBackground', '#1e1e1e');
        root.style.setProperty('--vscode-tab-inactiveBackground', '#2d2d2d');
        root.style.setProperty('--vscode-panel-background', '#1e1e1e');
        root.style.setProperty('--vscode-panel-border', '#3e3e42');
    }
}

function switchTheme(theme) {
    currentTheme = themeOrder.includes(theme) ? theme : 'vs-dark';
    const monacoEditor = window.editor || window.monacoEditor;
    if (monacoEditor && window.monaco?.editor?.setTheme) {
        window.monaco.editor.setTheme(currentTheme);
    }

    applyThemeToRoot(currentTheme);
    themeItems.forEach(item => {
        item.classList.toggle('active', item.dataset.theme === currentTheme);
    });

    if (themeToggle) {
        themeToggle.textContent = `Theme · ${labelForTheme(currentTheme)}`;
    }

    try {
        localStorage.setItem('vscode-ui-theme', currentTheme);
    } catch (err) {
        // ignore storage errors (private mode)
    }
}

if (themeToggle && themePicker) {
    // Left click cycles through themes quickly
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = themeOrder.indexOf(currentTheme);
        const next = themeOrder[(idx + 1) % themeOrder.length];
        switchTheme(next);
    });

    // Right-click (or long press on touch) opens the picker for manual choice
    themeToggle.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        themePicker.style.display = themePicker.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (event) => {
        if (!themePicker.contains(event.target) && event.target !== themeToggle) {
            themePicker.style.display = 'none';
        }
    });
}

if (themeItems.length) {
    themeItems.forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.dataset.theme;
            switchTheme(theme);
            if (themePicker) {
                themePicker.style.display = 'none';
            }
        });
    });

    const savedTheme = (() => {
        try {
            return localStorage.getItem('vscode-ui-theme');
        } catch (err) {
            return null;
        }
    })();
    switchTheme(savedTheme || 'vs-dark');
}

// Initial Setup
document.getElementById('welcome-message').style.display = 'flex';
editorContents.style.display = 'none';

const initialActiveFile = document.querySelector('.tab.active');
if (initialActiveFile) {
    openFile(initialActiveFile.dataset.file);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl key combinations
    if (e.ctrlKey) {
        switch(e.key) {
            case 'n':
                if (e.shiftKey) {
                    alert('New Window (Ctrl+Shift+N)');
                } else {
                    alert('New File (Ctrl+N)');
                }
                e.preventDefault();
                break;
            case 'o':
                alert('Open File (Ctrl+O)');
                e.preventDefault();
                break;
            case 's':
                if (e.shiftKey) {
                    alert('Save As (Ctrl+Shift+S)');
                } else {
                    alert('Save (Ctrl+S)');
                }
                e.preventDefault();
                break;
            case 'z':
                alert('Undo (Ctrl+Z)');
                e.preventDefault();
                break;
            case 'y':
                alert('Redo (Ctrl+Y)');
                e.preventDefault();
                break;
            case 'x':
                alert('Cut (Ctrl+X)');
                e.preventDefault();
                break;
            case 'c':
                alert('Copy (Ctrl+C)');
                e.preventDefault();
                break;
            case 'v':
                alert('Paste (Ctrl+V)');
                e.preventDefault();
                break;
            case 'f':
                if (e.shiftKey) {
                    document.querySelector('[data-view="search"]').click();
                    alert('Search (Ctrl+Shift+F)');
                } else {
                    alert('Find (Ctrl+F)');
                }
                e.preventDefault();
                break;
            case 'h':
                alert('Replace (Ctrl+H)');
                e.preventDefault();
                break;
            case 'a':
                alert('Select All (Ctrl+A)');
                e.preventDefault();
                break;
            case 'p':
                if (e.shiftKey) {
                    alert('Command Palette (Ctrl+Shift+P)');
                } else {
                    alert('Go to File (Ctrl+P)');
                }
                e.preventDefault();
                break;
            case 'g':
                if (e.shiftKey) {
                    document.querySelector('[data-view="scm"]').click();
                    alert('Source Control (Ctrl+Shift+G)');
                } else {
                    alert('Go to Line (Ctrl+G)');
                }
                e.preventDefault();
                break;
            case 'd':
                if (e.shiftKey) {
                    document.querySelector('[data-view="debug"]').click();
                    alert('Debug (Ctrl+Shift+D)');
                }
                e.preventDefault();
                break;
            case 'x':
                if (e.shiftKey) {
                    document.querySelector('[data-view="extensions"]').click();
                    alert('Extensions (Ctrl+Shift+X)');
                }
                e.preventDefault();
                break;
            case 'e':
                if (e.shiftKey) {
                    document.querySelector('[data-view="explorer"]').click();
                    alert('Explorer (Ctrl+Shift+E)');
                }
                e.preventDefault();
                break;
            case 'm':
                if (e.shiftKey) {
                    alert('Problems (Ctrl+Shift+M)');
                }
                e.preventDefault();
                break;
            case 'u':
                if (e.shiftKey) {
                    alert('Output (Ctrl+Shift+U)');
                }
                e.preventDefault();
                break;
            case 'k':
                // Handle Ctrl+K combinations
                document.addEventListener('keydown', function handler(e2) {
                    if (e2.ctrlKey && e2.key === 'o') {
                        alert('Open Folder (Ctrl+K Ctrl+O)');
                        e2.preventDefault();
                    } else if (e2.ctrlKey && e2.key === 's') {
                        alert('Save All (Ctrl+K S)');
                        e2.preventDefault();
                    }
                    document.removeEventListener('keydown', handler);
                });
                e.preventDefault();
                break;
        }
    }
    
    // Alt key combinations
    if (e.altKey) {
        switch(e.key) {
            case 'ArrowLeft':
                alert('Go Back (Alt+Left)');
                e.preventDefault();
                break;
            case 'ArrowRight':
                alert('Go Forward (Alt+Right)');
                e.preventDefault();
                break;
        }
    }
    
    // F keys
    if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch(e.key) {
            case 'F5':
                document.querySelector('#view-debug button').click();
                e.preventDefault();
                break;
        }
    }
    
    // Shift+Alt combinations
    if (e.shiftKey && e.altKey) {
        switch(e.key) {
            case 'ArrowUp':
                alert('Copy Line Up (Shift+Alt+Up)');
                e.preventDefault();
                break;
            case 'ArrowDown':
                alert('Copy Line Down (Shift+Alt+Down)');
                e.preventDefault();
                break;
            case 'ArrowLeft':
                alert('Shrink Selection (Shift+Alt+Left)');
                e.preventDefault();
                break;
            case 'ArrowRight':
                alert('Expand Selection (Shift+Alt+Right)');
                e.preventDefault();
                break;
        }
    }
    
    // Alt combinations
    if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch(e.key) {
            case 'ArrowUp':
                alert('Move Line Up (Alt+Up)');
                e.preventDefault();
                break;
            case 'ArrowDown':
                alert('Move Line Down (Alt+Down)');
                e.preventDefault();
                break;
        }
    }
    
    // Special keys
    if (e.key === 'F4' && e.altKey) {
        if (confirm('Exit VS Code?')) {
            window.close();
        }
        e.preventDefault();
    }
});
