const fs = require('fs');
const path = require('path');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    ['prisma.employee.findMany({', 'prisma.client.findMany({', 'prisma.product.findMany({'].forEach(trigger => {
        let idx = 0;
        while ((idx = content.indexOf(trigger, idx)) !== -1) {
            const braceIdx = idx + trigger.length - 1; 
            const substr = content.substring(braceIdx, braceIdx + 150);
            if (substr.includes('where:')) {
                content = content.slice(0, braceIdx) + content.slice(braceIdx).replace(/where:\s*\{/, 'where: { deleted: false, ');
            } else {
                content = content.slice(0, braceIdx + 1) + ' where: { deleted: false }, ' + content.slice(braceIdx + 1);
            }
            idx += trigger.length;
        }
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed: ' + file);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walkDir(p);
        } else if (p.endsWith('page.tsx')) {
            processFile(p);
        }
    });
}
walkDir('src/app/(dashboard)');
