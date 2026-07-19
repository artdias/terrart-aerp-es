const fs = require('fs');
const path = require('path');

function fixSyntax(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix duplicated deleted: false
    content = content.replace(/deleted:\s*false,\s*deleted:\s*false/g, 'deleted: false');
    content = content.replace(/where:\s*\{\s*deleted:\s*false\s*\},?\s*where:\s*\{/g, 'where: { deleted: false, ');
    content = content.replace(/where:\s*\{\s*deleted:\s*false,\s*where:\s*\{/g, 'where: { deleted: false, ');
    
    // Fix multiple deleted: false
    while (content.includes('deleted: false, deleted: false')) {
        content = content.replace('deleted: false, deleted: false', 'deleted: false');
    }
    while (content.includes('deleted: false,  deleted: false')) {
        content = content.replace('deleted: false,  deleted: false', 'deleted: false');
    }
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Cleaned: ' + file);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walkDir(p);
        else if (p.endsWith('.tsx') || p.endsWith('.ts')) fixSyntax(p);
    });
}
walkDir('src/app');
